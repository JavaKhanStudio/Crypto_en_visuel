// Comic-style speech bubbles pinned to a point of the 3D scene. They follow it
// on screen every frame, type their text in, and hide when the point is behind
// the camera.
// One module for every episode (r320, was 17 <ep>/js/bubbles.js in 8 versions):
//   new Bubbles(camera, { raw, walls, colorOf })
// raw: the episode's i18n raw() (the speaker's name, this.raw('who')); walls: ids of the episode's own overlays
// to keep off, on top of WALLS; colorOf(recipe): a paint's THREE.Color, only for card() (diffie-hellman).
import * as THREE from 'three';

const layer = document.getElementById('bubbles');
const tmp = new THREE.Vector3();

// Bubbles must not hide one another, the corner card, the open panel or the top controls (r84). Each
// starts where its speaker wants it; then, a few rounds over, two bubbles that overlap push apart along
// the shorter way out, and a bubble on a wall steps off it the shorter way, all inside the screen.
// 'credit' is the series' credit logo (credit.js, r340: in the top bar's title chip); the quality button needs none,
// it sits inside #topbar. 'topbar-tab' is the phone's tab that opens the tucked bar (lib/topbar.js, r406).
const GAP = 6, WALLS = ['topbar', 'modes', 'lang', 'sound', 'card', 'story', 'sandbox', 'quiz', 'credit', 'topbar-tab'];
// The tags floating in the scene (a rotor's 'I · A', 'réflecteur B', 'entrée', r125; the slate's tiles, r147) are
// walls too: an episode sets bubbles.avoid to the list of those sprites, and each visible one walls off its box.
const right = new THREE.Vector3(), up = new THREE.Vector3(), c = new THREE.Vector3(), q = new THREE.Vector3();
function tagBoxes(camera, sprites) {
  const out = [], w = innerWidth, h = innerHeight;
  right.setFromMatrixColumn(camera.matrixWorld, 0); up.setFromMatrixColumn(camera.matrixWorld, 1);
  for (const s of sprites) {
    if (!s.visible || !s.parent || s.material.opacity < .5) continue;
    s.getWorldPosition(c);
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity, behind = false;
    for (const [i, j] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      q.copy(c).addScaledVector(right, i * s.scale.x / 2).addScaledVector(up, j * s.scale.y / 2).project(camera);
      if (q.z > 1) behind = true;
      const x = (q.x * .5 + .5) * w, y = (-q.y * .5 + .5) * h;
      x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
    }
    if (!behind) out.push({ x: x0, y: y0, w: x1 - x0, h: y1 - y0, text: s.userData.text });
  }
  return out;
}
// the walls on screen now: WALLS and the ids given, then the boxes given (vpn pins its tags off them)
export function walls(extra = [], ids = []) {
  const out = [...extra];
  for (const id of [...WALLS, ...ids]) {
    const el = document.getElementById(id);
    if (!el || el.classList.contains('hidden') || !el.offsetHeight) continue;
    const r = el.getBoundingClientRect();
    out.push({ x: r.left, y: r.top, w: r.width, h: r.height });
  }
  return out;
}
function settle(boxes, bounds, extra, ids) {
  const ws = walls(extra, ids);
  const clamp = b => { b.x = Math.min(bounds.r - b.w, Math.max(bounds.l, b.x)); b.y = Math.min(bounds.b - b.h, Math.max(bounds.t, b.y)); };
  boxes.forEach(clamp);
  for (let round = 0; round < 60; round++) {
    let moved = false;
    for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i], b = boxes[j];
      const px = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x) + GAP, py = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y) + GAP;
      if (px <= 0 || py <= 0) continue;
      moved = true;
      if (px < py) { const s = a.x + a.w / 2 <= b.x + b.w / 2 ? 1 : -1; a.x -= s * px / 2; b.x += s * px / 2; }
      else { const s = a.y + a.h / 2 <= b.y + b.h / 2 ? 1 : -1; a.y -= s * py / 2; b.y += s * py / 2; }
    }
    for (const b of boxes) for (const w of ws) {
      const left = b.x + b.w + GAP - w.x, right = w.x + w.w + GAP - b.x, up = b.y + b.h + GAP - w.y, down = w.y + w.h + GAP - b.y;
      if (left <= 0 || right <= 0 || up <= 0 || down <= 0) continue;
      moved = true;
      const m = Math.min(left, right, up, down);
      if (m === up) b.y -= up; else if (m === down) b.y += down; else if (m === left) b.x -= left; else b.x += right;
    }
    boxes.forEach(clamp);
    if (!moved) break;
  }
  // Relaxation can lock up when a wall and a bubble push a third one back and forth (phone, r84): then each
  // bubble still in the way, the highest first, takes the free spot nearest to where it is, if there is one.
  const hits = (b, o) => Math.min(b.x + b.w, o.x + o.w) - Math.max(b.x, o.x) + GAP > 1 && Math.min(b.y + b.h, o.y + o.h) - Math.max(b.y, o.y) + GAP > 1;
  const placed = [];
  for (const b of [...boxes].sort((p, q) => p.y - q.y)) {
    const blocked = s => ws.some(w => hits(s, w)) || placed.some(o => hits(s, o));
    if (blocked(b)) {
      const xs = [b.x, bounds.r - b.w];
      for (let x = bounds.l; x < bounds.r - b.w; x += 12) xs.push(x);
      let best = null, d = Infinity;
      for (let y = bounds.t; y <= bounds.b - b.h; y += 6) for (const x of xs) {
        const dd = (x - b.x) ** 2 + (y - b.y) ** 2;
        if (dd < d && !blocked({ x, y, w: b.w, h: b.h })) { best = { x, y }; d = dd; }
      }
      if (best) Object.assign(b, best);
    }
    placed.push(b);
  }
}

export class Bubbles {
  constructor(camera, { raw, walls = [], colorOf } = {}) {
    this.camera = camera; this.items = new Map(); this.avoid = () => [];
    this.raw = raw; this.walls = walls; this.colorOf = colorOf;
  }
  // the tags' boxes on screen, for the bubbles to keep off and for the tests to check
  tagBoxes() { return tagBoxes(this.camera, this.avoid()); }

  // who: 'a' | 'b' | 'e' | 'n' (or any key of the episode's this.raw('who')). anchor: Vector3, Object3D or () => Vector3.
  // side: 'up' sits above the anchor; 'left' beside it, its tail pointing right at it, when it fits.
  show(id, who, text, anchor, { lift = 0, ttl = 0, side = 'up' } = {}) {
    this.hide(id, true);
    const el = document.createElement('div');
    el.className = `bubble ${who}`;
    el.innerHTML = `<span class="who"></span><span class="txt"></span>`;
    el.querySelector('.who').textContent = this.raw('who')[who];
    layer.appendChild(el);
    const item = { el, anchor, lift, side, full: text, shown: this.instant ? text.length : 0, who };
    if (this.instant) el.querySelector('.txt').textContent = text;
    this.items.set(id, item);
    requestAnimationFrame(() => el.classList.add('show'));
    if (ttl) item.timer = setTimeout(() => this.hide(id), ttl);
    return item;
  }

  // A card of colour chips over a table, for the recap: rows of [recipe, word key], each chip
  // its paint's name in a frame of its colour, then the word (recap.pub, recap.secret...).
  card(id, who, rows, anchor) {
    const it = this.show(id, who, '', anchor, { lift: 0 });
    it.el.classList.add('card'); it.rows = rows;
    this.fillCard(it);
    return it;
  }
  fillCard(it) {
    const txt = it.el.querySelector('.txt'); txt.textContent = '';
    for (const [recipe, word] of it.rows) {
      const row = document.createElement('span'), chip = document.createElement('b'), w = document.createElement('i');
      row.className = 'row'; chip.textContent = this.raw('paint')[recipe]; chip.style.borderColor = '#' + this.colorOf(recipe).getHexString();
      w.textContent = this.raw('recap')[word]; row.append(chip, w); txt.appendChild(row);
    }
  }

  hide(id, now = false) {
    const it = this.items.get(id);
    if (!it) return;
    clearTimeout(it.timer); this.items.delete(id);
    if (now) return it.el.remove();
    it.el.classList.remove('show'); setTimeout(() => it.el.remove(), 400);
  }

  clear() { for (const id of [...this.items.keys()]) this.hide(id); }

  // Re-label after a language switch: the caller passes new texts by id.
  relabel(texts) {
    for (const [id, it] of this.items) {
      it.el.querySelector('.who').textContent = this.raw('who')[it.who];
      if (it.rows) this.fillCard(it);
      if (texts[id]) { it.full = texts[id]; it.shown = it.full.length; it.el.querySelector('.txt').textContent = it.full; }
    }
  }

  update(dt) {
    const w = innerWidth, h = innerHeight, top = Math.max(0, document.getElementById('topbar').getBoundingClientRect().bottom) + 8;   // up to the screen's edge while the bar is away (lib/topbar.js)
    const boxes = [];
    for (const it of this.items.values()) {
      if (it.shown < it.full.length) {
        it.shown = Math.min(it.full.length, it.shown + dt * 70);
        it.el.querySelector('.txt').textContent = it.full.slice(0, Math.ceil(it.shown));
      }
      const a = it.anchor;
      if (a.isObject3D) a.getWorldPosition(tmp); else if (typeof a === 'function') tmp.copy(a()); else tmp.copy(a);
      tmp.y += it.lift;
      tmp.project(this.camera);
      const behind = tmp.z > 1;
      const x = (tmp.x * .5 + .5) * w, y = (-tmp.y * .5 + .5) * h;
      const bw = it.el.offsetWidth, bh = it.el.offsetHeight;
      // no room on the left (the speaker is near the screen's edge): back above the head
      const left = it.side === 'left' && x - bw - 22 >= 8;
      it.el.classList.toggle('left', left);
      const cx = Math.min(w - bw - 8, Math.max(8, left ? x - bw - 22 : x - bw / 2));
      const cy = Math.min(h - bh - 8, Math.max(top, left ? y - bh / 2 : y - bh - 14));
      it.el.style.visibility = behind ? 'hidden' : 'visible';
      if (!behind) boxes.push({ it, ax: x, x: cx, y: cy, w: bw, h: bh });
    }
    if (boxes.length) settle(boxes, { l: 8, r: w - 8, t: top, b: h - 8 }, this.tagBoxes(), this.walls);
    for (const b of boxes) {
      b.it.el.style.transform = `translate(${b.x}px, ${b.y}px)`;
      b.it.el.style.setProperty('--tail', `${Math.min(b.w - 16, Math.max(16, b.ax - b.x))}px`);   // the tail still points at the speaker
    }
  }
}
