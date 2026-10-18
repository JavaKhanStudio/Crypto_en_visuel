// The actors and the props, and everything they do: Alice's message is cut into crates of 16
// bytes; each goes through the AES press alone (ECB), or through the XOR ring first, mixed with
// the block before it (CBC, the IV for the first); the penguin goes through the same press;
// the crates ride the belt to Bob past Eve, who can flip a bit of one; Bob's press and ring undo
// the chain; with an HMAC, Bob checks the seal before he decrypts anything.
// apply(state) puts everything where a story step says, instantly; the async actions animate
// from there and write back into st.
import * as THREE from 'three';
import { X, SLOT, CRATE_Y, HOLD, SCREENS } from './world.js';
import { crate, CRATE, BELT_Y } from './props.js';
import * as A from './aes.js';
import { paint } from './penguin.js';
import { burst, ring, icon } from './fx.js';
import { sfx } from './sound.js';
import { raw } from './i18n.js';

const v = (x, y, z) => new THREE.Vector3(x, y, z);
const ease = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
// what a block reads as on the card: its letters, « Alice + 11 × 0b » for a padded one, else its hex
export function show(b) {
  const n = b[15], printable = x => x >= 0x20 && x < 0x7f;
  if (b.every(printable)) return new TextDecoder().decode(b);
  if (n >= 1 && n <= 16 && b.slice(16 - n).every(x => x === n) && b.slice(0, 16 - n).every(printable))
    return `${new TextDecoder().decode(b.slice(0, 16 - n))} + ${n} × ${n.toString(16).padStart(2, '0')}`;
  return A.hex(b, 6) + ' ..';
}

export class Stage {
  constructor(world, tickers) {
    this.world = world; this.scene = world.scene; this.tickers = tickers; this.speed = 1; this.token = 0;
    this.people = world.people;
    this.meshes = new Map();                     // crate id -> its mesh and its tag
    this.ghosts = { a: crate(), b: crate(), p: crate() };   // the chained block over each ring, and Bob's next one over his press
    for (const g of Object.values(this.ghosts)) { g.scale.setScalar(.6); g.visible = false; this.scene.add(g); g.userData.tag = label(); this.scene.add(g.userData.tag); }
    this.checks = label(); this.scene.add(this.checks);
    this.onChange = () => {};   // set by main: the card in the corner follows the stage
    this.idle = (dt, time) => {
      for (const [k, p] of Object.entries(this.people)) p.position.y = Math.abs(Math.sin(time * 1.3 + k.charCodeAt(0))) * .25;
      for (const g of Object.values(this.ghosts)) if (g.visible) g.rotation.y = Math.sin(time * 1.2) * .25;
    };
    tickers.add(this.idle);
    for (const k of ['plain', 'ecb', 'cbc']) this.wallPaint(k, 0);
  }

  // ---------- where things are ----------
  head(k) { return this.people[k].position.clone().add(v(0, 19.5, 0)); }
  crateTop(id) { const m = this.meshes.get(id); return m ? m.position.clone().add(v(0, CRATE / 2 + 2.5, 0)) : this.head('e'); }

  // ---------- the state of a story step ----------
  // crates: [{ id, label, bytes, look, x, y?, z?, hi?, mark? }] (look: text | hex | bad | seal; mark: same | bad | ok)
  // ghost: { a, b, p } the block hovering over Alice's ring, Bob's ring, Bob's press ({ bytes, label } or null)
  // rings: XOR rings shown (CBC) · wall: { ecb, cbc } how far each screen is encrypted (0..1), plain: the screens lit
  // table: { kind, rows } the card · verdict: Bob's HMAC check, null | 'ok' | 'bad'
  apply(st) {
    this.token++;
    this.st = { crates: [], ghost: {}, rings: false, wall: { plain: 0, ecb: 0, cbc: 0 }, table: { kind: 'msg', rows: [] }, verdict: null, ...st };
    st = this.st;
    st.crates = st.crates.map(c => ({ ...c, bytes: Uint8Array.from(c.bytes), hi: [...(c.hi || [])] }));
    st.ghost = { ...st.ghost }; st.wall = { plain: 0, ecb: 0, cbc: 0, ...st.wall };
    st.table = { kind: st.table.kind, rows: st.table.rows.map(r => [...r]) };
    for (const [id, m] of this.meshes) if (!st.crates.some(c => c.id === id)) this.drop(id);
    for (const c of st.crates) this.place(c);
    for (const k of ['a', 'b', 'p']) this.setGhost(k, st.ghost[k]);
    for (const r of Object.values(this.world.rings)) r.scale.setScalar(st.rings ? 1 : .0001);
    for (const p of Object.values(this.world.presses)) p.userData.setHot(0);
    for (const k of ['ecb', 'cbc']) this.wallPaint(k, st.wall[k]);
    for (const [k, s] of Object.entries(this.world.screens)) s.userData.pic.material.color.set(st.wall.plain ? 0xd8d8d8 : 0x050608);
    this.checks.visible = false;
    for (const p of Object.values(this.people)) p.userData.arms.rotation.x = 0;
    this.relabel();
  }

  // a crate of the state, made or moved to where it says, painted with its bytes
  place(c) {
    let m = this.meshes.get(c.id);
    if (!m) { m = crate(); m.userData.tag = label(); this.scene.add(m, m.userData.tag); this.meshes.set(c.id, m); }
    m.position.set(c.x, c.y ?? CRATE_Y, c.z ?? 0); m.rotation.set(0, 0, 0); m.scale.setScalar(1); m.visible = true;
    m.userData.paint(c.bytes, c.look, c.hi);
    m.userData.faceMat.emissiveIntensity = c.mark === 'same' || c.mark === 'bad' ? .5 : .25;
    m.userData.faceMat.emissive.set(c.mark === 'bad' ? 0xff6060 : 0xffffff);
    this.tagCrate(c);
    return m;
  }
  tagCrate(c) {
    const m = this.meshes.get(c.id), t = m.userData.tag, color = { same: '#ff4d5e', bad: '#ff4d5e', ok: '#5fe39a' }[c.mark] || (c.look === 'text' ? '#efe4c8' : c.look === 'seal' ? '#ff8f9a' : '#9fd0ff');
    const text = c.mark === 'same' ? `${c.label} =` : c.label;
    if (text + color !== t.userData.key) { setLabel(t, text, color, 2); t.userData.key = text + color; }
    // a crate with the seal on top has its tag in front of it, at the foot
    const under = this.st.crates.some(o => o.id === 'T' && o !== c && Math.abs(o.x - c.x) < 1);
    t.visible = true; t.position.copy(m.position).add(under ? v(0, -CRATE / 2 - .4, CRATE / 2 + 1.2) : v(0, CRATE / 2 + 1.8, 0));
  }
  drop(id) {
    const m = this.meshes.get(id); if (!m) return;
    this.scene.remove(m, m.userData.tag); m.userData.tex.dispose(); m.userData.tag.material.map?.dispose(); this.meshes.delete(id);
  }
  crate(id) { return this.st.crates.find(c => c.id === id); }
  setGhost(k, g) {
    const m = this.ghosts[k], t = m.userData.tag;
    this.st.ghost[k] = g || null;
    m.visible = !!g; t.visible = !!g;
    if (!g) return;
    m.position.copy(k === 'p' ? v(X.pressB, CRATE_Y + 18, 0) : HOLD[k]); m.scale.setScalar(.6);
    m.userData.paint(g.bytes, 'hex');
    setLabel(t, g.label, '#e3b8ff', 1.6); t.position.copy(m.position).add(v(0, 3.2, 0));
  }
  wallPaint(k, upto) {
    const s = this.world.screens[k].userData;
    paint(s.canvas, k === 'plain' ? null : k, k === 'plain' ? 0 : upto); s.tex.needsUpdate = true;
  }

  relabel() {
    for (const c of this.st.crates) this.tagCrate(c);
    const caps = raw('wall');
    for (const [k, s] of Object.entries(this.world.screens)) {
      const text = k === 'plain' ? caps.plain : k.toUpperCase();
      if (s.userData.cap.userData.text !== text) { s.userData.cap.userData.redraw(text); s.userData.cap.userData.text = text; }
    }
    this.onChange();
  }

  // ---------- animation helpers ----------
  tween(dur, f) {
    const tok = this.token;
    return new Promise(res => {
      let x = 0;
      const tick = dt => {
        if (tok !== this.token) { this.tickers.delete(tick); return res(false); }   // a new step took over
        x = Math.min(1, x + dt * this.speed / dur); f(x);
        if (x >= 1) { this.tickers.delete(tick); res(true); }
      };
      this.tickers.add(tick);
    });
  }
  wait(s) { return this.tween(s, () => {}); }
  async arm(k, up = 1, dur = .3) { const a = this.people[k].userData.arms; const r0 = a.rotation.x; await this.tween(dur, x => a.rotation.x = r0 + (-up - r0) * ease(x)); }

  // Slide crates along the belt, each to its own x, together; the belt runs under them.
  async slide(moves, pace = 1) {
    const list = Object.entries(moves).map(([id, x]) => ({ c: this.crate(id), m: this.meshes.get(id), x0: this.crate(id).x, x1: x }));
    const far = Math.max(...list.map(l => Math.abs(l.x1 - l.x0)), 1), belt = this.world.conveyor.userData;
    let last = 0;
    const ok = await this.tween((.5 + far * .028) / pace, x => {
      const k = ease(x);
      for (const l of list) { l.c.x = l.x0 + (l.x1 - l.x0) * k; l.m.position.x = l.c.x; this.tagCrate(l.c); }
      belt.run(far * (k - last)); last = k;
    });
    if (ok) for (const l of list) l.c.x = l.x1;
    return ok;
  }
  repaint(c, bytes, look, label = c.label) {
    c.bytes = Uint8Array.from(bytes); c.look = look; c.label = label;
    this.meshes.get(c.id).userData.paint(c.bytes, c.look, c.hi); this.tagCrate(c);
  }
  // A crate goes through a press: in, the press glows, its bytes change, out.
  async through(id, kind, bytes, look, label, out, pace = 1) {
    const c = this.crate(id), p = this.world.presses[kind].userData, at = kind === 'a' ? X.pressA : X.pressB;
    if (!await this.slide({ [id]: at }, pace)) return false;
    sfx.press();
    if (!await this.tween(.35 / pace, x => p.setHot(Math.sin(Math.PI * x)))) return false;
    this.repaint(c, bytes, look, label);
    burst(v(at, CRATE_Y + 6, 3), kind === 'a' ? 0x7fc0ff : 0xffd27a, { count: 30, speed: 4, up: 3, size: .35, life: .7, gravity: 6 });
    if (!await this.tween(.35 / pace, x => p.setHot(Math.sin(Math.PI * (1 - x)) * .6))) return false;
    p.setHot(0);
    return out == null || await this.slide({ [id]: out }, pace);
  }
  // A crate goes through a ring: the chained block above comes down into it, they mix (XOR).
  async mix(id, k, bytes, look, label, pace = 1) {
    const c = this.crate(id), g = this.ghosts[k], r = this.world.rings[k].userData, at = k === 'a' ? X.xorA : X.xorB;
    if (!await this.slide({ [id]: at }, pace)) return false;
    const y0 = g.position.y;
    g.userData.tag.visible = false;
    if (!await this.tween(.6 / pace, x => { g.position.y = y0 + (CRATE_Y - y0) * ease(x); g.scale.setScalar(.6 + .4 * x); r.setHot(x); })) return false;
    sfx.mix();
    this.repaint(c, bytes, look, label);
    ring(v(at, BELT_Y, 0), 0xc070ff, { radius: 8, life: .8 });
    this.setGhost(k, null); r.setHot(0);
    return this.wait(.25 / pace);
  }
  // A copy of a block flies up to hover over ring k (or Bob's press, 'p'): the next one's chain.
  async lift(id, k, label, pace = 1) {
    const c = this.crate(id), g = this.ghosts[k], from = this.meshes.get(id).position.clone();
    const to = k === 'p' ? v(X.pressB, CRATE_Y + 18, 0) : HOLD[k];
    this.setGhost(k, { bytes: c.bytes, label });
    g.userData.tag.visible = false;
    const ok = await this.tween(.9 / pace, x => { g.position.lerpVectors(from, to, ease(x)); g.position.y += Math.sin(Math.PI * x) * 6; g.scale.setScalar(1 - .4 * x); });
    if (ok) this.setGhost(k, { bytes: c.bytes, label });
    return ok;
  }
  // move the ghost over Bob's press to his ring
  async pass(pace = 1) {
    const g = this.ghosts.p, gh = this.st.ghost.p, from = g.position.clone();
    g.userData.tag.visible = false;
    const ok = await this.tween(.7 / pace, x => { g.position.lerpVectors(from, HOLD.b, ease(x)); g.position.y += Math.sin(Math.PI * x) * 3; });
    if (!ok) return false;
    this.setGhost('p', null); this.setGhost('b', gh);
    return true;
  }
  addCrate(c, drop = true) {
    c = { ...c, bytes: Uint8Array.from(c.bytes), hi: [...(c.hi || [])] };
    this.st.crates.push(c); const m = this.place(c);
    if (!drop) return Promise.resolve(true);
    const y1 = m.position.y;
    sfx.thud();
    return this.tween(.45, x => { m.position.y = y1 + 14 * (1 - x) * (1 - x); this.tagCrate(c); }).then(ok => { m.position.y = y1; this.tagCrate(c); return ok; });
  }
  row(...cells) { this.st.table.rows.push(cells); this.onChange(); }

  // ---------- the actions ----------
  // Alice's 53 bytes, cut into four crates of 16; the last one padded.
  async split(P = A.P) {
    this.arm('a', .9);
    this.st.table = { kind: 'msg', rows: [] };
    for (let i = 0; i < P.length; i++) {
      if (!await this.addCrate({ id: 'P' + (i + 1), label: 'P' + (i + 1), bytes: P[i], look: 'text', x: SLOT.inA[i] })) return false;
      this.row(...ROWS.msg(i, P));
      if (!await this.wait(.35)) return false;
    }
    this.arm('a', 0);
    return true;
  }

  // ECB: every crate through the press on its own, with the same key.
  async ecb(P = A.P, pace = 1) {
    this.st.table = { kind: 'ecb', rows: [] };
    const E = A.ecb(A.KEY, P);
    for (let i = 0; i < P.length; i++) {
      const id = 'P' + (i + 1);
      if (!await this.through(id, 'a', E[i], 'hex', 'C' + (i + 1), SLOT.outA[i], pace)) return false;
      this.row(...ROWS.ecb(i, P));
    }
    return true;
  }
  // C1 and C3 are the same crate: mark them
  async same() {
    for (const id of ['P1', 'P3']) this.crate(id).mark = 'same';
    this.relabel(); sfx.capture();
    for (const id of ['P1', 'P3']) ring(this.meshes.get(id).position.clone().setY(BELT_Y), 0xff4d5e, { radius: 6, life: 1.2 });
    return this.wait(.8);
  }

  // The penguin goes through the press: the screen fills row after row.
  async wall(k, dur = 3) {
    sfx.wind();
    const ok = await this.tween(dur, x => { this.st.wall[k] = x; this.wallPaint(k, x); });
    if (ok) { this.st.wall[k] = 1; this.wallPaint(k, 1); }
    return ok;
  }

  // CBC: the IV over the ring; each crate through the ring (mixed with the block before), then the press.
  async cbc(iv = A.IV1, P = A.P, pace = 1) {
    const r = A.cbc(A.KEY, iv, P), name = iv === A.IV1 || P !== A.P ? 'IV' : 'IV₂';
    this.st.table = { kind: 'cbc', rows: [] };
    this.setGhost('a', { bytes: iv, label: name });
    sfx.pour();
    if (!await this.addCrate({ id: 'IV', label: name, bytes: iv, look: 'hex', x: SLOT.ivA })) return false;
    this.row(...ROWS.iv(name, iv));
    for (let i = 0; i < P.length; i++) {
      const id = 'P' + (i + 1), n = i + 1, prev = i ? 'C' + i : name;
      if (!await this.mix(id, 'a', r.X[i], 'hex', `P${n} ⊕ ${prev}`, pace)) return false;
      if (!await this.through(id, 'a', r.C[i], 'hex', 'C' + n, null, pace)) return false;
      this.row(...ROWS.cbc(r, i, name, P));
      const lift = i < P.length - 1 ? this.lift(id, 'a', 'C' + n, pace) : Promise.resolve(true);
      if (!await this.slide({ [id]: SLOT.outA[i] }, pace) || !await lift) return false;
    }
    return true;
  }

  // The crates ride the belt from Alice's end to Bob's; with stop, C1 halts in front of Eve.
  // stop: the number of the block that halts in front of Eve (0 for C1), or null to go all the way.
  async send(stop = null, pace = 1) {
    const ids = this.st.crates.map(c => c.id);
    const leg = k => Object.fromEntries(ids.map(id => [id, this.crate(id).x + k]));
    sfx.send();
    if (stop != null) return this.slide(leg(SLOT.eve - this.crate('P' + (stop + 1)).x), pace);
    return this.slide(leg(SLOT.inB[0] - this.crate('P1').x), pace);
  }

  // Eve lifts C1, flips the two bits of the mask in its byte 8 (ff becomes f6), puts it back.
  // fresh: the card starts a new table (in the parade it goes on under the HMAC).
  async flip(f = A.FLIP, pace = 1, fresh = true) {
    const c = this.crate('P' + (f.block + 1)), m = this.meshes.get(c.id), y0 = m.position.y, z0 = m.position.z;
    this.arm('e', 1);
    if (!await this.tween(.8 / pace, x => { m.position.y = y0 + 5 * ease(x); m.position.z = z0 + 3 * ease(x); m.rotation.x = .35 * ease(x); this.tagCrate(c); })) return false;
    c.hi = [f.byte]; this.repaint(c, c.bytes, c.look);
    if (!await this.wait(.9 / pace)) return false;
    const before = c.bytes[f.byte], b = Uint8Array.from(c.bytes); b[f.byte] ^= f.mask;
    sfx.flip(); this.repaint(c, b, c.look);
    burst(m.position.clone().add(v(0, 0, 4)), 0xff3347, { count: 40, speed: 4, up: 2, size: .35, life: .8, gravity: 4 });
    this.st.flipped = { ...f, before, after: b[f.byte] };
    if (fresh) this.st.table = { kind: 'flip', rows: [ROWS.c(f.block, c.bytes.map((x, i) => i === f.byte ? before : x))] };
    this.row(...ROWS.flip(f, before));
    if (fresh) this.row(...ROWS.c(f.block, b, '′'));
    if (!await this.wait(.9 / pace)) return false;
    if (!await this.tween(.7 / pace, x => { m.position.y = y0 + 5 * (1 - ease(x)); m.position.z = z0 + 3 * (1 - ease(x)); m.rotation.x = .35 * (1 - ease(x)); this.tagCrate(c); })) return false;
    this.arm('e', 0);
    return true;
  }

  // Bob: in CBC the IV goes over his ring; each crate through his press (AES backwards), then
  // in CBC through the ring, mixed with the cipher block before it.
  async decrypt(pace = 1) {
    const crates = this.st.crates.filter(c => /^P\d$/.test(c.id)), C = crates.map(c => c.bytes), chain = !!this.crate('IV');
    const iv = chain ? this.crate('IV').bytes : null, r = chain ? A.cbcDec(A.KEY, iv, C) : { D: C.map(c => A.decryptBlock(A.KEY, c)) };
    if (!chain) r.P = r.D;
    this.st.table = { kind: chain ? 'dec' : 'decEcb', rows: [] };
    this.drop('T'); this.st.crates = this.st.crates.filter(c => c.id !== 'T');
    if (chain) {
      const ivm = this.meshes.get('IV'), from = ivm.position.clone(), g = this.ghosts.b;
      this.st.crates = this.st.crates.filter(c => c.id !== 'IV');
      this.setGhost('b', { bytes: iv, label: 'IV' }); g.userData.tag.visible = false;
      if (!await this.tween(.9 / pace, x => { g.position.lerpVectors(from, HOLD.b, ease(x)); g.position.y += Math.sin(Math.PI * x) * 6; g.scale.setScalar(1 - .4 * x); ivm.position.copy(g.position); ivm.scale.copy(g.scale); })) return false;
      this.drop('IV'); this.setGhost('b', { bytes: iv, label: 'IV' });
    }
    for (let i = 0; i < crates.length; i++) {
      const c = crates[i], id = c.id, n = i + 1, last = i === crates.length - 1;
      const look = show(r.P[i]).endsWith(' ..') ? 'bad' : 'text';   // garbage reads as hex
      if (!await this.slide({ [id]: X.pressB }, pace)) return false;
      if (chain && !last) this.setGhost('p', { bytes: c.bytes, label: 'C' + n });
      c.hi = [];
      if (!await this.through(id, 'b', r.D[i], chain ? 'hex' : look, chain ? `AES⁻¹(C${n})` : 'P' + n, null, pace)) return false;
      const f = this.st.flipped;
      if (f && f.block === i - (chain ? 1 : 0) && look === 'text') c.hi = [f.byte];
      if (chain && !await this.mix(id, 'b', r.P[i], look, 'P' + n, pace)) return false;
      if (!chain) this.repaint(c, r.P[i], look);
      c.mark = look === 'bad' ? 'bad' : null; this.tagCrate(c);
      this.row(...(chain ? ROWS.dec(r, i) : ROWS.decEcb(r, i)));
      const pass = chain && !last ? this.pass(pace) : Promise.resolve(true);
      if (!await this.slide({ [id]: SLOT.outB[i] }, pace) || !await pass) return false;
    }
    this.st.read = r.P;
    return true;
  }

  // The parade: Alice seals IV + cipher with an HMAC; the seal rides on top of the IV (on C1 in ECB).
  signed() {
    const C = this.st.crates.filter(c => /^P\d$/.test(c.id)), iv = this.crate('IV');
    return { C, under: iv || C[0], data: A.concat([...(iv ? [iv.bytes] : []), ...C.map(c => c.bytes)]) };
  }
  async seal(pace = 1) {
    const { under, data } = this.signed(), tag = await A.hmac(A.MAC_KEY, data);
    this.arm('a', .9); sfx.lock();
    if (!await this.addCrate({ id: 'T', label: 'HMAC', bytes: tag.slice(0, 16), look: 'seal', x: under.x, y: CRATE_Y + CRATE })) return false;
    this.st.tag = tag; this.relabel();
    this.row(...ROWS.mac(tag));
    this.arm('a', 0);
    return true;
  }
  // Bob checks the seal before anything: he computes the HMAC of what he got and compares.
  async check(pace = 1) {
    const { C, data } = this.signed(), tag = await A.hmac(A.MAC_KEY, data);
    this.arm('b', .9);
    for (const c of [...C].reverse()) { ring(this.meshes.get(c.id).position.clone().setY(BELT_Y), 0xffc24d, { radius: 5, life: .7 }); sfx.tick(); if (!await this.wait(.3 / pace)) return false; }
    const good = A.same(tag, this.st.tag);
    const spot = this.meshes.get('T').position.clone().add(v(0, CRATE / 2 + 7, 0));
    setLabel(this.checks, `${raw('check.bob')} ${A.hex(tag, 4)} ..`, good ? '#5fe39a' : '#ff4d5e', 2.2); this.checks.position.copy(spot); this.checks.visible = true;
    this.st.verdict = good ? 'ok' : 'bad';
    this.row(...ROWS.check(tag, good));
    icon(spot.clone().add(v(0, 4, 0)), good ? '✔' : '✖', good ? '#5fe39a' : '#ff4d5e', { life: 2.6, size: 6, rise: 5 });
    if (good) sfx.win(); else sfx.reject();
    if (!good) { for (const c of C) c.mark = 'bad'; this.relabel(); }
    this.arm('b', 0);
    this.onChange();
    return true;
  }
}

const hx = b => b.toString(16).padStart(2, '0');
const h6 = b => A.hex(b, 6) + ' ..';
// the card's rows, the same whether an action writes them or a story step starts with them
export const ROWS = {
  msg: (i, P = A.P) => ['P' + (i + 1), show(P[i])],
  ecb: (i, P = A.P) => ['P' + (i + 1), show(P[i]), 'C' + (i + 1), h6(A.encryptBlock(A.KEY, P[i]))],
  iv: (name, iv) => [name, h6(iv)],
  cbc: (r, i, name = 'IV', P = A.P) => ['P' + (i + 1), show(P[i]), '⊕ ' + (i ? 'C' + i : name), h6(r.X[i]), 'C' + (i + 1), h6(r.C[i])],
  flip: (f, before) => [`C${f.block + 1}[${f.byte}]`, `${hx(before)} → ${hx(before ^ f.mask)}`, '⊕ ' + hx(f.mask), `${bits(before)} → ${bits(before ^ f.mask)}`],
  decEcb: (r, i) => ['C' + (i + 1), h6(r.D[i]), 'P' + (i + 1), show(r.P[i])],
  dec: (r, i) => ['C' + (i + 1), h6(r.D[i]), '⊕ ' + (i ? 'C' + i : 'IV'), '', 'P' + (i + 1), show(r.P[i])],
  c: (i, b, mark = '') => ['C' + (i + 1) + mark, A.hex(b.slice(0, 10)) + ' ..'],
  mac: tag => ['HMAC', h6(tag)],
  check: (tag, good) => ['@check.row', h6(tag), good ? '=' : '≠'],
};
const bits = b => b.toString(2).padStart(8, '0').replace(/(....)/, '$1 ');

// A floating tag (« C1 », « P1 ⊕ IV »): a sprite with its text drawn on a canvas.
export function label() {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthTest: false }));
  s.renderOrder = 20; s.visible = false; s.userData.text = '';
  return s;
}
export function setLabel(s, text, color, h = .34) {
  const c = document.createElement('canvas'), x = c.getContext('2d'), font = '700 40px "Courier New", Courier, monospace';
  x.font = font; const w = Math.ceil(x.measureText(text).width) + 40;
  c.width = Math.max(72, w); c.height = 72;
  x.font = font; x.fillStyle = 'rgba(16,18,28,.86)'; x.strokeStyle = color; x.lineWidth = 5;
  x.beginPath(); x.roundRect(3, 3, c.width - 6, 66, 30); x.fill(); x.stroke();
  x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, c.width / 2, 38);
  s.material.map?.dispose(); s.material.map = new THREE.CanvasTexture(c); s.material.map.colorSpace = THREE.SRGBColorSpace; s.material.needsUpdate = true;
  s.scale.set(c.width / 72 * h, h, 1); s.userData.text = text;
}
