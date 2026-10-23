// r548: the series' glow (r22), at the cost of the glow alone. three's UnrealBloomPass ends by adding its
// half-resolution result back over the scene, a full-screen draw into the composer's target, and that target
// is the HD level's 4x MSAA one (lib/quality.js, r254): every pixel of the screen written four times, then the
// whole target resolved again for the output pass. Here the bloom stops at its own (small) texture and the
// output pass adds it while it tone-maps, so the full-screen MSAA blend and its second resolve are gone. The
// picture is the same: the blend was dst + bloom.rgb * bloom.a (AdditiveBlending), and so is the sum here.
//     import { qualityComposer, addBloom } from '../../lib/episode.js';
//     composer.addPass(new RenderPass(scene, camera));
//     addBloom(composer, .75, .55, .82);   // in place of the UnrealBloomPass and the OutputPass
import { Vector2 } from 'three';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

// UnrealBloomPass.render without its last step (the blend over readBuffer): the bloom is left in
// renderTargetsHorizontal[0], which the output pass reads
// r542 (Simon's pick B): on a HiDPI screen (the composer at pixel ratio 2 or more) the bloom works on half the
// canvas: 4-5 ms a frame saved there, and its halos keep the on-screen size a pixel-ratio-1 screen shows.
// bloom.scale set by hand (tools/bloom_probe.py, bloom_shots.py) overrides it.
class Bloom extends UnrealBloomPass {
  setSize(width, height) {
    const s = this.scale ?? (this.composer?._pixelRatio >= 2 ? .5 : 1);
    super.setSize(Math.round(width * s), Math.round(height * s));
  }
  render(renderer, writeBuffer, readBuffer) {
    renderer.getClearColor(this._oldClearColor);
    this.oldClearAlpha = renderer.getClearAlpha();
    const oldAutoClear = renderer.autoClear;
    renderer.autoClear = false;
    renderer.setClearColor(this.clearColor, 0);
    // 1. the bright parts, at half resolution
    this.highPassUniforms.tDiffuse.value = readBuffer.texture;
    this.highPassUniforms.luminosityThreshold.value = this.threshold;
    this.fsQuad.material = this.materialHighPassFilter;
    renderer.setRenderTarget(this.renderTargetBright); renderer.clear(); this.fsQuad.render(renderer);
    // 2. blurred down the five mips
    let input = this.renderTargetBright;
    for (let i = 0; i < this.nMips; i++) {
      const m = this.separableBlurMaterials[i];
      this.fsQuad.material = m;
      m.uniforms.colorTexture.value = input.texture; m.uniforms.direction.value = UnrealBloomPass.BlurDirectionX;
      renderer.setRenderTarget(this.renderTargetsHorizontal[i]); renderer.clear(); this.fsQuad.render(renderer);
      m.uniforms.colorTexture.value = this.renderTargetsHorizontal[i].texture; m.uniforms.direction.value = UnrealBloomPass.BlurDirectionY;
      renderer.setRenderTarget(this.renderTargetsVertical[i]); renderer.clear(); this.fsQuad.render(renderer);
      input = this.renderTargetsVertical[i];
    }
    // 3. the mips summed into one half-resolution texture
    this.fsQuad.material = this.compositeMaterial;
    this.compositeMaterial.uniforms.bloomStrength.value = this.strength;
    this.compositeMaterial.uniforms.bloomRadius.value = this.radius;
    this.compositeMaterial.uniforms.bloomTintColors.value = this.bloomTintColors;
    renderer.setRenderTarget(this.renderTargetsHorizontal[0]); renderer.clear(); this.fsQuad.render(renderer);
    renderer.setClearColor(this._oldClearColor, this.oldClearAlpha);
    renderer.autoClear = oldAutoClear;
  }
}
Bloom.prototype.isBloom = true;

// OutputPass, with the bloom added before the tone mapping (where the blend used to leave it)
class BloomOutput extends OutputPass {
  constructor(bloom) {
    super();
    this.bloom = bloom;
    this.uniforms.tBloom = { value: bloom.renderTargetsHorizontal[0].texture };
    this.uniforms.bloomOn = { value: 1 };
    this.material.fragmentShader = this.material.fragmentShader
      .replace('uniform sampler2D tDiffuse;', 'uniform sampler2D tDiffuse;\nuniform sampler2D tBloom;\nuniform float bloomOn;')
      .replace('gl_FragColor = texture2D( tDiffuse, vUv );',
        'gl_FragColor = texture2D( tDiffuse, vUv );\n\tvec4 b = texture2D( tBloom, vUv );\n\tgl_FragColor.rgb += b.rgb * b.a * bloomOn;');
  }
  render(renderer, writeBuffer, readBuffer, deltaTime, maskActive) {
    this.uniforms.bloomOn.value = this.bloom.enabled ? 1 : 0;   // tools/scene_cost.py switches the bloom off alone
    super.render(renderer, writeBuffer, readBuffer, deltaTime, maskActive);
  }
}

// the bloom and the output pass, after the episode's RenderPass; returns the bloom (its strength, radius, threshold)
export function addBloom(composer, strength, radius, threshold) {
  const bloom = new Bloom(new Vector2(1, 1), strength, radius, threshold);
  bloom.composer = composer;
  composer.addPass(bloom);
  composer.addPass(new BloomOutput(bloom));
  return bloom;
}
