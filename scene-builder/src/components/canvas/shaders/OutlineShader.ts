import { Effect, BlendFunction } from 'postprocessing';
import * as THREE from 'three';

export const OUTLINE_FRAGMENT_GLSL = /* glsl */`
  uniform sampler2D selectionTexture;
  uniform vec3 outlineColor;
  uniform float outlineThickness;
  uniform vec2 texelSize;

  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    float id  = texture2D(selectionTexture, uv).r;
    float idx = texture2D(selectionTexture, uv + vec2(texelSize.x * outlineThickness, 0.0)).r;
    float idy = texture2D(selectionTexture, uv + vec2(0.0, texelSize.y * outlineThickness)).r;
    float idxn = texture2D(selectionTexture, uv - vec2(texelSize.x * outlineThickness, 0.0)).r;
    float idyn = texture2D(selectionTexture, uv - vec2(0.0, texelSize.y * outlineThickness)).r;

    // Roberts cross edge detection
    float edge = step(0.008, abs(id - idx) + abs(id - idy) + abs(id - idxn) + abs(id - idyn));

    // Only draw outline where there IS a selection (id > 0) or adjacent to one
    float selected = max(id, max(idx, max(idy, max(idxn, idyn))));
    float drawOutline = edge * selected;

    vec3 color = mix(inputColor.rgb, outlineColor, drawOutline);
    outputColor = vec4(color, inputColor.a);
  }
`;

export interface OutlineEffectOptions {
  outlineColor?: THREE.Color;
  outlineThickness?: number;
  blendFunction?: BlendFunction;
}

export class OutlineEffect extends Effect {
  selectionRenderTarget: THREE.WebGLRenderTarget;

  constructor(options: OutlineEffectOptions = {}) {
    const {
      outlineColor = new THREE.Color('#ffaa00'),
      outlineThickness = 2.0,
      blendFunction = BlendFunction.NORMAL,
    } = options;

    const selectionTexture = new THREE.Texture();
    const texelSize = new THREE.Vector2(1 / 1024, 1 / 768);

    super('OutlineEffect', OUTLINE_FRAGMENT_GLSL, {
      blendFunction,
      uniforms: new Map<string, THREE.Uniform>([
        ['selectionTexture', new THREE.Uniform(selectionTexture)],
        ['outlineColor',     new THREE.Uniform(outlineColor)],
        ['outlineThickness', new THREE.Uniform(outlineThickness)],
        ['texelSize',        new THREE.Uniform(texelSize)],
      ]),
    });

    this.selectionRenderTarget = new THREE.WebGLRenderTarget(1024, 768, {
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      format: THREE.RGBAFormat,
    });

    this.uniforms.get('selectionTexture')!.value = this.selectionRenderTarget.texture;
  }

  setSize(width: number, height: number) {
    this.selectionRenderTarget.setSize(width, height);
    (this.uniforms.get('texelSize')!.value as THREE.Vector2).set(1 / width, 1 / height);
  }

  setSelectionTexture(texture: THREE.Texture) {
    this.uniforms.get('selectionTexture')!.value = texture;
  }

  setOutlineColor(color: THREE.Color) {
    (this.uniforms.get('outlineColor')!.value as THREE.Color).copy(color);
  }

  dispose() {
    this.selectionRenderTarget.dispose();
    super.dispose();
  }
}
