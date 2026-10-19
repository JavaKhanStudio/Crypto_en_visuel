// The actors and the props on the road, and everything they do: Alice's car rolls and its stone
// prints a mark each turn, seen only in the mud; Eve stretches her tape from mark to mark; bars rise
// for each candidate length; the key wheel tumbles along the lane, stamping each letter of the text
// into its cipher letter; arcs join the groups of letters that come back. apply(state) puts
// everything where a story step says, instantly; the async actions animate from there and write
// back into st what they changed.
import * as THREE from 'three';
import { ROAD, LANE_Z, NEAR_Z, BARS_AT, BARS_NEAR } from './world.js';
import { car, keyWheel, letterTex, label, setLabel, person, COLORS, WHEEL_R, AXLES, PENT_IN, SIDE } from './props.js';
import { WHEEL, CANDIDATES, TEXT, CIPHER, KEY, track, gaps, wheelCounts, repeats, counts, best, metres } from './kasiski.js';
import { burst, ring } from './fx.js';
import { sfx } from './sound.js';
import { t, lang } from './i18n.js';

const v = (x, y, z) => new THREE.Vector3(x, y, z);
const ease = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
export const LANE_N = 96, LANE_TOP = .145;
export const tileX = i => -47.5 + i * SIDE;
const STEP = 2 * Math.PI / 5;
export const START_X = WHEEL.start / 100;       // where the stone first touches the road (m)
const PERSON = .56;                              // the characters are built 3.2 tall: about 1.8 m here

// what a story step sets; every field has a resting value
const BASE = {
  road: WHEEL,            // the road the car drives (its puddles, its marks)
  car: -1,                // how far the car has rolled from the stone's first strike (m); -1: half a turn before, stone on top; null: no car
  printed: -1e9,          // marks printed up to this x (m): the car's stone wheel has passed it
  tape: 0,                // how many gaps Eve has measured
  red: false,             // gaps no candidate explains (the gravel) in red
  bars: null,             // 'wheel' or 'cipher': the bar chart and which counts
  barsNear: false,        // the bars on the road (step 10), below the repeats in the shot, not in front of the lane
  grown: false,           // the bars at their full height
  lane: false,            // the letter lane and the key wheel are out
  stamped: 0,             // tiles 0..stamped-1 show their cipher letter
  kw: 0,                  // the key wheel stands on this tile
  eve: false,             // Eve's view: the cipher letters only, the key unknown
  arcs: false,            // the arcs between repeated groups on the lane
  hot: false,             // the twelve letters at 51 and 81 lit
  key: null,              // the key wheel's faces (null: Alice's key, LEMON)
  lit: [],                // which faces are lit
  card: 'none',
};

export class Stage {
  constructor(world, tickers) {
    this.world = world; this.scene = world.scene; this.tickers = tickers; this.speed = 1; this.token = 0;
    const S = this.scene;
    this.car = car(); S.add(this.car);
    this.people = {};
    for (const k of ['a', 'e']) { const p = person(k); p.scale.setScalar(PERSON); S.add(p); this.people[k] = p; }
    // marks, tape arcs and their tags live in groups rebuilt by apply()
    this.marks = new THREE.Group(); this.tapes = new THREE.Group(); this.arcsG = new THREE.Group(); this.barsG = new THREE.Group();
    S.add(this.marks, this.tapes, this.arcsG, this.barsG);
    // the lane's tiles
    this.tiles = [];
    for (let i = 0; i < LANE_N; i++) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(SIDE * .92, 1.5), new THREE.MeshStandardMaterial({ roughness: .8 }));
      m.rotation.x = -Math.PI / 2; m.position.set(tileX(i), LANE_TOP + .004, LANE_Z); m.receiveShadow = true; S.add(m); this.tiles.push(m);
    }
    this.laneTags = [label(), label()]; S.add(...this.laneTags);
    this.kwheel = keyWheel(); S.add(this.kwheel);
    this.focus = new THREE.Object3D(); S.add(this.focus);   // what the camera follows while Eve measures
    this.onChange = () => {};   // set by main: the card in the corner follows the stage
    this.idle = (dt, time) => {
      const e = this.people.e; if (e.visible) e.position.y = Math.abs(Math.sin(time * 1.3)) * .03;
    };
    tickers.add(this.idle);
  }

  // ---------- where things are ----------
  get marksList() { return track(this.st.road); }
  get gapList() { return gaps(this.marksList); }
  stoneX(d = this.st.car) { return START_X + d; }                 // the stone wheel's axle, along x
  carX(d) { return this.stoneX(d) - AXLES.front; }
  head(k) {
    if (k === 'a') return this.st.lane ? this.people.a.position.clone().add(v(0, 2.1, 0)) : this.car.position.clone().add(v(-.1, 1.75, .4));
    if (k === 'kw') return this.kwheel.position.clone().add(v(0, 1.3, 0));
    if (k === 'bars') return this.barsAt.clone().add(v(0, 3.6, 0));
    return this.people.e.position.clone().add(v(0, 2.1, 0));
  }

  // ---------- the state of a story step ----------
  apply(st) {
    this.token++;
    this.st = { ...BASE, ...st };
    st = this.st;
    if (st.road !== this.builtRoad) { this.world.setPuddles(st.road); this.builtRoad = st.road; }
    // the car, its wheels turned by how far it rolled
    this.car.visible = st.car !== null && !st.lane;
    if (this.car.visible) this.placeCar(st.car);
    this.drawMarks();
    this.drawTape();
    this.drawBars(st.grown ? 1 : 0);
    // the lane
    this.kwheel.visible = st.lane && (!st.eve || !!st.key);   // Eve has no key wheel until she builds hers
    for (const m of this.tiles) m.visible = st.lane;
    this.kwheel.userData.setLetters([...(st.key || KEY)], st.lit);
    this.placeWheel(st.kw, 0);
    this.drawTiles();
    this.drawArcs();
    // the people: Eve by the road (or by the lane), Alice beside her drum on the lane
    const e = this.people.e, a = this.people.a;
    a.visible = st.lane && !st.eve;
    a.position.set(tileX(0) - .4, 0, LANE_Z - 1.7); a.rotation.y = .3;
    e.visible = true;
    // on the lane Eve stands behind it, facing us; on the road, on the verge, at the first marks
    if (st.lane && st.barsNear) { e.position.copy(BARS_NEAR).add(v(6.2, 0, .4)); e.rotation.y = -.7; }   // beside her bars
    else if (st.lane) { e.position.set(st.eve ? tileX(st.key ? 3 : 46) : tileX(30), 0, LANE_Z - 1.7); e.rotation.y = st.key ? -.4 : 0; }
    // with the bars up she stands to their right, in the bar shot rather than in front of its lens
    else if (st.bars) { e.position.copy(BARS_AT).add(v(6.4, 0, 1)); e.rotation.y = -.7; }
    else if (st.card === 'trace' || st.card === 'count') { e.position.set(4, 0, 3.1); e.rotation.y = 0; }   // measuring: mid-road
    else { e.position.set(START_X + 9, 0, 3.1); e.rotation.y = -.3; }
    this.focus.position.set(START_X, 0, 0);
    this.redraw();
  }
  redraw() { this.onChange(); }

  placeCar(d) {
    this.car.position.set(this.carX(d), 0, 0);
    this.car.userData.roll(d);
  }

  // A mark is printed once the stone wheel has passed it and it lies in mud: a dent with a pale rim.
  drawMarks() {
    this.marks.clear();
    for (const m of this.marksList) if (m.x / 100 <= this.st.printed + 1e-6) this.marks.add(dent(m.x / 100));
    // the tyre's tread printed across each puddle it crossed
    for (const p of this.world.puddles.children) {
      const x0 = p.position.x - .75, x1 = Math.min(p.position.x + .75, this.st.printed + .1);
      if (x1 > x0) { const tr = tread(x0, x1); this.marks.add(tr); }
    }
  }

  // Eve's tape: an arc from each mark to the next, the first `tape` of them, with its length.
  drawTape() {
    this.tapes.clear();
    this.tapes.visible = !this.st.bars;   // the arcs run under the bar shot's lens: they blur across its foot
    const gs = this.gapList.slice(0, this.st.tape), best = this.st.road.C;
    for (const [k, g] of gs.entries()) {
      const bad = this.st.red && g.d % best !== 0;
      this.tapes.add(arc(g.from / 100, g.to / 100, NEAR_Z, .06, bad ? 0xff4d5e : 0xffd66b, .5 + g.d / 100 * .12));
      const tag = label(); tag.visible = true;
      // the tags alternate high and low, so neighbours never cover each other; hidden behind the bars
      setLabel(tag, metres(g.d, lang === 'en' ? '.' : ','), bad ? '#ff4d5e' : '#ffd66b', 1.25);
      tag.position.set((g.from + g.to) / 200, 1.3 + g.d / 100 * .12 + (k % 2) * 1.4, NEAR_Z); tag.visible = !this.st.bars; this.tapes.add(tag);
    }
  }

  // ---------- the bars ----------
  barData() {
    if (this.st.bars === 'wheel') {
      const cs = wheelCounts(this.gapList.map(g => g.d), CANDIDATES), n = this.gapList.length;
      return { cs, n, name: c => metres(c.L, lang === 'en' ? '.' : ','), win: best(cs).L };
    }
    const ds = repeats(this.cipher()).map(r => r.d);
    const cs = counts(ds, 2, 8);
    return { cs, n: ds.length, name: c => String(c.L), win: best(cs).L };
  }
  cipher() { return this.st.cipher || CIPHER; }
  get barsAt() { return this.st.barsNear ? BARS_NEAR : BARS_AT; }
  // k: 0 flat, 1 full height
  drawBars(k) {
    this.barsG.clear();
    if (!this.st.bars) return;
    const { cs, n, name, win } = this.barData(), w = .9, gap = .45, x0 = -(cs.length - 1) * (w + gap) / 2, H = 3.2;
    const base = new THREE.Mesh(new THREE.BoxGeometry(cs.length * (w + gap) + .6, .12, 1.4), new THREE.MeshStandardMaterial({ color: 0x3a3d46, roughness: .8 }));
    base.position.copy(this.barsAt).setY(.06); base.receiveShadow = true; this.barsG.add(base);
    cs.forEach((c, i) => {
      const h = Math.max(.02, H * c.n / Math.max(1, n) * k), isWin = c.L === win;
      const bar = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), new THREE.MeshStandardMaterial({ color: isWin && k >= 1 ? 0xf2c24f : 0x6f8fb8, roughness: .5,
        emissive: isWin && k >= 1 ? 0x6a4a08 : 0x000000 }));
      bar.position.set(this.barsAt.x + x0 + i * (w + gap), .12 + h / 2, this.barsAt.z); bar.castShadow = true; this.barsG.add(bar);
      const under = label(); under.visible = true; setLabel(under, name(c), '#b9b2a3', .32);
      under.position.set(bar.position.x, .35, this.barsAt.z + .9); this.barsG.add(under);
      if (k > .05) { const top = label(); top.visible = true; setLabel(top, String(Math.round(c.n * Math.min(1, k * 1.05))), isWin && k >= 1 ? '#f2c24f' : '#9fc0ff', .34);
        top.position.set(bar.position.x, .12 + h + .32, this.barsAt.z); this.barsG.add(top); }
    });
  }

  // ---------- the lane ----------
  drawTiles() {
    const st = this.st, c = this.cipher(), hotSet = new Set();
    if (st.hot) for (const a of [51, 81]) for (let i = a; i < a + 12; i++) hotSet.add(i);
    this.tiles.forEach((m, i) => {
      const stamped = i < st.stamped;
      const style = !stamped ? 'plain' : hotSet.has(i) ? 'hot' : st.eve && st.hot ? 'dim' : 'gold';
      m.material.map = letterTex(stamped ? c[i] : TEXT[i], style); m.material.needsUpdate = true;
    });
    // the two tags over the repeated twelve letters
    for (const [k, a] of [51, 81].entries()) {
      const tag = this.laneTags[k];
      tag.visible = st.lane && st.hot;
      if (tag.visible) { setLabel(tag, `${a} · ${c.slice(a, a + 12)}`, '#ff7a3d', .7); tag.position.set(tileX(a + 5.5), 1.1, LANE_Z + .2); }
    }
  }

  // arcs over the lane from each group of 3 letters to where it comes back, inside the lane
  drawArcs() {
    this.arcsG.clear();
    if (!this.st.lane || !this.st.arcs) return;
    // gold: a multiple of the length the counts keep (5 for LEMON); red: a coincidence
    const all = repeats(this.cipher()), L = best(counts(all.map(r => r.d), 2, 8)).L, reps = all.filter(r => r.b + 3 <= LANE_N);
    for (const r of reps) {
      const good = r.d % L === 0;
      this.arcsG.add(arc(tileX(r.a + 1), tileX(r.b + 1), LANE_Z - .55, .045, good ? 0xffd66b : 0xff4d5e, 1.2 + r.d * .05));
    }
    // one tag per distance
    for (const d of [...new Set(reps.map(r => r.d))]) {
      const r = reps.find(x => x.d === d), tag = label(); tag.visible = true;
      setLabel(tag, d % L ? `${d}` : `${d} = ${L} × ${d / L}`, d % L ? '#ff4d5e' : '#ffd66b', .9);
      tag.position.set((tileX(r.a + 1) + tileX(r.b + 1)) / 2, 1.5 + d * .05 + .5, LANE_Z - .55); this.arcsG.add(tag);
    }
  }

  // the key wheel on tile i, tumbled by k (0..1) toward tile i + 1
  placeWheel(i, k) {
    const th = -STEP * k, px = tileX(i) + SIDE / 2, ox = -SIDE / 2, oy = PENT_IN;
    const c = Math.cos(th), s = Math.sin(th);
    this.kwheel.position.set(px + ox * c - oy * s, LANE_TOP + ox * s + oy * c, LANE_Z);
    this.kwheel.userData.spin.rotation.z = -STEP * i + th;
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
  live(tok) { return tok === this.token; }

  // ---------- the actions ----------
  // The car rolls from where it is to d (m), at `pace` m/s; each time the stone comes down, a mark in mud.
  async drive(d, pace = 6) {
    const d0 = this.st.car, marks = this.marksList;
    let next = marks.findIndex(m => m.x / 100 > this.st.printed + 1e-6);
    // every strike of the stone, mud or dry: the next one ahead of the wheel
    const C = this.st.road.C / 100;
    let strike = Math.ceil((this.stoneX(d0) - START_X) / C - 1e-6);
    sfx.send();
    const ok = await this.tween(Math.abs(d - d0) / pace, x => {
      const dd = d0 + (d - d0) * x; this.st.car = dd; this.placeCar(dd);
      const sx = this.stoneX(dd);
      // a strike on dry ground: a puff of dust and nothing left
      while (START_X + strike * C <= sx + 1e-6) {
        const x0 = START_X + strike * C;
        if (!marks.some(m => Math.abs(m.x / 100 - x0) < 1e-6)) burst(v(x0, .1, NEAR_Z), 0xd8c6a0, { count: 14, speed: 2, life: .7, up: 2.5, size: .1, gravity: 6 });
        strike++;
      }
      if (sx > this.st.printed) {
        this.st.printed = sx;
        while (next >= 0 && next < marks.length && marks[next].x / 100 <= sx) {
          const m = marks[next++]; this.drawMarks();   // a gravel mark too: the tyre presses the pebble in
          burst(v(m.x / 100, .1, NEAR_Z), 0x5a4030, { count: 18, speed: 2.5, life: .6, up: 2, size: .12, gravity: 9 }); sfx.tick();
        }
      }
    });
    if (!ok) return false;
    this.st.car = d; this.st.printed = Math.max(this.st.printed, this.stoneX(d)); this.drawMarks(); this.redraw();
    return true;
  }

  // Eve measures one gap after the other.
  async measure(from = this.st.tape, to = this.gapList.length, pause = .55) {
    for (let k = from; k < to; k++) {
      const g = this.gapList[k]; this.focus.position.set((g.from + g.to) / 200, 0, 0);
      this.st.tape = k + 1; this.drawTape(); this.redraw(); sfx.tick();
      if (!await this.wait(pause)) return false;
    }
    return true;
  }

  // The gaps no candidate explains turn red.
  async redden() {
    this.st.red = true; this.drawTape(); this.redraw(); sfx.reject();
    for (const g of this.gapList.filter(g => g.d % this.st.road.C)) ring(v((g.from + g.to) / 200, .08, NEAR_Z), 0xff4d5e, { radius: 1.6 });
    return this.wait(.6);
  }

  async grow(dur = 1.8) {
    this.st.grown = false;
    const ok = await this.tween(dur, x => this.drawBars(ease(x)));
    if (!ok) return false;
    this.st.grown = true; this.drawBars(1); this.redraw(); sfx.win();
    const { cs, win } = this.barData(), i = cs.findIndex(c => c.L === win);
    const bar = this.barsG.children.filter(o => o.isMesh)[1 + i];
    if (bar) burst(bar.position.clone().setY(bar.geometry.parameters.height + .2), 0xffd66b, { count: 50, speed: 4, size: .18 });
    return true;
  }

  // The key wheel tumbles from where it stands to tile `to`, stamping each tile it lands on.
  async roll(to, perTile = .42) {
    for (let i = this.st.kw; i < to; i++) {
      // the face down on tile i stamps it, then the wheel tumbles to i + 1
      if (this.st.stamped <= i) { this.st.stamped = i + 1; this.drawTiles(); this.redraw(); sfx.tick(); }
      if (!await this.tween(perTile, x => this.placeWheel(i, ease(x)))) return false;
      this.st.kw = i + 1;
    }
    if (this.st.stamped <= to && to < LANE_N) { this.st.stamped = to + 1; this.drawTiles(); this.redraw(); }
    return true;
  }

  async light(on = true) {
    this.st.hot = on; if (this.st.card === 'vig') this.st.card = 'repeat';   // the card shows the two pieces side by side
    this.drawTiles(); this.redraw(); sfx.arrive(); return this.wait(.5);
  }
  async showArcs() { this.st.arcs = true; this.drawArcs(); this.redraw(); sfx.tick(); return this.wait(.5); }

  // Eve finds the key letters one by one, column after column.
  async findKey(found) {
    const letters = [...(this.st.key || '?????')];
    for (let j = 0; j < found.length; j++) {
      letters[j] = found[j]; this.st.key = letters.join(''); this.st.lit = [...this.st.lit]; this.st.lit[j] = true;
      this.kwheel.userData.setLetters(letters, this.st.lit); this.redraw(); sfx.lock();
      burst(this.kwheel.position.clone().add(v(0, 1, .6)), 0xffd66b, { count: 30, speed: 3, size: .14 });
      if (!await this.wait(.7)) return false;
    }
    return true;
  }
}

// A dent in the mud, where the stone (or a pebble) pressed: a dark hollow with a raised pale rim.
function dent(x) {
  const g = new THREE.Group();
  const hole = new THREE.Mesh(new THREE.CircleGeometry(.11, 12), new THREE.MeshStandardMaterial({ color: 0x1f140c, roughness: .9, polygonOffset: true, polygonOffsetFactor: -6 }));
  hole.rotation.x = -Math.PI / 2; hole.position.set(x, .05, NEAR_Z); g.add(hole);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(.13, .025, 6, 16), new THREE.MeshStandardMaterial({ color: 0x8a7258, roughness: .9 }));
  rim.rotation.x = -Math.PI / 2; rim.position.set(x, .055, NEAR_Z); g.add(rim);
  return g;
}
// the tyre's tread across a puddle, from x0 to x1: a band of dark ribs
function tread(x0, x1) {
  const g = new THREE.Group(), m = new THREE.MeshStandardMaterial({ color: 0x2c2018, roughness: .9, polygonOffset: true, polygonOffsetFactor: -5 });
  for (let x = x0 + .04; x < x1; x += .09) {
    const rib = new THREE.Mesh(new THREE.PlaneGeometry(.035, .19), m); rib.rotation.x = -Math.PI / 2; rib.position.set(x, .048, NEAR_Z); g.add(rib);
  }
  return g;
}
// an arc above the ground from x0 to x1 at depth z, a tube, of height h
function arc(x0, x1, z, r, color, h) {
  const pts = [];
  for (let i = 0; i <= 24; i++) { const u = i / 24; pts.push(v(x0 + (x1 - x0) * u, .08 + Math.sin(Math.PI * u) * h, z)); }
  const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 32, r, 6), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: .45, roughness: .4 }));
  m.castShadow = true;
  return m;
}
