// The saga's sky (r449, Simon's picks on r339: way b, rings; calm-day; tinted night to dawn): a parallax page of
// Simon's library (calm-day, read by ../plax.js) painted around the valley in place of the old gradient dome.
// Each layer of the page is a band around the valley at a radius its speed gives (slow = far, 330 to 760 units),
// so a camera flight gets real parallax from perspective, nothing to drive; the 3D ridge stays in front. The
// page's two gradients are the sky behind them, on a sphere that follows the camera. The whole page is
// multiplied from NIGHT to DAWN with world.dawn, and each band's lowest part and everything under the horizon
// melt into the scene's fog colour, so the 3D ground meets the painted hills with no seam.
// buildWorld() calls buildSky(world) once; it loads the page (fetched once for the series, assets/parallax/) and
// hides the old dome when the bands are in; until then, or if the page fails to load, the dome stays.
// lab/parallax-sky/ imports this file (KNOBS, its sliders), never a fork.
import * as THREE from 'three';
import { loadPage } from '../plax.js';

export const PAGE = new URL('../../assets/parallax/calm-day/calm-day.jplax', import.meta.url).href;
const NIGHT = new THREE.Color(0x30386e), DAWN = new THREE.Color(0xffd9bc);   // the page multiplied by these
const VH = 22.5;            // the page's height in its units, at 16:9: 40 wide (plax.js's WORLD_W)
const DEG = Math.PI / 180;
// Where the page sits (the lab's two sliders): lowered (lift, page units) and squeezed (scale), so the trees of the
// page stand on the 3D mountains, not under them.
export const KNOBS = { lift: -2, scale: .7 };
// The snowy ridge around the valley (world.js rawHeight: +46 x up to 1.5 past an ellipse) peaks near this height:
// the page's bottom is put on it.
const RIDGE = 50;   // r621: a candidate map of world.js (?map=) gives its own, world.ridge
const R0 = 330, R1 = 760;   // the front band (past the terrain's corners) and the back one

const LAYER_VS = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }';
const LAYER_FS = `uniform sampler2D map; uniform vec3 tint, fogc; uniform float haze, rep, off, fade; varying vec2 vUv;
  void main(){
    vec4 t = texture2D(map, vec2(vUv.x * rep + off, vUv.y));
    if (t.a < .02) discard;
    float f = haze + (1. - haze) * (1. - smoothstep(0., fade, vUv.y));   // the lowest band melts into the fog
    gl_FragColor = vec4(mix(t.rgb * tint, fogc, f), t.a);
  }`;
function layerMaterial(l, haze) {
  l.texture.wrapS = THREE.RepeatWrapping; l.texture.needsUpdate = true;
  return new THREE.ShaderMaterial({
    uniforms: { map: { value: l.texture }, tint: { value: new THREE.Color(1, 1, 1) }, fogc: { value: new THREE.Color() },
      haze: { value: haze }, rep: { value: 1 }, off: { value: 0 }, fade: { value: .22 } },
    vertexShader: LAYER_VS, fragmentShader: LAYER_FS, transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide,
  });
}

// The page's two gradients as the sky, by elevation: under the horizon it is the fog, so the ground's far edge fades
// into it like the dome's horizon did. A sphere around the camera (moved there just before it is drawn), behind everything.
function gradientSky(page) {
  const g = page.gradients;
  const uniforms = { top: { value: g.top[0].clone() }, mid: { value: g.top[1].clone() }, low: { value: g.bottom[0].clone() },
    tint: { value: new THREE.Color(1, 1, 1) }, fogc: { value: new THREE.Color() }, horizon: { value: 0 } };
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1300, 32, 16), new THREE.ShaderMaterial({
    uniforms, side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
    fragmentShader: `uniform vec3 top, mid, low, tint, fogc; uniform float horizon; varying vec3 vP;
      void main(){ float e = vP.y - horizon;
        vec3 c = mix(low, mid, smoothstep(0., .25, e)); c = mix(c, top, smoothstep(.25, .8, e)); c *= tint;
        gl_FragColor = vec4(mix(c, fogc, 1. - smoothstep(-.02, .12, e)), 1.); }`,
  }));
  mesh.name = 'sky-gradient'; mesh.renderOrder = -10; mesh.frustumCulled = false;
  // the renderer computes the model-view matrix after this hook, so the sphere is centred on whichever camera draws it
  mesh.onBeforeRender = (r, s, camera) => { mesh.position.copy(camera.position); mesh.updateMatrixWorld(); };
  return { mesh, uniforms };
}

// The layer's place on the page: bottom edge in page units (decal_Y is a percent of the page's height).
const bottomOf = l => l.model.decal_Y_Ratio * VH / 100;

// Builds the sky into world.scene; resolves to the sky (set, tint, update), or null when the page could not load.
export async function buildSky(world, pageUrl = PAGE) {
  let page;
  try { page = await loadPage(pageUrl); } catch (e) { console.warn('saga sky: the page did not load, the dome stays', e); return null; }
  const grad = gradientSky(page);
  // r621: a map may keep only some of the page's bands (world.skyBands, region names), each once, set down so the
  // lowest one kept stands where the page's lowest stood
  const keep = world.skyBands, kept = keep ? page.layers.filter((l, i, all) => keep.includes(l.region.name)
    && all.findIndex(m => m.region.name === l.region.name) === i) : page.layers;
  const base = keep ? Math.min(...kept.map(bottomOf)) - Math.min(...page.layers.map(bottomOf)) : 0;
  const layers = kept.map((l, i) => ({ l, mat: layerMaterial(l, .08 + .5 * (1 - i / Math.max(1, kept.length - 1)) ** 2) }));
  const smin = Math.min(...kept.map(l => l.speed)), smax = Math.max(...kept.map(l => l.speed));
  const root = new THREE.Group(); root.name = 'sky-rings';
  const p = Math.log(R1 / R0) / Math.log(smax / smin), PER = 45 * DEG / VH;
  for (const x of layers) {
    x.r = R0 * (smax / x.l.speed) ** p; x.drift = x.l.atRest * x.l.speed;
    x.mesh = new THREE.Mesh(new THREE.CylinderGeometry(x.r, x.r, 1, 160, 1, true), x.mat);
    x.mesh.renderOrder = 1000 - Math.round(x.r);   // far first (the bands share a centre, so distance sorting cannot tell), after the stars
    x.mesh.frustumCulled = false;
    root.add(x.mesh);
  }
  // each band's bottom at the elevation the page gives it, seen from the valley's centre at the ridge's height,
  // its painting kept to its aspect
  const layout = () => {
    const { lift, scale } = KNOBS, ridge = world.ridge ?? RIDGE;
    for (const x of layers) {
      const l = x.l, r = x.r, e0 = (bottomOf(l) - base + lift) * PER * scale, e1 = e0 + l.height * PER * scale;
      const y0 = ridge + r * Math.tan(e0), h = r * (Math.tan(e1) - Math.tan(e0));
      x.mesh.scale.y = h; x.mesh.position.y = y0 + h / 2;
      x.mat.uniforms.rep.value = Math.max(1, Math.round(2 * Math.PI * r / (h * l.width / l.height)));
    }
  };
  layout();
  const dome = world.sky.children[0], stars = world.sky.userData.stars;
  // the stars are drawn before the bands and leave no depth, so the painted hills hide the stars behind them
  stars.renderOrder = -5; stars.material.depthWrite = false;
  dome.visible = false;
  world.sky.add(grad.mesh, root);
  const t = new THREE.Color();
  const sky = {
    page, root, layers, gradient: grad,
    set(knobs) { Object.assign(KNOBS, knobs); layout(); },
    // the page from night to dawn, its fog the scene's (world.setDawn calls it)
    tint() {
      t.copy(NIGHT).lerp(DAWN, world.dawn || 0);
      for (const x of layers) { x.mat.uniforms.tint.value.copy(t); x.mat.uniforms.fogc.value.copy(world.scene.fog.color); }
      grad.uniforms.tint.value.copy(t); grad.uniforms.fogc.value.copy(world.scene.fog.color);
    },
    // each band drifts at its own speed at rest, as the page does in libGDX (world.update calls it)
    update(seconds) { for (const x of layers) x.mat.uniforms.off.value = -seconds * x.drift / x.l.width; },
  };
  sky.tint();
  return sky;
}
