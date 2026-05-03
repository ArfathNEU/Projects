import { Effect, BlendFunction } from 'postprocessing';
import * as THREE from 'three';

// Screen-space ambient occlusion — hemisphere sampling in view space
export const AO_FRAGMENT_GLSL = /* glsl */`
  uniform sampler2D depthBuffer;
  uniform mat4 projectionMatrix;
  uniform mat4 inverseProjectionMatrix;
  uniform vec3 kernel[16];
  uniform float radius;
  uniform float bias;
  uniform float intensity;
  uniform vec2 texelSize;
  uniform float cameraNear;
  uniform float cameraFar;

  float linearizeDepth(float depth) {
    float z = depth * 2.0 - 1.0;
    return (2.0 * cameraNear * cameraFar) / (cameraFar + cameraNear - z * (cameraFar - cameraNear));
  }

  vec3 reconstructViewPos(vec2 uv, float depth) {
    vec4 clip = vec4(uv * 2.0 - 1.0, depth * 2.0 - 1.0, 1.0);
    vec4 view = inverseProjectionMatrix * clip;
    return view.xyz / view.w;
  }

  // Simple normal reconstruction from depth differences
  vec3 reconstructNormal(vec2 uv) {
    float dL = texture2D(depthBuffer, uv - vec2(texelSize.x, 0.0)).r;
    float dR = texture2D(depthBuffer, uv + vec2(texelSize.x, 0.0)).r;
    float dD = texture2D(depthBuffer, uv - vec2(0.0, texelSize.y)).r;
    float dU = texture2D(depthBuffer, uv + vec2(0.0, texelSize.y)).r;

    vec3 posL = reconstructViewPos(uv - vec2(texelSize.x, 0.0), dL);
    vec3 posR = reconstructViewPos(uv + vec2(texelSize.x, 0.0), dR);
    vec3 posD = reconstructViewPos(uv - vec2(0.0, texelSize.y), dD);
    vec3 posU = reconstructViewPos(uv + vec2(0.0, texelSize.y), dU);

    return normalize(cross(posR - posL, posU - posD));
  }

  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    float depth = texture2D(depthBuffer, uv).r;
    if (depth >= 0.9999) {
      outputColor = inputColor;
      return;
    }

    vec3 fragPos = reconstructViewPos(uv, depth);
    vec3 normal  = reconstructNormal(uv);

    // Build TBN to orient kernel to surface normal
    vec3 randomVec = normalize(vec3(uv * 100.0, 0.0));
    vec3 tangent   = normalize(randomVec - normal * dot(randomVec, normal));
    vec3 bitangent = cross(normal, tangent);
    mat3 TBN       = mat3(tangent, bitangent, normal);

    float occlusion = 0.0;
    for (int i = 0; i < 16; i++) {
      vec3 samplePos = TBN * kernel[i];
      samplePos = fragPos + samplePos * radius;

      // Project sample to get UV
      vec4 offset = projectionMatrix * vec4(samplePos, 1.0);
      offset.xyz /= offset.w;
      offset.xyz  = offset.xyz * 0.5 + 0.5;

      float sampleDepth = texture2D(depthBuffer, offset.xy).r;
      vec3  sampleView  = reconstructViewPos(offset.xy, sampleDepth);

      float rangeCheck = smoothstep(0.0, 1.0, radius / abs(fragPos.z - sampleView.z));
      occlusion += (sampleView.z >= samplePos.z + bias ? 1.0 : 0.0) * rangeCheck;
    }

    occlusion = 1.0 - (occlusion / 16.0) * intensity;
    outputColor = vec4(inputColor.rgb * occlusion, inputColor.a);
  }
`;

function generateSSAOKernel(size = 16): Float32Array {
  const kernel = new Float32Array(size * 3);
  for (let i = 0; i < size; i++) {
    const sample = new THREE.Vector3(
      Math.random() * 2 - 1,
      Math.random() * 2 - 1,
      Math.random()
    ).normalize();
    sample.multiplyScalar(Math.random());
    // Accelerating interpolation toward origin
    let scale = i / size;
    scale = 0.1 + scale * scale * 0.9;
    sample.multiplyScalar(scale);
    kernel[i * 3]     = sample.x;
    kernel[i * 3 + 1] = sample.y;
    kernel[i * 3 + 2] = sample.z;
  }
  return kernel;
}

export interface AOEffectOptions {
  radius?: number;
  bias?: number;
  intensity?: number;
  blendFunction?: BlendFunction;
}

export class AOEffect extends Effect {
  constructor(options: AOEffectOptions = {}) {
    const {
      radius = 0.5,
      bias = 0.025,
      intensity = 1.0,
      blendFunction = BlendFunction.NORMAL,
    } = options;

    const kernelData = generateSSAOKernel(16);
    const kernel: THREE.Vector3[] = [];
    for (let i = 0; i < 16; i++) {
      kernel.push(new THREE.Vector3(kernelData[i * 3], kernelData[i * 3 + 1], kernelData[i * 3 + 2]));
    }

    super('AOEffect', AO_FRAGMENT_GLSL, {
      blendFunction,
      uniforms: new Map<string, THREE.Uniform>([
        ['depthBuffer',           new THREE.Uniform(null)],
        ['projectionMatrix',      new THREE.Uniform(new THREE.Matrix4())],
        ['inverseProjectionMatrix', new THREE.Uniform(new THREE.Matrix4())],
        ['kernel',                new THREE.Uniform(kernel)],
        ['radius',                new THREE.Uniform(radius)],
        ['bias',                  new THREE.Uniform(bias)],
        ['intensity',             new THREE.Uniform(intensity)],
        ['texelSize',             new THREE.Uniform(new THREE.Vector2(1 / 1024, 1 / 768))],
        ['cameraNear',            new THREE.Uniform(0.1)],
        ['cameraFar',             new THREE.Uniform(100)],
      ]),
    });
  }

  setSize(width: number, height: number) {
    (this.uniforms.get('texelSize')!.value as THREE.Vector2).set(1 / width, 1 / height);
  }

  update(_renderer: THREE.WebGLRenderer, _inputBuffer: THREE.WebGLRenderTarget, _deltaTime: number) {
    // Depth texture and camera matrices injected by SceneCanvas each frame
  }
}
