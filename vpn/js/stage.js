// The actors and the props on the map, and everything they do: an envelope rides the cables from
// Alice's laptop to Bob's site, each box on the way reading the address on its outside; the watchers
// (Eve on the café's open Wi-Fi, the provider, Victor at the VPN, Bob) each show on a tag what they
// read; Alice and Victor swap public keys and find the same secret; the tunnel seals the envelope,
// Bob's address included, in a gold case addressed to the VPN; a flipped byte and the case is thrown
// away. apply(state) puts everything where a story step says, instantly; the async actions animate
// from there and write back into st what they changed.
import * as THREE from 'three';
import { NODES, SPOTS, edge } from './world.js';
import { envelope, tag, setTag, key, person, COLORS } from './props.js';
import { ADDR, NAME, PUBLIC, KEY, hex, sees, route, opened, flipped, SEALED } from './net.js';
import { burst, ring } from './fx.js';
import { sfx } from './sound.js';
import { t, raw } from './i18n.js';

const v = (x, y, z) => new THREE.Vector3(x, y, z);
const ease = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const PERSON = .56;                               // the characters are built 3.2 tall: 1.8 m here
const SPEED = 14;
const KEY_SIZE = 4.5;                             // the keys float big over Alice and Victor: the map is seen whole                                 // an envelope's pace along a cable, m/s
const WATCHERS = ['e', 'i', 'v', 'b'];
// where Eve can stand (the sandbox moves her): at her café table, at the provider's racks, at the
// VPN's in Victor's place, at Bob's server in Bob's place
const EVE_AT = {
  cafe: { pos: v(-33.1, 0, -1), turn: -1.95, node: 'w' },
  isp: { pos: v(-3.4, 0, -6.2), turn: -.9, node: 'i' },
  vpn: { pos: v(-11.7, 0, -31.4), turn: -.9, node: 'v' },
  bob: { pos: v(30.4, 0, .9), turn: .7, node: 'b' },
};

// what a story step sets; every field has a resting value
const BASE = {
  https: true,            // Bob's site locks the content (HTTPS)
  tunnel: false,          // the WireGuard tunnel is up: the gold tube, the packets go through the VPN
  eve: 'cafe',            // where Eve listens
  read: [],               // the watchers whose tag shows what they read: 'e' 'i' 'v' 'b'
  what: 'page',           // what went by: 'page' (the request to Bob's site), 'keys' (the public keys), 'dns'
  keys: 0,                // 0 no keys; 1 each side has its pair, the public halves swapped; 2 both found the shared key
  parked: null,           // an envelope resting at a stop: { at, kind }
  dropped: false,         // the VPN threw the last packet away
  card: 'none',
};

export class Stage {
  constructor(world, tickers) {
    this.world = world; this.scene = world.scene; this.tickers = tickers; this.speed = 1; this.token = 0;
    const S = this.scene;
    this.people = {};
    for (const k of ['a', 'b', 'e', 'v']) { const p = person(k); p.scale.setScalar(PERSON); S.add(p); this.people[k] = p; }
    const a = this.people.a; a.position.copy(SPOTS.tableA).add(v(-.62, 0, .18)); a.rotation.y = 1.9;
    world.laptops.a.rotation.y = -1.25;
    world.laptops.e.rotation.y = 1.2;
    const b = this.people.b; b.position.copy(NODES.b).setY(0).add(v(1.4, 0, .8)); b.rotation.y = -.5;
    const vi = this.people.v; vi.position.copy(NODES.v).setY(0).add(v(2.3, 0, .7)); vi.rotation.y = -.7;
    // the watchers' tags, over their heads (the provider has no face: its tag hangs over its racks)
    this.tags = { e: tag(), i: tag(), v: tag(), b: tag() };
    this.places = { cafe: tag(), isp: tag(), vpn: tag(), bob: tag() };
    S.add(...Object.values(this.tags), ...Object.values(this.places));
    // the places' names are for the map seen whole: they fade out as the camera comes close, and hide behind walls
    for (const p of Object.values(this.places)) {
      p.material.depthTest = true;
      p.onBeforeRender = (r, sc, cam) => { p.material.opacity = Math.min(1, Math.max(0, (cam.position.distanceTo(p.position) - 24) / 14)); };
    }
    // seen from far (the map whole), a watcher's tag hangs down from the body instead of sitting on it,
    // so the speaker's bubble, drawn up from the head, never lands on its top lines (r225)
    // Victor's stands to his left instead: hanging, it would fall on the provider's, right below it on the map.
    // They draw over the places' names.
    for (const [k, s] of Object.entries(this.tags)) {
      s.renderOrder = 30;   // tag() gives 20, the places keep it
      if (k !== 'i') s.onBeforeRender = (r, sc, cam) => {
        if (s.userData.pin) return;   // a phone placed it (pinTags)
        const far = cam.position.distanceTo(s.position) > 30;
        s.center.set(far && k === 'v' ? 1.08 : .5, far && k !== 'v' ? 1 : .5);
      };
    }
    // each place's name over the back of its roof, clear of the watchers' tags at the front
    this.places.cafe.position.set(SPOTS.cafe.x, 7.6, SPOTS.cafe.z - 2.5);
    this.places.isp.position.set(SPOTS.isp.x + 9, 11.4, SPOTS.isp.z - 3);   // east of the roof: Victor's tag, seen whole, stands west of it (r225)
    this.places.vpn.position.set(SPOTS.vpn.x, 8, SPOTS.vpn.z - 2.5);
    this.places.bob.position.set(SPOTS.bob.x, 7.6, SPOTS.bob.z - 2);
    this.tags.i.position.copy(NODES.i).add(v(0, -.6, .8));
    // the tunnel: a gold glass tube from the laptop to the VPN's racks, along the packets' way
    const curves = ['aw', 'wi', 'iv'].map(k => edge(k[0], k[1]).curve);
    this.tube = new THREE.Group();
    for (const c of curves) this.tube.add(new THREE.Mesh(new THREE.TubeGeometry(c, 120, .42, 12), new THREE.MeshStandardMaterial({
      color: 0xffd66b, emissive: 0xffb020, emissiveIntensity: .35, transparent: true, opacity: .2, depthWrite: false, side: THREE.DoubleSide })));
    S.add(this.tube);
    // the keys: Alice's and Victor's secret (red) and public (blue) halves, then the shared one (gold)
    this.keys = {};
    for (const k of ['a', 'v']) {
      this.keys[k] = { secret: key(0xff6b6b), pub: key(0x5fb0ff), shared: key(0xffd66b) };
      // each key's tag hangs in the scene, not on the key: it would grow with the key's scale
      for (const o of Object.values(this.keys[k])) { o.scale.setScalar(KEY_SIZE); S.add(o); o.remove(o.userData.tag); S.add(o.userData.tag); }
    }
    this.envs = new THREE.Group(); S.add(this.envs);   // the envelopes in flight or parked
    this.focus = new THREE.Object3D(); S.add(this.focus);   // the envelope in flight, for the camera to follow
    this.onChange = () => {};
    this.idle = (dt, time) => {
      for (const k of ['a', 'v']) for (const [n, o] of Object.entries(this.keys[k])) o.rotation.y = time * 1.2 + (n === 'pub' ? 2 : 0);
    };
    tickers.add(this.idle);
  }

  // ---------- where things are ----------
  head(k) {
    if (k === 'i') return NODES.i.clone().add(v(0, 2.2, 0));
    const p = this.people[k]; return p.position.clone().add(v(0, 2.05, 0));
  }
  keyAt(k, n) { return this.head(k).add(v(n === 'secret' ? -1.6 : n === 'pub' ? 1.6 : 0, n === 'shared' ? 4.4 : 2, 0)); }

  // ---------- the state of a story step ----------
  apply(st) {
    this.token++;
    this.st = { ...BASE, ...st, read: [...(st?.read || [])] };
    st = this.st;
    const e = this.people.e, at = EVE_AT[st.eve];
    e.position.copy(at.pos); e.rotation.y = at.turn;
    this.people.v.visible = st.eve !== 'vpn'; this.people.b.visible = st.eve !== 'bob';
    this.tube.visible = st.tunnel;
    this.drawKeys();
    this.drawTags();
    this.envs.clear();
    this.focus.position.copy(NODES.a);
    if (st.parked) { const env = this.makeEnv(st.parked.kind, this.addrLabel('page')); env.position.copy(NODES[st.parked.at]).add(v(0, .5, 0)); this.envs.add(env); }
    this.redraw();
  }
  redraw() { this.onChange(); }

  drawKeys() {
    const k = this.st.keys;
    for (const who of ['a', 'v']) {
      const o = this.keys[who];
      o.secret.visible = k >= 1; o.pub.visible = k >= 1; o.shared.visible = k >= 2;
      for (const n of ['secret', 'pub', 'shared']) { o[n].position.copy(this.keyAt(who, n)); o[n].userData.tag.position.copy(o[n].position).add(v(0, 1.2, 0)); }
      const pub = who === 'a' ? PUBLIC.a : PUBLIC.v;
      setTag(o.secret.userData.tag, [t('tag.secret')], '#ff6b6b', .016);
      setTag(o.pub.userData.tag, [t('tag.public'), hex(pub, 4) + '…'], '#5fb0ff', .016);
      setTag(o.shared.userData.tag, [t('tag.shared'), hex(KEY[who], 4) + '…'], '#ffd66b', .018);
      o.secret.userData.tag.visible = o.secret.visible; o.pub.userData.tag.visible = o.pub.visible; o.shared.userData.tag.visible = o.shared.visible;
    }
  }

  // what a watcher's tag says: one line per thing it reads
  lines(who) {
    const st = this.st, w = raw('tag');
    if (who === 'e') who = { cafe: 'e', isp: 'i', vpn: 'v', bob: 'b' }[st.eve];
    if (st.what === 'keys') return who === 'v' ? [[w.gotPub, '#fff'], [hex(PUBLIC.a, 4) + '…', '#5fb0ff']]
      : [[w.twoPubs, '#fff'], [`${hex(PUBLIC.a, 4)}… ${hex(PUBLIC.v, 4)}…`, '#5fb0ff'], [w.noSecret, '#9aa3b5']];
    if (st.what === 'dns' && who !== 'v' && who !== 'b') return [[t('tag.asks', { name: NAME }), '#fff'], [t('tag.answer', { addr: ADDR.bob }), '#fff']];
    if (st.dropped && who === 'v') return [[w.badTag, '#ff8f9a'], [w.thrown, '#ff8f9a']];
    const s = sees(who, st), L = [];
    if (s.content === null) return [[w.nothing, '#9aa3b5']];
    if (s.from) L.push([t('tag.from', { addr: ADDR[s.from], who: w.place[s.from] }), '#fff']);
    if (s.to) L.push([t('tag.to', { addr: ADDR[s.to], who: w.place[s.to] }), s.to === 'bob' && who !== 'b' ? '#ffb3bb' : '#fff']);
    if (s.name && who !== 'b') L.push([NAME, '#ffb3bb']);
    L.push(s.content === 'clear' ? [who === 'b' ? w.reads : t('tag.clear', { c: w.pw }), who === 'b' ? '#fff' : '#ff8f9a']
      : s.content === 'locked' ? [w.locked, '#5fe39a'] : [t('tag.sealed', { n: SEALED.ct.length + SEALED.tag.length }), '#ffd66b']);
    if (s.when && who !== 'b') L.push([w.when, '#d9d2c0']);
    return L;
  }
  drawTags() {
    const st = this.st;
    for (const who of WATCHERS) {
      const s = this.tags[who], show = st.read.includes(who);
      if (who !== 'i') s.position.copy(this.people[who].position).add(v(0, .9, 0));   // over the body: the bubble goes over the head
      if (show) setTag(s, this.lines(who), '#' + new THREE.Color(COLORS[who]).getHexString(), .019); else s.visible = false;
      s.userData.want = show;
    }
    const p = raw('place');
    for (const [k, s] of Object.entries(this.places)) setTag(s, [p[k]], '#e6dfcf', .026);
  }

  // The screen box of a tag (a sprite that keeps its size) for a camera, centred as s.center says;
  // null when it is behind the camera. In CSS pixels, like the page's walls.
  screenBox(s, cam) {
    const p = s.getWorldPosition(new THREE.Vector3()).project(cam);
    if (p.z > 1) return null;
    const k = cam.projectionMatrix.elements[5] * innerHeight / 2, w = s.scale.x * k, h = s.scale.y * k;
    const ax = (p.x * .5 + .5) * innerWidth, ay = (-p.y * .5 + .5) * innerHeight;
    return { ax, ay, w, h, x: ax - s.center.x * w, y: ay - (1 - s.center.y) * h };
  }
  // On a phone the map is narrow and the tags keep their size: they would stack on each other, on the
  // places' names and under the cards (r226). Each frame, the newest reader's tag first takes the free
  // spot nearest to where it hangs, clear of the walls (the cards, the panel, the top controls), the
  // bubbles, the places' names and the tags already placed; a tag with no free spot near its watcher
  // hides, so the oldest give way. walls: boxes in CSS pixels. On a desktop the tags hang as r225 set.
  pinTags(cam, walls, phone) {
    const order = [...this.st.read].reverse().filter(k => this.tags[k]?.userData.want);
    for (const s of Object.values(this.tags)) { s.userData.pin = null; if (s.userData.want !== undefined) s.visible = s.userData.want; }
    for (const p of Object.values(this.places)) p.visible = true;
    if (!phone) return;
    const GAP = 4, R = 80, W = innerWidth, H = innerHeight;
    const hits = (a, b) => Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x) + GAP > 0 && Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y) + GAP > 0;
    // a place's name a card, a bubble or another name covers, or the screen's edge cuts, is hidden; the
    // others are in the tags' way
    const taken = [...walls];
    for (const p of Object.values(this.places)) {
      const b = p.material.opacity > .05 && this.screenBox(p, cam);
      p.visible = !b || (b.x >= 0 && b.x + b.w <= W && !taken.some(o => hits(b, o)));
      if (b && p.visible) taken.push(b);
    }
    for (const k of order) {
      const s = this.tags[k]; s.center.set(.5, k === 'i' ? .5 : 1);
      const b = this.screenBox(s, cam);
      let best = null, d = Infinity;
      if (b) for (let dy = -R; dy <= R; dy += 6) for (let dx = -R; dx <= R; dx += 6) {
        const c = { x: b.x + dx, y: b.y + dy, w: b.w, h: b.h }, dd = dx * dx + dy * dy;
        if (dd >= d || dd > R * R || c.x < 4 || c.y < 4 || c.x + c.w > W - 4 || c.y + c.h > H - 4 || taken.some(o => hits(c, o))) continue;
        best = c; d = dd;
      }
      if (!best) { s.visible = false; continue; }
      taken.push(best);
      s.userData.pin = true; s.center.set((b.ax - best.x) / b.w, 1 - (b.ay - best.y) / b.h);
    }
  }

  // an envelope of a kind, with the address on its tag
  makeEnv(kind, label) {
    const env = envelope(kind);
    if (label) setTag(env.userData.tag, label, kind === 'sealed' ? '#ffd66b' : kind === 'key' ? '#5fb0ff' : '#e6dfcf', .017);
    return env;
  }
  addrLabel(kind) {
    if (kind === 'sealed') return [t('tag.to', { addr: ADDR.vpn, who: raw('tag.place').vpn })];
    if (kind === 'dnsq') return [t('tag.asks', { name: NAME })];
    if (kind === 'dnsa') return [t('tag.answer', { addr: ADDR.bob })];
    return [t('tag.to', { addr: ADDR.bob, who: raw('tag.place').bob })];
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

  // one envelope from stop `from` to stop `to`, along the cable (or the air, from the laptop)
  async hop(env, from, to) {
    const { curve, back } = edge(from, to), len = curve.getLength(), lift = v(0, .45, 0);
    return this.tween(Math.max(.5, len / SPEED), x => {
      const u = ease(x);
      env.position.copy(curve.getPointAt(back ? 1 - u : u)).add(lift);
      this.focus.position.copy(env.position);
    });
  }
  // who watches at a stop: the Wi-Fi is Eve's when she sits at the café; elsewhere Eve, if she stands
  // there, reads in place of the provider, Victor or Bob
  watchersAt(at) {
    const own = { w: null, i: 'i', v: 'v', b: 'b' }[at], eve = EVE_AT[this.st.eve].node === at;
    return [own && !(eve && own !== 'i') ? own : null, eve ? 'e' : null].filter(Boolean);
  }
  // a stop reads the address and passes the envelope on: a ring, a tick, and the watchers there read it
  async stop(at, quiet = false) {
    if (!quiet) { ring(NODES[at].clone().add(v(0, .5, 0)), 0x9fe8ff, { radius: 1.4, life: .8 }); sfx.tick(); }
    for (const r of this.watchersAt(at)) if (this.watch?.includes(r) && !this.st.read.includes(r)) { this.st.read.push(r); this.drawTags(); this.redraw(); }
    return this.wait(quiet ? .05 : .35);
  }

  // A packet from Alice to Bob's site. watch: the watchers whose tag lights as it passes them.
  // Through the tunnel: the gold case to the VPN, opened there, the envelope on to Bob.
  async send(watch = [], { flip = false } = {}) {
    const st = this.st; this.watch = watch; st.dropped = false; this.envs.clear();
    const path = route(st.tunnel);
    let env = this.makeEnv(st.tunnel ? 'sealed' : st.https ? 'locked' : 'plain', this.addrLabel(st.tunnel ? 'sealed' : 'page'));
    env.position.copy(NODES.a).add(v(0, .5, 0)); this.envs.add(env); sfx.send();
    for (let k = 0; k + 1 < path.length; k++) {
      if (!await this.hop(env, path[k], path[k + 1])) return false;
      const at = path[k + 1];
      if (flip && at === EVE_AT[st.eve].node && st.tunnel && at !== 'v') {
        // Eve changes one bit of one byte of the case as it goes by: it looks the same from outside
        env.userData.flipped = true; burst(env.position.clone(), 0xff4d5e, { count: 24, speed: 2.5, size: .12 }); sfx.scratch();
        if (!await this.wait(.5)) return false;
      }
      if (at === 'v' && st.tunnel) {
        // the VPN checks the tag: the case opens, or it is thrown away
        const ct = env.userData.flipped ? flipped() : SEALED.ct;
        if (!opened(ct)) {
          st.dropped = true; this.envs.remove(env); burst(NODES.v.clone().add(v(0, .6, 0)), 0xff4d5e, { count: 60, speed: 4, size: .16 }); sfx.reject();
          if (watch.includes('v') && !st.read.includes('v')) st.read.push('v');
          this.drawTags(); this.redraw(); return this.wait(.6);
        }
        burst(env.position.clone(), 0xffd66b, { count: 40, speed: 3, size: .14 }); sfx.unlock();
        this.envs.remove(env);
        env = this.makeEnv(st.https ? 'locked' : 'plain', this.addrLabel('page')); env.position.copy(NODES.v).add(v(0, .5, 0)); this.envs.add(env);
      }
      if (!await this.stop(at)) return false;
    }
    sfx.arrive();
    return true;
  }

  // The name first: Alice's laptop asks the provider's name server where bob.example lives, in clear.
  async dns(watch = ['e', 'i']) {
    this.watch = watch; this.st.what = 'dns'; this.envs.clear();
    const q = this.makeEnv('plain', this.addrLabel('dnsq')); q.scale.setScalar(.7); q.position.copy(NODES.a).add(v(0, .5, 0)); this.envs.add(q);
    for (const [f, to] of [['a', 'w'], ['w', 'i']]) { if (!await this.hop(q, f, to)) return false; if (!await this.stop(to)) return false; }
    setTag(q.userData.tag, this.addrLabel('dnsa'), '#e6dfcf', .017);
    for (const [f, to] of [['i', 'w'], ['w', 'a']]) { if (!await this.hop(q, f, to)) return false; if (!await this.stop(to, to === 'a')) return false; }
    this.envs.remove(q); this.st.what = 'page';
    return true;
  }

  // Alice and Victor each make a key pair, then send the public half to the other, in clear
  async exchange() {
    const st = this.st; this.watch = ['e', 'i', 'v']; st.what = 'keys'; st.read = [];
    st.keys = 1; this.drawKeys(); this.drawTags(); this.redraw(); sfx.lock();
    for (const k of ['a', 'v']) burst(this.keyAt(k, 'secret'), 0xff6b6b, { count: 24, speed: 2, size: .1 });
    if (!await this.wait(.8)) return false;
    const ea = this.makeEnv('key', [t('tag.public'), hex(PUBLIC.a, 4) + '…']), ev = this.makeEnv('key', [t('tag.public'), hex(PUBLIC.v, 4) + '…']);
    this.envs.add(ea, ev); sfx.send();
    const fwd = ['a', 'w', 'i', 'v'], bwd = [...fwd].reverse();
    for (let k = 0; k < 3; k++) {
      const [r1, r2] = await Promise.all([this.hop(ea, fwd[k], fwd[k + 1]), this.hop(ev, bwd[k], bwd[k + 1])]);
      if (!r1 || !r2) return false;
      for (const at of new Set([fwd[k + 1], bwd[k + 1]])) if (at !== 'a') await this.stop(at, true);
    }
    this.envs.clear(); sfx.arrive();
    return true;
  }

  // each multiplies the other's public key by its own secret: the same gold key appears on both sides
  async derive() {
    this.st.keys = 2; this.drawKeys(); this.redraw();
    for (const k of ['a', 'v']) { const o = this.keys[k].shared; o.scale.setScalar(.01); burst(this.keyAt(k, 'shared'), 0xffd66b, { count: 50, speed: 3, size: .14 }); }
    sfx.win();
    return this.tween(.9, x => { for (const k of ['a', 'v']) this.keys[k].shared.scale.setScalar(KEY_SIZE * ease(x) + .01); });
  }
}
