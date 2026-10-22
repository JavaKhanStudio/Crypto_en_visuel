// r339 lab: a parallax page (Simon's library, read by ../parallax/plax.js) as the BACKGROUND of episode 1.1's
// 3D valley, in place of its sky dome. Two ways to place the page's layers, so Simon can pick:
//   flat   (a) the libGDX backdrop: every layer a quad glued to the camera far behind the world, its bottom on
//          the valley's horizon, slid sideways by the camera's yaw and pan times its speed (fake depth, flat)
//   rings  (b) every layer a painted band around the valley, at a radius its speed gives (slow = far), so a
//          camera flight gets real parallax from perspective, nothing to drive
// Both keep the page's gradient as the sky (a sphere that follows the camera), tint the whole page from the
// episode's night to its dawn (world.setDawn), and melt each layer's lowest band and everything under the
// horizon into the scene's fog colour, so the 3D ground meets the painted hills with no seam.
import * as THREE from 'three';
import { loadPage, layerX, WORLD_W } from '../parallax/plax.js';

const NIGHT = new THREE.Color(0x30386e), DAWN = new THREE.Color(0xffd9bc);   // the page multiplied by these
const VH = 22.5;            // the page's height in its units, at 16:9: 40 wide (plax.js's WORLD_W)
const DEG = Math.PI / 180;

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
// into it like the dome's horizon did. A sphere around the camera, drawn first, behind everything.
function buildSky(page) {
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
  mesh.renderOrder = -10; mesh.frustumCulled = false;
  return { mesh, uniforms };
}

// The layer's place on the page: bottom edge and height in page units (decal_Y is a percent of the page's height).
const bottomOf = l => l.model.decal_Y_Ratio * VH / 100;

// The two knobs (sliders on the lab): in libGDX the page's bottom is the screen's bottom, its trees fill the lower
// half; here the 3D valley fills it, so the page is lowered (lift, page units) and squeezed (scale) to sit on the ridge.
export const KNOBS = { lift: -2, scale: .7 };
// The snowy ridge around the valley (world.js rawHeight: +46 x up to 1.5 past an ellipse) peaks near this height:
// both ways put the page's bottom on it, so the trees of the page stand on the 3D mountains, not under them.
const RIDGE = 50;

export async function buildBackdrop(world, camera, way, pageUrl = '../parallax/page/calm-day.jplax') {
  const page = await loadPage(pageUrl);
  const sky = buildSky(page); world.scene.add(sky.mesh);
  world.sky.children[0].visible = false;   // the episode's gradient dome; its stars and moon stay
  const stars = world.sky.userData.stars;   // drawn before the layers and leaving no depth, so the painted hills hide the stars behind them
  stars.renderOrder = -5; stars.material.depthWrite = false;
  const layers = page.layers.map((l, i) => ({ l, mat: layerMaterial(l, .08 + .5 * (1 - i / (page.layers.length - 1)) ** 2) }));
  const smin = Math.min(...page.layers.map(l => l.speed)), smax = Math.max(...page.layers.map(l => l.speed));
  const root = new THREE.Group(); root.name = 'backdrop-' + way;
  let layout = () => {};

  if (way === 'flat') {
    // (a) glued to the camera at D, just inside its far plane, so every 3D thing is in front; the terrain's depth hides them
    const D = 1400;
    camera.add(root); if (!camera.parent) world.scene.add(camera);
    for (const x of layers) { x.mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), x.mat); x.mesh.frustumCulled = false; x.mesh.renderOrder = x.l.i; root.add(x.mesh); }   // back to front, the page's order
    const fwd = new THREE.Vector3(), right = new THREE.Vector3(), p = new THREE.Vector3();
    const mid = page.layers.map(l => l.speed).sort((a, b) => a - b)[1];   // Mountains_big on calm-day
    let yaw0 = null, pan = 0, last = null;
    root.userData.update = seconds => {
      camera.getWorldDirection(fwd); fwd.y = 0; fwd.normalize();
      right.set(-fwd.z, 0, fwd.x);
      const yaw = Math.atan2(fwd.x, -fwd.z);
      if (yaw0 === null) yaw0 = yaw;
      if (last) pan += right.dot(p.copy(camera.position).sub(last));
      last = (last ?? new THREE.Vector3()).copy(camera.position);
      // the page's bottom sits on the valley's ridge, straight ahead
      p.copy(camera.position).addScaledVector(fwd, 260).setY(RIDGE).project(camera);
      const { lift, scale } = KNOBS;
      const halfH = D * Math.tan(camera.fov * DEG / 2), unit = 2 * halfH / VH * scale, VW = VH * camera.aspect / scale;
      const hfov = 2 * Math.atan(Math.tan(camera.fov * DEG / 2) * camera.aspect);
      // travel: a turn of the camera moves the mid layer like a thing at infinity; a pan moves the front one like the ring it would be in (b)
      const travel = (yaw - yaw0) * VW / hfov / mid + pan * VW / (2 * 330 * Math.tan(hfov / 2)) / smax;
      const base = p.y * halfH;
      for (const x of layers) {
        const l = x.l, u = x.mat.uniforms;
        x.mesh.scale.set(VW * unit, l.height * unit, 1);
        x.mesh.position.set(0, base + (bottomOf(l) + lift + l.height / 2) * unit, -D);
        u.rep.value = VW / l.width;
        u.off.value = -layerX(l, travel, seconds) / l.width;
      }
    };
  } else {
    // (b) a band per layer around the valley: radius from speed (front 330, past the terrain's corners; back 760),
    // its bottom at the elevation the page gives it, seen from the valley's centre at the ridge's height, its painting kept to its aspect
    const R0 = 330, R1 = 760, p = Math.log(R1 / R0) / Math.log(smax / smin), PER = 45 * DEG / VH;
    for (const x of layers) {
      x.r = R0 * (smax / x.l.speed) ** p; x.drift = x.l.atRest * x.l.speed;
      x.mesh = new THREE.Mesh(new THREE.CylinderGeometry(x.r, x.r, 1, 160, 1, true), x.mat);
      x.mesh.renderOrder = 1000 - Math.round(x.r);   // far first (the bands share a centre, so distance sorting cannot tell), after the stars
      root.add(x.mesh);
    }
    layout = () => {
      const { lift, scale } = KNOBS;
      for (const x of layers) {
        const l = x.l, r = x.r, e0 = (bottomOf(l) + lift) * PER * scale, e1 = e0 + l.height * PER * scale;
        const y0 = RIDGE + r * Math.tan(e0), h = r * (Math.tan(e1) - Math.tan(e0));
        x.mesh.scale.y = h; x.mesh.position.y = y0 + h / 2;
        x.mat.uniforms.rep.value = Math.max(1, Math.round(2 * Math.PI * r / (h * l.width / l.height)));
      }
    };
    layout();
    world.scene.add(root);
    root.userData.update = seconds => { for (const x of layers) x.mat.uniforms.off.value = -seconds * x.drift / x.l.width; };
  }

  const tint = new THREE.Color();
  const sync = () => {
    tint.copy(NIGHT).lerp(DAWN, world.dawn || 0);
    for (const x of layers) { x.mat.uniforms.tint.value.copy(tint); x.mat.uniforms.fogc.value.copy(world.scene.fog.color); }
    sky.uniforms.tint.value.copy(tint); sky.uniforms.fogc.value.copy(world.scene.fog.color);
  };
  return {
    page, root, layers,
    set(knobs) { Object.assign(KNOBS, knobs); layout(); },
    update(seconds) { sky.mesh.position.copy(camera.position); sync(); root.userData.update(seconds); },
  };
}
