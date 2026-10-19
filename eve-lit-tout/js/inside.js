// Inside a castle (r103): a step that explains a mechanism zooms the camera into a lit window of the
// keep, and a second scene, a room, shows the machine at work. enter() flies to the window, veils the
// screen, swaps what the composer draws, and dollies in; leave() does it backwards, then the story
// flies out to its shot. One room so far: 'aes', AES on the first 16 bytes of the order (aes.js).
import * as THREE from 'three';
import { t } from './i18n.js';
import { CASTLE_A } from './world.js';
import * as A from './aes.js';

const v = (x, y, z) => new THREE.Vector3(x, y, z);
const ease = k => k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
const clamp01 = k => Math.max(0, Math.min(1, k));
const span = (time, a, b) => ease(clamp01((time - a) / (b - a)));

// the upper lit window of Alice's keep on the valley side (+z), y 9 above the plateau: the way in.
// From the castleA shot it is a straight push, clear of the towers' roofs.
const WINDOW = () => v(CASTLE_A.x, CASTLE_A.y + 9, 3.52);
export const DOORS = {
  a: () => ({ near: { pos: v(CASTLE_A.x + 3, CASTLE_A.y + 12.5, 16), target: WINDOW() },
              at: { pos: v(CASTLE_A.x + .1, CASTLE_A.y + 9.05, 4.5), target: WINDOW() } }),
};

// a square tile with a byte on it: a letter of the order, or two hex digits
function tileTex(text, { fg, bg, size = 74 }) {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, 128, 128);
  g.strokeStyle = fg; g.globalAlpha = .55; g.lineWidth = 6; g.strokeRect(5, 5, 118, 118); g.globalAlpha = 1;
  g.fillStyle = fg; g.font = `700 ${size}px ui-monospace, Menlo, Consolas, monospace`;
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 64, 68);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  return tex;
}
// a word floating in the room, always facing the camera
function label(text, color, h = 1.1) {
  const c = document.createElement('canvas'), g = c.getContext('2d'), font = '600 56px system-ui, sans-serif';
  g.font = font; c.width = Math.ceil(g.measureText(text).width) + 40; c.height = 84;
  g.font = font; g.fillStyle = color; g.textBaseline = 'middle'; g.fillText(text, 20, 44);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  s.scale.set(h * c.width / c.height, h, 1); s.userData.text = text;
  return s;
}
const hx = x => x.toString(16).padStart(2, '0');

// ---------- the room ----------
function buildRoom(scene) {
  scene.background = new THREE.Color(0x120c08);
  scene.fog = new THREE.Fog(0x120c08, 30, 70);
  scene.add(new THREE.HemisphereLight(0xffe0b0, 0x2a1a10, .9));
  const stone = new THREE.MeshStandardMaterial({ color: 0x8a7c68, roughness: .95, flatShading: true });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 40, 30, 20), new THREE.MeshStandardMaterial({ color: 0x4a3e32, roughness: 1, flatShading: true }));
  { const p = floor.geometry.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, (Math.sin(i * 12.9898) * 43758.5453 % 1) * .08); floor.geometry.computeVertexNormals(); }
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  // the back wall: stone blocks, two torches
  const wall = new THREE.InstancedMesh(new THREE.BoxGeometry(1.95, 1.45, 1), stone, 7 * 28), m4 = new THREE.Matrix4();
  for (let y = 0, i = 0; y < 7; y++) for (let x = -14; x < 14; x++, i++)
    wall.setMatrixAt(i, m4.makeTranslation(x * 2 + (y % 2), y * 1.5 + .75, -9 - Math.abs(Math.sin(x * 7 + y)) * .15));
  wall.receiveShadow = true; scene.add(wall);
  for (const x of [-22, 22]) {
    const light = new THREE.PointLight(0xffa040, 60, 30, 1.6); light.position.set(x, 6.5, -7.6); scene.add(light);
    const flame = new THREE.Mesh(new THREE.SphereGeometry(.32, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffc070 }));
    flame.position.copy(light.position); scene.add(flame);
    const holder = new THREE.Mesh(new THREE.CylinderGeometry(.1, .16, 1, 6), new THREE.MeshStandardMaterial({ color: 0x2a1c12 }));
    holder.position.set(x, 5.8, -8); scene.add(holder);
    scene.userData.flames = [...(scene.userData.flames || []), { light, flame }];
  }
  const over = new THREE.PointLight(0xffb060, 80, 40, 1.4); over.position.set(0, 13, 6); scene.add(over);
  const key = new THREE.DirectionalLight(0xfff0dd, 1.2); key.position.set(6, 14, 12); key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024); Object.assign(key.shadow.camera, { left: -16, right: 16, top: 12, bottom: -6 }); scene.add(key);
}

// AES as a machine: the block P1 goes in, the key sits in the lock on top, 14 lamps count the rounds,
// the block C1 comes out. The bytes are the story's own (aes.js), so the tiles are what the card prints.
function buildAes(scene, send) {
  const g = new THREE.Group(); scene.add(g);
  const metal = new THREE.MeshStandardMaterial({ color: 0x24202a, roughness: .45, metalness: .6 });
  const box = new THREE.Mesh(new THREE.BoxGeometry(7, 5.4, 4.4), metal); box.position.y = 2.9; box.castShadow = box.receiveShadow = true; g.add(box);
  const gold = new THREE.LineBasicMaterial({ color: 0xffc24d });
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(box.geometry), gold); edges.position.copy(box.position); g.add(edges);
  // the two mouths, where the block goes in and comes out
  for (const x of [-3.52, 3.52]) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 4.2), new THREE.MeshBasicMaterial({ color: 0x050307 }));
    m.position.set(x, 2.9, 0); m.rotation.y = x < 0 ? -Math.PI / 2 : Math.PI / 2; g.add(m);
  }
  const name = label('AES-256', '#ffd27a', 1.25); name.position.set(0, 4.6, 2.3); g.add(name);
  // 14 lamps on the front: one per round of AES-256
  const lamps = [];
  for (let i = 0; i < 14; i++) {
    const l = new THREE.Mesh(new THREE.SphereGeometry(.17, 10, 8), new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xffc24d, emissiveIntensity: .05 }));
    l.position.set(-2.92 + i * .45, 1.2, 2.24); g.add(l); lamps.push(l);
  }
  const round = label(t('in.round', { n: 0 }), '#ffd27a', .7); round.position.set(0, .55, 2.6); g.add(round);
  // the key: Alice's, blue, 32 bytes; it comes down into the lock on top
  const blue = new THREE.MeshStandardMaterial({ color: 0x4da3ff, emissive: 0x4da3ff, emissiveIntensity: .6, metalness: .5, roughness: .3 });
  const keyObj = new THREE.Group();
  const bow = new THREE.Mesh(new THREE.TorusGeometry(.75, .2, 10, 24), blue); bow.position.y = 2.1; keyObj.add(bow);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(.14, .14, 2.6, 8), blue); shaft.position.y = .25; keyObj.add(shaft);
  for (const [y, w] of [[-.5, .55], [-.85, .4]]) { const tooth = new THREE.Mesh(new THREE.BoxGeometry(w, .2, .2), blue); tooth.position.set(w / 2, y, 0); keyObj.add(tooth); }
  g.add(keyObj);
  const lock = new THREE.Mesh(new THREE.CylinderGeometry(.5, .6, .3, 16), new THREE.MeshStandardMaterial({ color: 0x0a0a10, metalness: .8 }));
  lock.position.y = 5.75; g.add(lock);
  const keyLbl = label(t('in.key'), '#9fd3f0', .75); g.add(keyLbl);
  // the two blocks, 4 x 4 tiles read row by row like the card's row of 16
  const ink = { fg: '#fff3dc', bg: '#3a2b1a' }, cink = { fg: '#ffd84d', bg: '#2a2008' };
  const c1 = A.encryptBlock(send.key, send.P[0]);
  const tile = (tex) => { const m = new THREE.Mesh(new THREE.BoxGeometry(1, 1, .22), [0, 0, 0, 0, 1, 0].map(k => k ? new THREE.MeshStandardMaterial({ map: tex, roughness: .6 }) : new THREE.MeshStandardMaterial({ color: 0x1a120c }))); m.castShadow = true; return m; };
  const P = [...send.P[0]].map(b => tile(tileTex(b === 32 ? '␣' : String.fromCharCode(b), { ...ink, size: 80 })));
  const C = [...c1].map(b => tile(tileTex(hx(b), { ...cink, size: 62 })));
  for (const m of [...P, ...C]) g.add(m);
  const pLbl = label(t('in.p1'), '#fff3dc', .8), cLbl = label(t('in.c1'), '#ffd84d', .8); g.add(pLbl, cLbl);
  const cell = (i, x0) => v(x0 + (i % 4 - 1.5) * 1.12, 4.6 - Math.floor(i / 4) * 1.12, 0);

  // the timeline, in seconds; it plays once from enter() and holds the end, play() restarts it
  const T = { key: [0, 1.4], in: [1.4, 3.2], rounds: [3.2, 6.0], out: [6.0, 7.6] };
  const pose = time => {
    const k = span(time, ...T.key);
    keyObj.position.set(0, 9.5 - 3.25 * k, 0); keyObj.rotation.y = (1 - k) * Math.PI * 1.5;
    keyLbl.position.set(2.6, keyObj.position.y + 2.2, 0);
    P.forEach((m, i) => {
      const at = cell(i, -9.5), kk = span(time, T.in[0] + (i % 4) * .08 + Math.floor(i / 4) * .12, T.in[1] - .5 + (i % 4) * .08 + Math.floor(i / 4) * .12);
      m.position.lerpVectors(at, v(-1, 2.9 + (at.y - 2.9) * .3, at.z), kk);
      m.visible = kk < .999; m.scale.setScalar(1 - .35 * kk);
    });
    pLbl.position.set(-9.5, 6.25, 0); pLbl.material.opacity = 1 - span(time, T.in[0], T.in[1]) * .6;
    const lit = Math.floor(clamp01((time - T.rounds[0]) / (T.rounds[1] - T.rounds[0])) * 14 + 1e-6);
    lamps.forEach((l, i) => { l.material.emissiveIntensity = i < lit ? 1.5 : .05; });
    const busy = time > T.rounds[0] && time < T.rounds[1];
    box.position.x = busy ? Math.sin(time * 60) * .025 : 0; edges.position.x = box.position.x;
    gold.color.setHex(busy ? 0xffe9a8 : 0xffc24d);
    const n = Math.min(14, lit);
    if (round.userData.n !== n) { round.userData.n = n; const s = label(t('in.round', { n }), '#ffd27a', .7); round.material.map.dispose(); round.material.map = s.material.map; round.scale.copy(s.scale); }
    C.forEach((m, i) => {
      const at = cell(i, 9.5), kk = span(time, T.out[0] + (i % 4) * .06 + Math.floor(i / 4) * .1, T.out[1] - .4 + (i % 4) * .06 + Math.floor(i / 4) * .1);
      m.position.lerpVectors(v(1, 2.9 + (at.y - 2.9) * .3, at.z), at, kk);
      m.visible = kk > .001; m.scale.setScalar(.65 + .35 * kk); m.rotation.x = (1 - kk) * Math.PI;
    });
    cLbl.position.set(9.5, 6.25, 0); cLbl.material.opacity = span(time, T.out[0], T.out[1]);
  };
  return { pose, end: T.out[1], anchor: v(-9.5, 6.6, 0), shot: { from: v(0, 7.5, 32), to: v(0, 5.2, 24), target: v(0, 1.6, 0) } };
}

// ---------- the switch between the valley and a room ----------
export class Inside {
  constructor({ renderer, renderPass, camera, rig, bubbles, instant }) {
    Object.assign(this, { renderer, renderPass, outer: { scene: renderPass.scene, camera }, rig, bubbles, instant });
    this.camera = new THREE.PerspectiveCamera(45, 1, .3, 200);
    this.veil = document.getElementById('veil');
    this.room = null; this.time = 0; this.token = 0;
  }
  get active() { return !!this.room; }
  resize(aspect, fov) { this.camera.aspect = aspect; this.camera.fov = fov; this.camera.updateProjectionMatrix(); }
  // the screen goes to the window's warm light and back; resolves once it is covered
  cover(on) {
    const ms = this.instant ? 0 : 380;
    this.veil.style.transitionDuration = ms + 'ms'; this.veil.classList.toggle('on', on);
    return new Promise(r => setTimeout(r, ms));
  }
  async enter(name, send, live = () => true) {
    const tok = ++this.token, door = DOORS.a(), fast = this.instant ? .001 : 1;
    // the room is built and its shaders compiled during the flight, so the swap does not stall
    const scene = new THREE.Scene(); buildRoom(scene);
    const machine = { aes: buildAes }[name](scene, send); machine.pose(0);
    const ready = this.renderer.compileAsync(scene, this.camera).catch(() => {});
    await this.rig.fly(door.near, 1.1 * fast);
    if (tok !== this.token || !live()) return false;
    const push = this.rig.fly(door.at, .8 * fast);
    await new Promise(r => setTimeout(r, this.instant ? 0 : 420));
    await this.cover(true); await push; await ready;
    if (tok !== this.token || !live()) { this.cover(false); return false; }
    this.room = { name, scene, machine }; this.log?.push(['in', performance.now()]);
    this.time = this.instant ? machine.end : 0; this.dolly = this.instant ? 1 : 0;
    this.renderPass.scene = scene; this.renderPass.camera = this.camera; this.bubbles.camera = this.camera;
    this.update(0);
    await this.cover(false);
    return true;
  }
  async leave() {
    if (!this.room) return;
    this.token++;
    await this.cover(true);
    this.room.scene.traverse(o => { o.geometry?.dispose(); [o.material].flat().forEach(m => { m?.map?.dispose(); m?.dispose?.(); }); });
    this.room = null;
    this.renderPass.scene = this.outer.scene; this.renderPass.camera = this.outer.camera; this.bubbles.camera = this.outer.camera;
    this.rig.jump(DOORS.a().at);
    this.cover(false);
  }
  play() { if (this.room) this.time = 0; }
  anchor() { return this.room?.machine.anchor; }
  update(dt) {
    if (!this.room) return;
    this.time += dt; this.dolly = Math.min(1, this.dolly + dt / 2.4);
    const m = this.room.machine, s = m.shot, k = ease(this.dolly);
    m.pose(this.time);
    this.camera.position.lerpVectors(s.from, s.to, k);
    // a phone held upright sees a narrow slice: step back until both blocks are in frame
    if (this.camera.aspect < 1) this.camera.position.sub(s.target).multiplyScalar(1 / this.camera.aspect * .75).add(s.target);
    this.camera.position.x += Math.sin(this.time * .25) * .6 * k;
    this.camera.lookAt(s.target);
    for (const f of this.room.scene.userData.flames || []) f.light.intensity = 55 + Math.sin(this.time * 13 + f.light.position.x) * 6 + Math.sin(this.time * 7.3) * 4;
  }
}
