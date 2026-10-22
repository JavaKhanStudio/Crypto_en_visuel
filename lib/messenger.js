// A messenger on horseback riding the road (the saga, episodes 1.1 to 1.6). Its fate is decided when it leaves:
// 'deliver' (reaches the far gate), 'capture' (Eve's guards take it on the way),
// 'reject' (a forged rider turned away at the gate by the HMAC check),
// 'beam' (caught only if Eve's searchlight sweeps over it on the way).
// stopAt (episode 1.2): Eve's guards stop the rider there and he waits, held, until release();
// then he rides on. `stopped` resolves when he is held.
// `done` resolves with 'delivered' | 'captured' | 'rejected'.
import * as THREE from 'three';
import * as fx from './fx.js';

// r323: one messenger for the six saga episodes (was 6 copies; 1.1's had no stopAt). It reads the cast's
// colours and Eve's city from the saga's one valley (r423, lib/saga/world.js; tests/messenger_lib.py).
import { COLORS, CITY } from './saga/world.js';

const horseMat = new THREE.MeshStandardMaterial({ color: 0x6b4a2f, roughness: .8, flatShading: true });
const darkHorseMat = new THREE.MeshStandardMaterial({ color: 0x1e1a1c, roughness: .6, flatShading: true });
const skinMat = new THREE.MeshStandardMaterial({ color: 0xe0b48f, roughness: .8 });
const scrollMat = new THREE.MeshStandardMaterial({ color: 0xf3e3bf, emissive: 0x6b5a30, emissiveIntensity: .4 });
const guardMat = new THREE.MeshStandardMaterial({ color: 0x8a1020, roughness: .6, flatShading: true });
const steelMat = new THREE.MeshStandardMaterial({ color: 0xb0b6c0, metalness: .8, roughness: .3 });

const _torso = new THREE.Vector3();

function box(w, h, d, mat, x = 0, y = 0, z = 0) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.castShadow = true; return m; }

export function buildRider(team, forged) {
  const color = COLORS[team], g = new THREE.Group(), hm = forged ? darkHorseMat : horseMat;
  const body = new THREE.Group(); g.add(body);
  body.add(box(2.6, 1.1, 1, hm, 0, 2, 0));
  const neck = box(.7, 1.4, .7, hm, 1.3, 2.7, 0); neck.rotation.z = -.6; body.add(neck);
  body.add(box(1.1, .55, .55, hm, 1.85, 3.25, 0));
  const tail = box(.2, 1, .2, hm, -1.4, 2, 0); tail.rotation.z = .6; body.add(tail);
  const legs = [];
  for (const [x, z] of [[1, .35], [1, -.35], [-1, .35], [-1, -.35]]) {
    const pivot = new THREE.Group(); pivot.position.set(x, 1.5, z);
    pivot.add(box(.26, 1.4, .26, hm, 0, -.7, 0)); body.add(pivot); legs.push(pivot);
  }
  // rider
  const cloth = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: .35, roughness: .6, flatShading: true });
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(.35, .45, 1.3, 8), cloth); torso.position.set(-.1, 3.2, 0); body.add(torso);
  const head = new THREE.Mesh(new THREE.SphereGeometry(.32, 10, 8), skinMat); head.position.set(-.1, 4.1, 0); body.add(head);
  const helm = new THREE.Mesh(new THREE.ConeGeometry(.36, .5, 8), steelMat); helm.position.set(-.1, 4.45, 0); body.add(helm);
  // cape: hangs from the shoulders and streams backwards; it flutters about the
  // shoulder line, never sideways (r29: swinging about the forward axis read as a
  // rectangle wagging left and right behind the rider)
  const capeGeo = new THREE.PlaneGeometry(.9, 1.5); capeGeo.translate(0, -.75, 0);
  const capeMesh = new THREE.Mesh(capeGeo, new THREE.MeshStandardMaterial({ color, side: THREE.DoubleSide, emissive: color, emissiveIntensity: .3 }));
  capeMesh.rotation.y = Math.PI / 2;
  const cape = new THREE.Group(); cape.position.set(-.5, 3.75, 0); cape.rotation.z = -.35; cape.add(capeMesh); body.add(cape);
  const scroll = new THREE.Mesh(new THREE.CylinderGeometry(.12, .12, .8, 8), scrollMat); scroll.position.set(.35, 3.3, .45); scroll.rotation.x = Math.PI / 2; body.add(scroll);
  // beacon: a small glowing gem above the head, so the rider reads from far away
  const beacon = new THREE.Mesh(new THREE.OctahedronGeometry(.45), new THREE.MeshBasicMaterial({ color }));
  beacon.position.set(-.1, 5.6, 0); body.add(beacon);
  g.userData = { body, legs, cape, scroll, beacon };
  return g;
}

export function guard() {
  const g = new THREE.Group();
  const b = new THREE.Mesh(new THREE.ConeGeometry(.55, 1.8, 8), guardMat); b.position.y = .9; g.add(b);
  const h = new THREE.Mesh(new THREE.SphereGeometry(.3, 8, 6), steelMat); h.position.y = 2; g.add(h);
  const spear = box(.08, 3, .08, steelMat, .5, 1.6, 0); spear.rotation.z = -.15; g.add(spear);
  g.traverse(o => o.castShadow = true);
  return g;
}

// One frame of the gallop: body bob, legs, cape. Shared with tools/assets.html.
export function gallop(ud, time) {
  ud.body.position.y = Math.abs(Math.sin(time * 9)) * .35;
  ud.legs.forEach((l, i) => l.rotation.z = Math.sin(time * 18 + (i % 2 ? Math.PI : 0) + (i > 1 ? .8 : 0)) * .7);
  ud.cape.rotation.z = -.35 - Math.sin(time * 12) * .12;
}

export class Messenger {
  constructor(world, { from, fate = 'deliver', captureAt, stopAt = null, forged = false, speed = 26, onEvent = () => {} }) {
    this.world = world; this.stopAt = stopAt; this.stopped = new Promise(r => this.onHeld = r); this.from = from; this.fate = fate; this.forged = forged; this.onEvent = onEvent;
    this.team = forged ? 'a' : from;           // a forged rider wears Alice's colours
    this.dir = from === 'b' ? -1 : 1;
    this.path = world.road.path; this.len = this.path.getLength(); this.speed = speed;
    this.u = from === 'b' ? 1 : from === 'city' ? .5 : 0;
    this.end = this.dir > 0 ? 1 : 0;
    this.captureAt = captureAt ?? (.32 + Math.random() * .36);
    if (from === 'city' && fate === 'capture') this.captureAt = Math.max(this.captureAt, .62);
    this.obj = buildRider(this.team, forged);
    this.obj.userData.dir = new THREE.Vector3(this.dir, 0, 0);
    this.phase = from === 'city' ? 'leaving' : 'ride';
    this.t = 0; this.guards = [];
    if (from === 'city') {
      this.gate = new THREE.Vector3(CITY.x, CITY.y + .2, CITY.z + 19);
      this.join = this.path.getPointAt(.5);
      this.obj.position.copy(this.gate);
    } else this.obj.position.copy(this.path.getPointAt(this.u));
    world.scene.add(this.obj);
    this.done = new Promise(r => this.resolve = r);
  }

  get position() { return this.obj.position; }

  update(dt, time) {
    const ud = this.obj.userData;
    this.t += dt;
    const galloping = this.phase === 'ride' || this.phase === 'leaving';
    if (galloping) gallop(ud, time);
    ud.beacon.rotation.y += dt * 3;

    if (this.phase === 'leaving') {
      // from Eve's gate down to the road
      const k = Math.min(1, this.t / 1.2);
      this.obj.position.lerpVectors(this.gate, this.join, k);
      this.face(this.join.clone().sub(this.gate));
      if (k >= 1) this.phase = 'ride';
      return;
    }
    if (this.phase === 'ride') {
      const prev = this.u;
      this.u += this.dir * this.speed * dt / this.len;
      const crossed = this.fate === 'capture' && (this.dir > 0 ? prev < this.captureAt && this.u >= this.captureAt : prev > this.captureAt && this.u <= this.captureAt);
      if (crossed) return this.capture();
      if (this.stopAt !== null && (this.dir > 0 ? prev < this.stopAt && this.u >= this.stopAt : prev > this.stopAt && this.u <= this.stopAt)) return this.hold();
      if (this.fate === 'beam' && this.world.inBeam(_torso.copy(this.obj.position).setY(this.obj.position.y + 3))) return this.capture();
      if (this.fate === 'reject' && (this.dir > 0 ? this.u >= .965 : this.u <= .035)) return this.reject();
      if ((this.dir > 0 && this.u >= 1) || (this.dir < 0 && this.u <= 0)) return this.arrive();
      this.obj.position.copy(this.path.getPointAt(Math.min(1, Math.max(0, this.u))));
      this.face(this.path.getTangentAt(Math.min(1, Math.max(0, this.u))).multiplyScalar(this.dir));
      return;
    }
    if (this.phase === 'caught') {
      const k = this.t;
      this.guards.forEach((g, i) => { const s = Math.min(1, k * 3); g.scale.setScalar(s); g.position.y = this.obj.position.y - (1 - s) * 2; });
      if (k > .5) { const f = Math.min(1, (k - .5) / .6); ud.body.rotation.x = f * Math.PI / 2 * .9; ud.body.position.y = -f * 1.2; }
      if (k > 1.9) { const f = Math.min(1, (k - 1.9) / .5); this.obj.scale.setScalar(1 - f); this.guards.forEach(g => g.scale.setScalar(1 - f)); }
      if (k > 2.4) this.finish('captured');
      return;
    }
    if (this.phase === 'held' || this.phase === 'freed') {
      ud.body.position.y *= .8;
      ud.legs.forEach(l => l.rotation.z *= .8);
      const k = this.phase === 'held' ? Math.min(1, this.t * 3) : Math.max(0, 1 - this.t * 3);
      this.guards.forEach(g => { g.scale.setScalar(Math.max(.01, k)); g.position.y = this.obj.position.y - (1 - k) * 2; });
      if (this.phase === 'freed' && k <= 0) { this.guards.forEach(g => this.world.scene.remove(g)); this.guards = []; this.phase = 'ride'; this.stopAt = null; }
      return;
    }
    if (this.phase === 'arriving') {
      const f = Math.min(1, this.t / .5);
      this.obj.scale.setScalar(1 - f);
      if (f >= 1) this.finish('delivered');
      return;
    }
    if (this.phase === 'rejected') {
      const f = Math.min(1, this.t / 1.6);
      if (this.t > .6) { this.obj.rotation.y += dt * 4; this.obj.scale.setScalar(1 - Math.max(0, (this.t - .9) / .7)); }
      if (f >= 1) this.finish('rejected');
    }
  }

  face(dir) {
    if (dir.lengthSq() < 1e-6) return;
    const d = dir.clone(); d.y = 0; d.normalize();
    this.obj.rotation.y = Math.atan2(-d.z, d.x);
    this.obj.userData.dir.copy(d);
  }

  capture() {
    this.phase = 'caught'; this.t = 0;
    const p = this.obj.position;
    for (let i = 0; i < 3; i++) {
      const g = guard(), a = i / 3 * Math.PI * 2;
      g.position.set(p.x + Math.cos(a) * 2.6, p.y, p.z + Math.sin(a) * 2.6); g.lookAt(p.x, p.y, p.z); g.scale.setScalar(.01);
      this.world.scene.add(g); this.guards.push(g);
    }
    fx.ring(p, COLORS.e, { radius: 9 });
    fx.burst(p.clone().setY(p.y + 3), COLORS.e, { count: 60, speed: 7 });
    fx.icon(p.clone().setY(p.y + 7), '✖', '#ff4d5e');
    // the scroll flies to Eve's tower
    const s = this.obj.userData.scroll; s.visible = false;
    const flying = new THREE.Mesh(s.geometry, scrollMat);
    fx.arc(flying, p.clone().setY(p.y + 3), new THREE.Vector3(CITY.x, 24, CITY.z), { height: 14, life: 1.4 });
    this.onEvent('captured', this);
  }

  // Eve's guards close round the rider; he waits until release()
  hold() {
    this.phase = 'held'; this.t = 0;
    const p = this.obj.position;
    for (let i = 0; i < 3; i++) {
      const g = guard(), a = (i / 3 + .08) * Math.PI * 2;
      g.position.set(p.x + Math.cos(a) * 2.8, p.y, p.z + Math.sin(a) * 2.8); g.lookAt(p.x, p.y, p.z); g.scale.setScalar(.01);
      this.world.scene.add(g); this.guards.push(g);
    }
    fx.ring(p, COLORS.e, { radius: 7 });
    this.onEvent('stopped', this); this.onHeld(this);
  }
  release() { if (this.phase === 'held') { this.phase = 'freed'; this.t = 0; } }

  arrive() {
    this.phase = 'arriving'; this.t = 0;
    const p = this.obj.position, color = COLORS[this.forged ? 'e' : this.from === 'a' ? 'b' : 'a'];
    fx.burst(p.clone().setY(p.y + 2), this.forged ? COLORS.e : 0xffd27a, { count: 90, speed: 8 });
    fx.ring(p, color, { radius: 6 });
    fx.icon(p.clone().setY(p.y + 7), this.forged ? '!' : '✉', this.forged ? '#ff4d5e' : '#ffe08a');
    this.onEvent('delivered', this);
  }

  reject() {
    this.phase = 'rejected'; this.t = 0;
    const p = this.obj.position;
    fx.ring(p, COLORS.e, { radius: 7 });
    fx.icon(p.clone().setY(p.y + 7), '🔒', '#ff4d5e', { life: 2.6 });
    fx.burst(p.clone().setY(p.y + 2), COLORS.e, { count: 50, speed: 6 });
    this.onEvent('rejected', this);
  }

  finish(result) {
    if (this.finished) return;
    this.finished = true;
    this.world.scene.remove(this.obj); this.guards.forEach(g => this.world.scene.remove(g));
    this.resolve(result);
  }
}
