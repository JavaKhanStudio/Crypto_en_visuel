// The actors and the props on the village, and everything they do: Bob makes and
// hands out his padlocks, Alice snaps one on her chest, the courier carries it, Eve
// grabs it, someone tries to open it. apply(state) puts everything where a story step
// says, instantly; the async actions animate from there.
import * as THREE from 'three';
import { PLACES, BENCH, TABLE_TOP } from './world.js';
import { padlock, key, chest, person, COLORS } from './props.js';
import { burst, ring, icon } from './fx.js';
import { sfx } from './sound.js';

const v = (x, y, z) => new THREE.Vector3(x, y, z);
const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const N_LOCKS = 9;   // 0 goes to Alice, 1 to Eve, 2..8 to the village posts
const HANG = .87;    // a padlock's origin sits this far above the surface it rests on

export class Stage {
  constructor(world, tickers) {
    this.world = world; this.scene = world.scene; this.tickers = tickers; this.speed = 1; this.token = 0;
    const S = this.scene;
    this.people = {};
    for (const k of ['a', 'e', 'b']) {
      const p = person(k); p.position.copy(PLACES[k].person); p.rotation.y = .6; S.add(p); this.people[k] = p;
    }
    this.courier = person('n'); S.add(this.courier);
    this.chest = chest(); S.add(this.chest);
    // the two padlocks that can hang on the chest: Alice's own (chapter 1) and Bob's
    this.aliceLock = padlock(COLORS.a); this.chest.add(this.aliceLock); this.aliceLock.position.copy(this.chest.userData.hasp);
    this.bobLock = padlock(COLORS.b); this.chest.add(this.bobLock); this.bobLock.position.copy(this.chest.userData.hasp);
    // keys turn about their own shaft (local x) last: Euler order YZX
    this.aliceKey = key(COLORS.a); this.aliceKey.rotation.order = 'YZX'; S.add(this.aliceKey);
    // Bob's one key, glowing, hanging from his belt
    this.bobKey = key(COLORS.b, .9); this.bobKey.rotation.order = 'YZX'; S.add(this.bobKey);
    this.locks = Array.from({ length: N_LOCKS }, () => { const l = padlock(COLORS.b); S.add(l); return l; });
    this.labels = { pub: label('…', '#ffc24d'), priv: label('…', '#ffe9b0') };
    S.add(this.labels.pub, this.labels.priv);
    this.idle = (dt, t) => {
      for (const [k, p] of Object.entries(this.people)) p.position.y = PLACES[k].person.y + Math.abs(Math.sin(t * 1.3 + k.charCodeAt(0))) * .05;
      this.labels.pub.position.y = this.labels.pub.userData.y + Math.sin(t * 2) * .15;
      this.labels.priv.position.y = this.labels.priv.userData.y + Math.sin(t * 2 + 1) * .15;
    };
    tickers.add(this.idle);
  }

  // ---------- where things rest ----------
  tableSpot(k) { return PLACES[k].table.clone().add(v(-.5, TABLE_TOP, 0)); }               // the chest on a table
  lockSpot(k) { return PLACES[k].table.clone().add(v(1.05, TABLE_TOP + HANG, .2)); }        // a loose padlock beside it
  benchSpot(i) { return BENCH.clone().add(v(-.95 + (i % 5) * .48, TABLE_TOP + HANG, i < 5 ? -.35 : .4)); }
  postSpot(i) { return this.world.posts[i].localToWorld(this.world.posts[i].userData.hook.clone()); }
  destSpot(i) { return i === 0 ? this.lockSpot('a') : i === 1 ? this.lockSpot('e') : this.postSpot(i - 2); }
  beltSpot() { return this.people.b.position.clone().add(v(.75, 1.45, .3)); }
  hasp() { return this.chest.localToWorld(this.chest.userData.hasp.clone()); }
  keyhole() { return this.hasp().add(v(0, -.36, .5)); }
  head(k) { return (k === 'n' ? this.courier.position : PLACES[k].person).clone().add(v(0, 4.3, 0)); }

  // ---------- the state of a story step ----------
  // made: padlocks on Bob's bench (0..9) · dist: handed out · box: 'a' | 'e' | 'b' (whose table)
  // lock: null | 'alice' | 'bob' · locked · lid (0..1) · keyWith: Alice's key travels on the chest
  // stolen: Eve holds a copy of Bob's key (sandbox) · labels: the public/private tags of the recap
  apply(st) {
    this.token++;
    this.st = { made: 0, dist: false, box: 'a', lock: null, locked: false, lid: 0, keyWith: false, stolen: false, labels: false, ...st };
    st = this.st;
    this.chest.position.copy(this.tableSpot(st.box)); this.chest.rotation.set(0, 0, 0); this.chest.scale.setScalar(1);
    this.chest.userData.setLid(st.lid);
    this.aliceLock.visible = st.lock === 'alice'; this.bobLock.visible = st.lock === 'bob';
    for (const l of [this.aliceLock, this.bobLock]) { l.userData.setOpen(st.locked ? 0 : 1); l.rotation.set(0, 0, 0); l.position.copy(this.chest.userData.hasp); }
    this.locks.forEach((l, i) => {
      l.rotation.set(0, 0, 0); l.scale.setScalar(1); l.userData.setOpen(1);
      l.visible = st.dist || i < st.made;
      l.position.copy(st.dist ? this.destSpot(i) : this.benchSpot(i));
    });
    if (st.lock === 'bob') this.locks[0].visible = false;   // Alice's padlock is the one on her chest
    this.aliceKey.visible = st.lock === 'alice';
    this.aliceKey.rotation.set(0, 0, 0);
    if (st.keyWith) this.aliceKey.position.copy(this.chest.position).add(v(0, 1.62, .1));
    else this.aliceKey.position.copy(this.lockSpot('a')).add(v(0, -HANG + .08, 0));
    this.aliceKey.rotation.x = -Math.PI / 2;
    this.bobKey.visible = true; this.bobKey.rotation.set(0, 0, -Math.PI / 2); this.bobKey.position.copy(this.beltSpot());
    if (st.stolen) { this.bobKey2 ??= key(COLORS.b, .9); this.bobKey2.rotation.order = 'YZX'; this.scene.add(this.bobKey2); this.bobKey2.visible = true; this.bobKey2.rotation.set(-Math.PI / 2, 0, 0); this.bobKey2.position.copy(this.lockSpot('e')).add(v(-.2, -HANG + .08, .6)); }
    else if (this.bobKey2) this.bobKey2.visible = false;
    this.courier.visible = false;
    for (const p of Object.values(this.people)) p.userData.arms.rotation.x = 0;
    this.setLabels(st.labels);
  }

  setLabels(on, texts) {
    if (texts) { setLabel(this.labels.pub, texts.pub, '#ffc24d'); setLabel(this.labels.priv, texts.priv, '#ffe9b0'); }
    this.labels.pub.visible = this.labels.priv.visible = on;
    this.labels.pub.position.copy(this.benchSpot(2)).add(v(0, 1.9, 0)); this.labels.pub.userData.y = this.labels.pub.position.y;
    this.labels.priv.position.copy(this.beltSpot()).add(v(0, 2.9, .4)); this.labels.priv.userData.y = this.labels.priv.position.y;
  }

  // ---------- animation helpers ----------
  tween(dur, f) {
    const tok = this.token;
    return new Promise(res => {
      let t = 0;
      const tick = dt => {
        if (tok !== this.token) { this.tickers.delete(tick); return res(false); }   // a new step took over
        t = Math.min(1, t + dt * this.speed / dur); f(t);
        if (t >= 1) { this.tickers.delete(tick); res(true); }
      };
      this.tickers.add(tick);
    });
  }
  live(tok) { return tok === this.token; }
  // move an object along an arc from where it is to `to`
  arc(obj, to, { dur = 1, height = 2, spin = 0 } = {}) {
    const from = obj.position.clone(), r0 = obj.rotation.y;
    return this.tween(dur, k => { const e = ease(k); obj.position.lerpVectors(from, to, e); obj.position.y += Math.sin(Math.PI * e) * height; obj.rotation.y = r0 + spin * e; });
  }
  async arm(k, up = 1, dur = .3) { const a = this.people[k].userData.arms; const r0 = a.rotation.x; await this.tween(dur, t => a.rotation.x = r0 + (-up - r0) * ease(t)); }

  // ---------- the actions ----------
  // Bob makes his padlocks, all open, one after another, on his bench.
  async makeLocks() {
    const tok = this.token;
    this.arm('b', .9);
    for (let i = 0; i < N_LOCKS; i++) {
      const l = this.locks[i]; l.visible = true; l.position.copy(this.benchSpot(i)); l.scale.setScalar(.01);
      sfx.click(); burst(l.position.clone(), 0xffc24d, { count: 24, speed: 3, life: .6, size: .25, up: 2, gravity: 6 });
      if (!await this.tween(.22, k => l.scale.setScalar(Math.max(.01, Math.sin(k * Math.PI / 2) * (1 + .25 * Math.sin(k * Math.PI)))))) return;
      this.st.made = i + 1;
    }
    if (!this.live(tok)) return;
    await this.arm('b', 0);
    // and the one key: it flashes on his belt
    icon(this.beltSpot().add(v(0, 1.2, .3)), '🔑', '#ffc24d', { size: 2, rise: 2, life: 1.8 });
    ring(this.people.b.position.clone(), 0xffc24d, { radius: 3 });
  }

  // He hands them out: to Alice, to Eve, to every house.
  async distribute() {
    const tok = this.token, jobs = [];
    for (let i = 0; i < N_LOCKS; i++) {
      const l = this.locks[i]; l.visible = true;
      jobs.push(new Promise(r => setTimeout(r, i * 160 / this.speed)).then(() => this.live(tok) && (sfx.click(), this.arc(l, this.destSpot(i), { dur: 1.4, height: 6 + i * .6, spin: Math.PI * 2 }))));
    }
    await Promise.all(jobs);
    if (!this.live(tok)) return;
    this.st.dist = true;
    for (let i = 0; i < N_LOCKS; i++) ring(this.destSpot(i).setY(this.destSpot(i).y - (i < 2 ? HANG : 2.2)), 0xffc24d, { radius: 1.6, life: .8 });
  }

  // Alice takes the padlock beside her chest, hooks it on, and pushes: click.
  async lockBox() {
    const tok = this.token, l = this.locks[0];
    this.arm('a', .9);
    if (!await this.arc(l, this.hasp(), { dur: .8, height: .8 })) return;
    l.visible = false; this.bobLock.visible = true; this.bobLock.userData.setOpen(1);
    if (!await this.tween(.25, k => this.bobLock.userData.setOpen(1 - k))) return;
    this.st.lock = 'bob'; this.st.locked = true;
    sfx.lock(); burst(this.hasp(), 0xffffff, { count: 30, speed: 4, life: .5, size: .2, up: 1, gravity: 4 });
    icon(this.hasp().add(v(0, 1, .5)), '🔒', '#ffc24d', { size: 1.6, rise: 1.5 });
    if (this.live(tok)) await this.arm('a', 0);
  }

  // Someone tries to open the locked chest without the right key: it rattles, and holds.
  async tryFail(k, { withLock = false } = {}) {
    const tok = this.token, lockObj = this.st.lock === 'alice' ? this.aliceLock : this.bobLock;
    this.arm(k, 1);
    let held = null, home = null;
    if (withLock) {   // Eve holds up her own padlock beside the chest's: the same, and useless
      held = this.locks[1]; home = held.position.clone();
      if (!await this.arc(held, this.hasp().add(v(.9, .2, .6)), { dur: .7, height: .6 })) return;
    }
    sfx.reject();
    await this.tween(.8, t => { lockObj.rotation.z = Math.sin(t * 40) * .35 * (1 - t); if (held) held.rotation.z = Math.sin(t * 40 + 1) * .3 * (1 - t); });
    if (!this.live(tok)) return;
    icon(this.hasp().add(v(0, .9, .8)), '✖', '#ff4d5e', { size: 1.2, rise: .6 });   // low, so it stays in the close shot
    if (held) await this.arc(held, home, { dur: .7, height: .6 });
    if (this.live(tok)) await this.arm(k, 0);
  }

  // A key that fits: it flies into the keyhole, turns, the shackle springs, the lid opens.
  async openWith(keyObj, k) {
    const tok = this.token, lockObj = this.st.lock === 'alice' ? this.aliceLock : this.bobLock;
    this.arm(k, 1);
    keyObj.visible = true;
    const from = keyObj.position.clone(), to = this.keyhole(), r0 = keyObj.rotation.clone();
    // the key points into the lock: shaft along -z
    if (!await this.tween(.9, t => { const e = ease(t); keyObj.position.lerpVectors(from, to, e); keyObj.position.y += Math.sin(Math.PI * e) * 1.2;
      keyObj.rotation.set(r0.x + (0 - r0.x) * e, r0.y + (Math.PI / 2 - r0.y) * e, r0.z + (0 - r0.z) * e); })) return;
    if (!await this.tween(.35, t => keyObj.rotation.x = -t * Math.PI / 2)) return;
    sfx.unlock();
    if (!await this.tween(.3, t => lockObj.userData.setOpen(t))) return;
    this.st.locked = false;
    keyObj.visible = false;
    // the open padlock comes off the hasp and drops on the ground beside the table (the table's
    // free corner may hold Eve's own padlock): nothing holds the lid now
    if (!await this.arc(lockObj, v(2.45, HANG - TABLE_TOP, 1.25), { dur: .8, height: 1.2, spin: -.6 })) return;
    sfx.click();
    if (!await this.tween(.8, t => this.chest.userData.setLid(ease(t)))) return;
    this.st.lid = 1;
    burst(this.chest.position.clone().add(v(0, 1.4, 0)), 0xffe08a, { count: 90, speed: 5, life: 1.2, size: .3, up: 4, gravity: 5 });
    if (this.live(tok)) await this.arm(k, 0);
  }

  // The courier carries the chest on his head along the road. to = 'e' stops at Eve's.
  async carry(from, to) {
    const tok = this.token, path = this.world.road.path;
    const tOf = { a: 0, e: .5, b: 1 }, t0 = tOf[from], t1 = tOf[to];
    const c = this.courier; c.visible = true;
    const at = t => path.getPointAt(t).setY(0);
    c.position.copy(at(t0));
    const dir = Math.sign(t1 - t0); c.userData.dir = v(dir, 0, 0);   // for the chase camera
    c.rotation.y = dir > 0 ? Math.PI / 2 : -Math.PI / 2;
    const onHead = () => c.position.clone().add(v(0, 3.15, 0));
    // the chest goes from the table up onto his head
    if (!await this.arc(this.chest, onHead(), { dur: .7, height: 1.2 })) return;
    if (this.st.keyWith) this.aliceKey.position.copy(this.chest.position).add(v(0, 1.62, .1));
    sfx.send();
    const len = Math.abs(t1 - t0), dur = 3.2 * len / .5;
    const ok = await this.tween(dur, k => {
      const t = t0 + (t1 - t0) * k, p = at(t), tan = path.getTangentAt(t);
      c.position.copy(p); c.position.y = Math.abs(Math.sin(k * dur * 9)) * .18;
      c.rotation.y = Math.atan2(tan.x * dir, tan.z * dir);
      this.chest.position.copy(onHead()); this.chest.rotation.y = c.rotation.y - Math.PI / 2 * dir;
      if (this.st.keyWith) this.aliceKey.position.copy(this.chest.position).add(v(0, 1.62, 0));
    });
    if (!ok) return;
    // and down onto the table of whoever receives it
    c.rotation.y = Math.atan2(PLACES[to].table.x - c.position.x, PLACES[to].table.z - c.position.z);
    const spot = this.tableSpot(to), r0 = this.chest.rotation.y;
    const keyFollow = () => { if (this.st.keyWith) this.aliceKey.position.copy(this.chest.position).add(v(0, 1.62, .1)); };
    if (!await this.tween(.8, k => { const e = ease(k); this.chest.position.lerpVectors(onHead(), spot, e); this.chest.position.y += Math.sin(Math.PI * e) * 1.2; this.chest.rotation.y = r0 * (1 - e); keyFollow(); })) return;
    this.st.box = to;
    if (to === 'e') { sfx.capture(); icon(this.chest.position.clone().add(v(0, 3, 0)), '✋', '#ff4d5e', { size: 2, rise: 2 }); }
    else { sfx.arrive(); ring(spot.clone().setY(0), COLORS[to], { radius: 3 }); }
    await this.tween(.5, k => {});
    if (this.live(tok)) c.visible = false;
  }
}

// A floating tag (the recap's « clé publique » / « clé privée »), a sprite with its text drawn on a canvas.
function label(text, color) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthTest: false }));
  s.renderOrder = 20; setLabel(s, text, color); s.visible = false; s.userData.y = 0;
  return s;
}
function setLabel(s, text, color) {
  const c = document.createElement('canvas'), x = c.getContext('2d'), font = '600 44px system-ui, sans-serif';
  x.font = font; const w = Math.ceil(x.measureText(text).width) + 56;
  c.width = w; c.height = 84;
  x.font = font; x.fillStyle = 'rgba(16,18,28,.85)'; x.strokeStyle = color; x.lineWidth = 4;
  x.beginPath(); x.roundRect(2, 2, w - 4, 80, 40); x.fill(); x.stroke();
  x.fillStyle = color; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, w / 2, 44);
  // the canvas is sRGB: read as linear, the pale « clé privée » crossed the bloom threshold and glowed (r76)
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  s.material.map?.dispose(); s.material.map = tex; s.material.needsUpdate = true;
  s.scale.set(w / 84 * .9, .9, 1);
}
