// Short-lived effects: particle bursts, shock rings, floating icons, fireworks.
// Each effect registers itself and is removed when its life runs out.
import * as THREE from 'three';

const live = [];
let scene;
export function initFx(s) { scene = s; }

export function updateFx(dt) {
  for (let i = live.length - 1; i >= 0; i--) {
    const e = live[i]; e.age += dt;
    if (e.age >= e.life) { scene.remove(e.obj); e.dispose?.(); live.splice(i, 1); continue; }
    e.step(e.age / e.life, dt);
  }
}

// A spray of glowing points, e.g. gold at a gate, red at a capture.
export function burst(pos, color, { count = 70, speed = 9, life = 1.4, up = 6, size = .5, gravity = 14 } = {}) {
  const g = new THREE.BufferGeometry(), p = new Float32Array(count * 3), vel = [];
  for (let i = 0; i < count; i++) {
    p.set([pos.x, pos.y, pos.z], i * 3);
    const v = new THREE.Vector3(Math.random() - .5, Math.random() * .8 + .2, Math.random() - .5).normalize().multiplyScalar(speed * (.4 + Math.random() * .8));
    v.y += up * Math.random(); vel.push(v);
  }
  g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  const m = new THREE.PointsMaterial({ color, size, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
  const obj = new THREE.Points(g, m); scene.add(obj);
  live.push({ obj, age: 0, life, dispose: () => { g.dispose(); m.dispose(); }, step(k, dt) {
    const a = g.attributes.position;
    for (let i = 0; i < count; i++) { vel[i].y -= gravity * dt; a.setXYZ(i, a.getX(i) + vel[i].x * dt, a.getY(i) + vel[i].y * dt, a.getZ(i) + vel[i].z * dt); }
    a.needsUpdate = true; m.opacity = 1 - k * k;
  } });
}

// A flat ring that expands and fades on the ground.
export function ring(pos, color, { radius = 8, life = 1.1 } = {}) {
  const m = new THREE.MeshBasicMaterial({ color, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const obj = new THREE.Mesh(new THREE.RingGeometry(.8, 1, 48), m);
  obj.rotation.x = -Math.PI / 2; obj.position.copy(pos).y += .4; scene.add(obj);
  live.push({ obj, age: 0, life, dispose: () => { obj.geometry.dispose(); m.dispose(); }, step(k) { obj.scale.setScalar(1 + k * radius); m.opacity = 1 - k; } });
}

// A glyph drawn on a canvas, floating up above a point: ✔ ✖ 🔒 ✉ …
const glyphCache = {};
function glyphTexture(glyph, color) {
  const key = glyph + color;
  if (glyphCache[key]) return glyphCache[key];
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const x = c.getContext('2d');
  x.fillStyle = 'rgba(10,10,20,.75)'; x.beginPath(); x.arc(64, 64, 58, 0, Math.PI * 2); x.fill();
  x.lineWidth = 6; x.strokeStyle = color; x.stroke();
  x.fillStyle = color; x.font = 'bold 72px system-ui, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(glyph, 64, 70);
  return glyphCache[key] = new THREE.CanvasTexture(c);
}
export function icon(pos, glyph, color = '#ffffff', { life = 2.2, size = 5, rise = 6 } = {}) {
  const m = new THREE.SpriteMaterial({ map: glyphTexture(glyph, color), transparent: true, depthTest: false });
  const obj = new THREE.Sprite(m); obj.position.copy(pos); obj.renderOrder = 10; scene.add(obj);
  const y0 = pos.y;
  live.push({ obj, age: 0, life, dispose: () => m.dispose(), step(k) {
    const pop = k < .15 ? k / .15 : 1;
    obj.scale.setScalar(size * (pop < 1 ? 1.25 * Math.sin(pop * Math.PI / 2) : 1));
    obj.position.y = y0 + rise * (1 - Math.pow(1 - k, 3));
    m.opacity = k > .75 ? 1 - (k - .75) / .25 : 1;
  } });
}

// Fireworks over a point, for the victory at dawn.
export function fireworks(center, colors, n = 10) {
  for (let i = 0; i < n; i++) setTimeout(() => {
    const p = center.clone().add(new THREE.Vector3((Math.random() - .5) * 60, 30 + Math.random() * 25, (Math.random() - .5) * 30));
    burst(p, colors[i % colors.length], { count: 140, speed: 16, up: 0, life: 2, size: .9, gravity: 5 });
  }, i * 260);
}

// An object thrown along an arc (the captured scroll flying to Eve's tower).
export function arc(obj, from, to, { height = 18, life = 1.3, onEnd } = {}) {
  scene.add(obj);
  live.push({ obj, age: 0, life, dispose: onEnd, step(k) {
    obj.position.lerpVectors(from, to, k); obj.position.y += Math.sin(Math.PI * k) * height;
    obj.rotation.x += .3; obj.rotation.z += .2;
  } });
}
