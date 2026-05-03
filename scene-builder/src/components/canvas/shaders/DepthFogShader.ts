import { Effect, BlendFunction } from 'postprocessing';
import * as THREE from 'three';

// Exponential-squared depth fog — works on transparent objects unlike Three.js vertex fog
export const DEPTH_FOG_FRAGMENT_GLSL = /* glsl */`
  uniform sampler2D depthBuffer;
  uniform vec3 fogColor;
  uniform float fogNear;
  uniform float fogFar;
  uniform float fogDensity;
  uniform float cameraNear;
  uniform float cameraFar;

  float linearizeDepth(float depth) {
    float z = depth * 2.0 - 1.0;
    return (2.0 * cameraNear * cameraFar) / (cameraFar + cameraNear - z * (cameraFar - cameraNear));
  }

  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    float rawDepth   = texture2D(depthBuffer, uv).r;
    float linearDep  = linearizeDepth(rawDepth);

    // Exponential-squared fog gives more realistic atmospheric haze
    float fogFactor  = exp(-pow(max(0.0, linearDep - fogNear) * fogDensity, 2.0));
    fogFactor        = clamp(fogFactor, 0.0, 1.0);

    // Sky / far plane: no fog blending
    if (rawDepth >= 0.9999) {
      outputColor = inputColor;
      return;
    }

    vec3 finalColor = mix(fogColor, inputColor.rgb, fogFactor);
    outputColor = vec4(finalColor, inputColor.a);
  }
`;

export interface DepthFogEffectOptions {
  fogColor?: THREE.Color;
  fogNear?: number;
  fogFar?: number;
  fogDensity?: number;
  blendFunction?: BlendFunction;
}

export class DepthFogEffect extends Effect {
  constructor(options: DepthFogEffectOptions = {}) {
    const {
      fogColor   = new THREE.Color('#c8d8e8'),
      fogNear    = 5.0,
      fogFar     = 30.0,
      fogDensity = 0.05,
      blendFunction = BlendFunction.NORMAL,
    } = options;

    super('DepthFogEffect', DEPTH_FOG_FRAGMENT_GLSL, {
      blendFunction,
      uniforms: new Map<string, THREE.Uniform>([
        ['depthBuffer',  new THREE.Uniform(null)],
        ['fogColor',     new THREE.Uniform(fogColor)],
        ['fogNear',      new THREE.Uniform(fogNear)],
        ['fogFar',       new THREE.Uniform(fogFar)],
        ['fogDensity',   new THREE.Uniform(fogDensity)],
        ['cameraNear',   new THREE.Uniform(0.1)],
        ['cameraFar',    new THREE.Uniform(100)],
      ]),
    });
  }

  setFogColor(color: THREE.Color) {
    (this.uniforms.get('fogColor')!.value as THREE.Color).copy(color);
  }

  setFogDensity(density: number) {
    this.uniforms.get('fogDensity')!.value = density;
  }

  setCameraClip(near: number, far: number) {
    this.uniforms.get('cameraNear')!.value = near;
    this.uniforms.get('cameraFar')!.value  = far;
  }
}
