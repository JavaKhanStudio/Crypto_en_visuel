// The actors and the props on the village, and everything they do: paint pots appear on
// the tables, one pot is poured into another and the paint mixes, couriers carry pots
// along the road, Eve copies what passes or keeps it, a chest carries a message, a seal
// is checked. apply(state) puts everything where a story step says, instantly; the async
// actions animate from there.
import * as THREE from 'three';
import { PLACES, TABLE_TOP, TABLE_SIZE, SHELF_H } from './world.js';
import { pot, chest, certificate, person, COLORS, POT_H, POT_R } from './props.js';
import { mix, colorOf } from './paint.js';
import { burst, ring, icon } from '../../lib/fx.js';
import { sfx } from '../../lib/sound.js';

const v = (x, y, z) => new THREE.Vector3(x, y, z);
const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const ON_HEAD = 3.15;

export class Stage {
  constructor(world, tickers) {
    this.world = world; this.scene = world.scene; this.tickers = tickers; this.speed = 1; this.token = 0;
    const S = this.scene;
    this.people = {};
    for (const k of ['a', 'e', 'b']) {
      const p = person(k); p.position.copy(PLACES[k].person); p.rotation.y = .6; S.add(p); this.people[k] = p;
    }
    this.couriers = [person('n'), person('n')]; S.add(...this.couriers);
    this.pots = new Map();      // id -> pot, made on first use
    this.chest = chest(); this.chest.scale.setScalar(.55); S.add(this.chest);
    this.cert = certificate(); S.add(this.cert);
    // the falling ribbon of paint while pouring: a unit cylinder hanging down from its origin
    const sg = new THREE.CylinderGeometry(1, 1, 1, 10, 1, true); sg.translate(0, -.5, 0);
    this.stream = new THREE.Mesh(sg, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .3 })); this.stream.visible = false; S.add(this.stream);
    this.labelText = () => '';  // set by main: (pot) => the words of its tag, in the current language
    this.idle = (dt, t) => {
      for (const [k, p] of Object.entries(this.people)) p.position.y = PLACES[k].person.y + Math.abs(Math.sin(t * 1.3 + k.charCodeAt(0))) * .05;
    };
    tickers.add(this.idle);
  }

  // ---------- where things rest ----------
  // six places on a table: 0 1 2 along the front edge, 3 4 5 behind them, up on the shelf
  slotSpot(k, i) {
    const [w] = TABLE_SIZE[k], dx = (w - 1.3) / 2;
    return PLACES[k].table.clone().add(v((i % 3 - 1) * dx, TABLE_TOP + (i < 3 ? 0 : SHELF_H), i < 3 ? .5 : -.6));
  }
  certSpot() { return this.slotSpot('a', 5).add(v(.45, 0, 0)); }   // back right of Alice's table, clear of the pots
  head(k) { return PLACES[k].person.clone().add(v(0, 4.3, 0)); }
  pot(id) {
    if (!this.pots.has(id)) {
      const p = pot(); p.userData.id = id;
      p.userData.label = label(); p.add(p.userData.label);
      p.userData.stem = stem(); p.add(p.userData.stem);
      this.scene.add(p); this.pots.set(id, p);
    }
    return this.pots.get(id);
  }

  // ---------- the state of a story step ----------
  // pots: { id: [place, slot, recipe, { secret, seal, level }] } · labels: tags over the pots
  // numbers: the tags give the slide's numbers too · chest: null | [place, slot, recipe, lid]
  // cert: Bob's certificate stands on Alice's table
  apply(st) {
    this.token++;
    this.st = { pots: {}, labels: true, numbers: false, chest: null, cert: false, ...st };
    st = this.st;
    for (const p of this.pots.values()) p.visible = false;
    for (const [id, [k, slot, recipe, o = {}]] of Object.entries(st.pots)) {
      const p = this.pot(id);
      p.visible = true; p.position.copy(this.slotSpot(k, slot)); p.rotation.set(0, 0, 0); p.scale.setScalar(1);
      Object.assign(p.userData, { at: k, slot, secret: !!o.secret });
      p.userData.setPaint(recipe, o.level ?? .8); p.userData.setSeal(o.seal);
    }
    this.chest.visible = !!st.chest;
    if (st.chest) {
      const [k, slot, recipe, lid = 0] = st.chest;
      this.chest.position.copy(this.slotSpot(k, slot)); this.chest.rotation.set(0, 0, 0);
      this.chest.userData.setBand(recipe); this.chest.userData.setLid(lid); this.chest.userData.at = k;
    }
    this.cert.visible = st.cert; this.cert.position.copy(this.certSpot()); this.cert.rotation.y = -.3;
    this.stream.visible = false;
    for (const c of this.couriers) c.visible = false;
    for (const p of Object.values(this.people)) p.userData.arms.rotation.x = 0;
    this.relabel();
  }
  // the state as the actions have left it, written back so Back/Next and the tests can read it
  save(p) { if (this.st.pots[p.userData.id]) this.st.pots[p.userData.id] = [p.userData.at, p.userData.slot, p.userData.recipe, { secret: p.userData.secret, seal: p.userData.seal, level: p.userData.level }]; }

  relabel() {
    for (const p of this.pots.values()) {
      const l = p.userData.label, text = this.st.labels && p.visible && p.userData.recipe ? this.labelText(p) : '';
      l.visible = !!text;
      if (text && text !== l.userData.text) setLabel(l, text, '#' + colorOf(p.userData.recipe).getHexString());
    }
    this.layoutLabels();
  }
  // A tag sits just over its pot. The middle pot's goes up a step only when it would run into a
  // neighbour's tag on the same row; the back row's goes up to clear the front row's. A stem in the
  // tag's colour pins it to its pot's rim: without it, a lifted tag reads as a pot behind's (r55).
  layoutLabels() {
    const seen = [...this.pots.values()].filter(p => p.visible && p.userData.label.visible);
    for (const p of seen) {
      const i = p.userData.slot, l = p.userData.label;
      const hits = i % 3 === 1 && seen.some(q => q !== p && q.userData.at === p.userData.at && (q.userData.slot >= 3) === (i >= 3)
        && Math.abs(q.position.x - p.position.x) < (q.userData.label.scale.x + l.scale.x) / 2 + .1);
      l.position.y = POT_H + .45 + (hits ? .5 : 0) + (i >= 3 ? .55 : 0);
      const st = p.userData.stem, len = l.position.y - .17 - POT_H;
      st.scale.y = len; st.position.y = POT_H + len / 2; st.material.color.copy(colorOf(p.userData.recipe));
    }
    for (const p of this.pots.values()) p.userData.stem.visible = p.userData.label.visible;
  }
  setNumbers(on) { this.st.numbers = on; this.relabel(); }

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
  wait(s) { return this.tween(s, () => {}); }
  live(tok) { return tok === this.token; }
  arc(obj, to, { dur = 1, height = 2 } = {}) {
    const from = obj.position.clone();
    return this.tween(dur, k => { const e = ease(k); obj.position.lerpVectors(from, to, e); obj.position.y += Math.sin(Math.PI * e) * height; });
  }
  async arm(k, up = 1, dur = .3) { const a = this.people[k].userData.arms; const r0 = a.rotation.x; await this.tween(dur, t => a.rotation.x = r0 + (-up - r0) * ease(t)); }

  // ---------- the actions ----------
  // Pots appear on the tables, each with a splash of its colour.
  async appear(ids) {
    const tok = this.token;
    await Promise.all(ids.map((id, i) => {
      const p = this.pot(id); p.scale.setScalar(.01);
      return this.wait(i * .25).then(ok => {
        if (!ok) return;
        sfx.click(); burst(p.position.clone().add(v(0, .8, 0)), colorOf(p.userData.recipe).getHex(), { count: 30, speed: 3, life: .7, size: .25, up: 2, gravity: 6 });
        return this.tween(.35, k => p.scale.setScalar(Math.max(.01, Math.sin(k * Math.PI / 2) * (1 + .25 * Math.sin(k * Math.PI)))));
      });
    }));
    if (this.live(tok)) for (const id of ids) icon(this.pot(id).position.clone().add(v(0, 2.4, 0)), this.pot(id).userData.secret ? '🤫' : '👁', '#ffffff', { size: 1.1, rise: 1, life: 1.6 });
  }

  // Lift `src`, tip it over `dst`, and pour: dst's paint becomes the mix of the two recipes.
  async pour(srcId, dstId, who) {
    const tok = this.token, src = this.pot(srcId), dst = this.pot(dstId);
    const home = src.position.clone(), dir = Math.sign(home.x - dst.position.x) || 1;
    const before = dst.userData.recipe, after = mix(before, src.userData.recipe);
    const c0 = before ? colorOf(before).clone() : colorOf(src.userData.recipe).clone(), c1 = colorOf(after), cs = colorOf(src.userData.recipe);
    const l0 = dst.userData.level, l1 = Math.min(.85, l0 + (before ? .3 : .4));
    if (who) this.arm(who, .9);
    const over = dst.position.clone().add(v(dir * (POT_R * 2.3), POT_H + 1.2, 0));
    if (!await this.arc(src, over, { dur: .6 * (src.userData.at === dst.userData.at ? 1 : 1.4), height: .6 })) return;
    if (!await this.tween(.35, k => src.rotation.z = dir * 1.9 * ease(k))) return;
    // the ribbon of paint, from the low lip down to the paint in dst
    const lip = () => src.localToWorld(v(-dir * POT_R, POT_H, 0));
    this.stream.material.color.copy(cs); this.stream.visible = true;
    sfx.pour();
    const ok = await this.tween(1.1, k => {
      const a = lip(), surf = dst.position.y + .04 + (POT_H - .1) * (l0 + (l1 - l0) * k);
      const w = .07 * Math.sin(Math.min(1, k * 1.25) * Math.PI) + .005;
      this.stream.position.copy(a); this.stream.scale.set(w, Math.max(.01, a.y - surf), w);
      const m = Math.min(1, Math.max(0, (k - .15) / .7));
      dst.userData.showColor(c0.clone().lerp(c1, m)); dst.userData.showLevel(l0 + (l1 - l0) * k);
    });
    this.stream.visible = false;
    if (!ok) return;
    dst.userData.setPaint(after, l1); src.userData.setPaint(src.userData.recipe, Math.max(.35, src.userData.level - .12));
    this.save(dst); this.save(src); this.relabel();
    burst(dst.position.clone().add(v(0, POT_H, 0)), c1.getHex(), { count: 26, speed: 2, life: .6, size: .2, up: 1.5, gravity: 5 });
    if (!await this.tween(.3, k => src.rotation.z = dir * 1.9 * (1 - ease(k)))) return;
    await this.arc(src, home, { dur: .55, height: .4 });
    if (this.live(tok) && who) await this.arm(who, 0);
  }

  // A courier carries `obj` (a pot, or the chest) on his head from one table to another along the
  // road. stop: the table where it lands (default: to). peek(): called halfway, under Eve's tower.
  async carry(obj, from, to, { courier = 0, slot = 1, peek } = {}) {
    const tok = this.token, path = this.world.road.path, c = this.couriers[courier];
    const tOf = { a: 0, e: .5, b: 1 }, t0 = tOf[from], t1 = tOf[to];
    c.visible = true;
    const at = t => path.getPointAt(t).setY(0);
    c.position.copy(at(t0)).add(v(0, 0, courier ? -.9 : .9));
    const dir = Math.sign(t1 - t0); c.userData.dir = v(dir, 0, 0);
    c.rotation.y = dir > 0 ? Math.PI / 2 : -Math.PI / 2;
    const onHead = () => c.position.clone().add(v(0, ON_HEAD, 0));
    if (!await this.arc(obj, onHead(), { dur: .7, height: 1.2 })) return false;
    sfx.send();
    const lane = v(0, 0, courier ? -.9 : .9);
    const leg = async (ta, tb) => {
      const dur = 3.2 * Math.abs(tb - ta) / .5;
      return this.tween(dur, k => {
        const t = ta + (tb - ta) * k, tan = path.getTangentAt(t);
        c.position.copy(at(t)).add(lane); c.position.y = Math.abs(Math.sin(k * dur * 9)) * .18;
        c.rotation.y = Math.atan2(tan.x * dir, tan.z * dir);
        obj.position.copy(onHead()); obj.rotation.y = 0;
      });
    };
    if (peek && to !== 'e' && from !== 'e') {
      if (!await leg(t0, .5)) return false;
      c.position.y = 0; obj.position.copy(onHead());
      await peek();
      if (!this.live(tok)) return false;
      if (!await leg(.5, t1)) return false;
    } else if (!await leg(t0, t1)) return false;
    c.rotation.y = Math.atan2(PLACES[to].table.x - c.position.x, PLACES[to].table.z - c.position.z);
    const spot = this.slotSpot(to, slot);
    if (!await this.arc(obj, spot, { dur: .8, height: 1.2 })) return false;
    obj.userData.at = to; obj.userData.slot = slot;
    if (obj !== this.chest) this.layoutLabels();
    if (obj === this.chest) this.st.chest = [to, slot, obj.userData.band, 0];
    else this.save(obj);
    if (to === 'e') { sfx.capture(); icon(obj.position.clone().add(v(0, 2.4, 0)), '✋', '#ff4d5e', { size: 1.1, rise: 1.4 }); }
    else { sfx.arrive(); ring(spot.clone().setY(0), COLORS[to], { radius: 3 }); }
    await this.wait(.4);
    if (this.live(tok)) c.visible = false;
    return this.live(tok);
  }

  // Under her tower, Eve looks at the pot going past and pours herself a copy of it.
  async copy(srcId, id, slot) {
    const src = this.pot(srcId), p = this.pot(id);
    Object.assign(p.userData, { at: 'e', slot, secret: false });
    p.visible = true; p.position.copy(this.slotSpot('e', slot)); p.rotation.set(0, 0, 0); p.scale.setScalar(.01);
    p.userData.setPaint(src.userData.recipe, .6); p.userData.setSeal(null);
    this.st.pots[id] = ['e', slot, src.userData.recipe, { level: .6 }];
    icon(src.position.clone().add(v(0, 2, 0)), '👁', '#ff4d5e', { size: .9, rise: 1.2, life: 1.4 });
    sfx.click(); this.relabel();
    burst(p.position.clone().add(v(0, .8, 0)), colorOf(src.userData.recipe).getHex(), { count: 24, speed: 2.5, life: .6, size: .2, up: 2, gravity: 6 });
    await this.tween(.5, k => p.scale.setScalar(Math.max(.01, ease(k))));
  }

  // A new empty pot, ready to pour into.
  async empty(id, k, slot) {
    const p = this.pot(id);
    Object.assign(p.userData, { at: k, slot, secret: false });
    p.visible = true; p.position.copy(this.slotSpot(k, slot)); p.rotation.set(0, 0, 0);
    p.userData.setPaint('', 0); p.userData.setSeal(null);
    this.st.pots[id] = [k, slot, '', {}];
    this.relabel();
    await this.tween(.3, e => p.scale.setScalar(Math.max(.01, ease(e))));
  }

  // Someone checks a pot's seal against Bob's certificate: a gold ✔, or the pot shakes and a red ✖.
  async check(id, who) {
    const p = this.pot(id), ok = p.userData.seal === 'bob';
    this.arm(who, .7);
    if (!await this.arc(this.cert, this.cert.position.clone().add(v(.3, .5, .4)), { dur: .5, height: .3 })) return ok;
    if (ok) { sfx.unlock(); ring(p.position.clone().setY(0), 0x5fe39a, { radius: 2.5 }); icon(p.position.clone().add(v(0, 2.2, 0)), '✔', '#5fe39a', { size: 1.3, rise: 1.5 }); }
    else {
      sfx.reject();
      await this.tween(.8, t => { p.rotation.z = Math.sin(t * 40) * .25 * (1 - t); });
      icon(p.position.clone().add(v(0, 2.2, 0)), '✖', '#ff4d5e', { size: 1.3, rise: 1.5 });
    }
    await this.arc(this.cert, this.certSpot(), { dur: .5, height: .3 });
    await this.arm(who, 0);
    return ok;
  }

  // The chest is opened by whoever holds its colour: the lid lifts, the letter rises.
  async openChest(who) {
    this.arm(who, 1);
    sfx.unlock();
    if (!await this.tween(.8, t => this.chest.userData.setLid(ease(t)))) return;
    burst(this.chest.position.clone().add(v(0, .9, 0)), 0xffe08a, { count: 50, speed: 3, life: 1, size: .22, up: 3, gravity: 5 });
    await this.wait(.6);
    await this.arm(who, 0);
  }
  // Eve reads, changes the letter, and closes the chest again with the other colour.
  async tamper(recipe) {
    icon(this.chest.position.clone().add(v(0, 2.4, 0)), '✎', '#ff4d5e', { size: 1.6, rise: 1.2 });
    if (!await this.wait(1.2)) return;
    sfx.lock();
    if (!await this.tween(.6, t => this.chest.userData.setLid(1 - ease(t)))) return;
    this.chest.userData.setBand(recipe);
    burst(this.chest.position.clone().add(v(0, .6, 0)), colorOf(recipe).getHex(), { count: 40, speed: 3, life: .8, size: .22, up: 2, gravity: 5 });
    this.st.chest = [this.chest.userData.at, 1, recipe, 0];
    await this.wait(.4);
  }
}

// A floating tag over a pot (« ROUGE (secret) », « ORANGE · A = 8 »): a sprite with its text drawn on a canvas.
function label() {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthTest: false }));
  s.renderOrder = 20; s.visible = false; s.userData.text = '';
  return s;
}
function stem() {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, 1, 6), new THREE.MeshBasicMaterial());
  m.visible = false;
  return m;
}
function setLabel(s, text, color) {
  const c = document.createElement('canvas'), x = c.getContext('2d'), font = '700 40px system-ui, sans-serif';
  x.font = font; const w = Math.ceil(x.measureText(text).width) + 48;
  c.width = w; c.height = 72;
  x.font = font; x.fillStyle = 'rgba(16,18,28,.86)'; x.strokeStyle = color; x.lineWidth = 5;
  x.beginPath(); x.roundRect(3, 3, w - 6, 66, 33); x.fill(); x.stroke();
  x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, w / 2, 38);
  s.material.map?.dispose(); s.material.map = new THREE.CanvasTexture(c); s.material.map.colorSpace = THREE.SRGBColorSpace; s.material.needsUpdate = true;
  s.scale.set(w / 72 * .36, .36, 1); s.userData.text = text;
}
