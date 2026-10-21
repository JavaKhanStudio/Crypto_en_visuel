// Comic-style speech bubbles pinned to a point of the 3D scene. They follow it
// on screen every frame, type their text in, and hide when the point is behind
// the camera.
import * as THREE from 'three';
import { raw } from './i18n.js';

const layer = document.getElementById('bubbles');
const tmp = new THREE.Vector3();

// Bubbles must not hide one another, the corner card, the open panel or the top controls (r84). Each
// starts where its speaker wants it; then, a few rounds over, two bubbles that overlap push apart along
// the shorter way out, and a bubble on a wall steps off it the shorter way, all inside the screen.
const GAP = 6, WALLS = ['topbar', 'modes', 'lang', 'sound', 'quality', 'credit', 'card', 'story', 'sandbox', 'quiz'];
function walls() {
  const out = [];
  for (const id of WALLS) {
    const el = document.getElementById(id);
    if (!el || el.classList.contains('hidden') || !el.offsetHeight) continue;
    const r = el.getBoundingClientRect();
    out.push({ x: r.left, y: r.top, w: r.width, h: r.height });
  }
  return out;
}
function settle(boxes, bounds) {
  const ws = walls();
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
  constructor(camera) { this.camera = camera; this.items = new Map(); }

  // who: 'a' | 'b' | 'e' | 'n'. anchor: Vector3, Object3D or () => Vector3.
  show(id, who, text, anchor, { lift = 0, ttl = 0 } = {}) {
    this.hide(id, true);
    const el = document.createElement('div');
    el.className = `bubble ${who}`;
    el.innerHTML = `<span class="who"></span><span class="txt"></span>`;
    el.querySelector('.who').textContent = raw('who')[who];
    layer.appendChild(el);
    const item = { el, anchor, lift, full: text, shown: this.instant ? text.length : 0, who };
    if (this.instant) el.querySelector('.txt').textContent = text;
    this.items.set(id, item);
    requestAnimationFrame(() => el.classList.add('show'));
    if (ttl) item.timer = setTimeout(() => this.hide(id), ttl);
    return item;
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
      it.el.querySelector('.who').textContent = raw('who')[it.who];
      if (texts[id]) { it.full = texts[id]; it.shown = it.full.length; it.el.querySelector('.txt').textContent = it.full; }
    }
  }

  update(dt) {
    const w = innerWidth, h = innerHeight, top = document.getElementById('topbar').getBoundingClientRect().bottom + 8;
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
      const cx = Math.min(w - bw - 8, Math.max(8, x - bw / 2)), cy = Math.min(h - bh - 8, Math.max(top, y - bh - 14));
      it.el.style.visibility = behind ? 'hidden' : 'visible';
      if (!behind) boxes.push({ it, ax: x, x: cx, y: cy, w: bw, h: bh });
    }
    settle(boxes, { l: 8, r: w - 8, t: top, b: h - 8 });
    for (const b of boxes) {
      b.it.el.style.transform = `translate(${b.x}px, ${b.y}px)`;
      b.it.el.style.setProperty('--tail', `${Math.min(b.w - 16, Math.max(16, b.ax - b.x))}px`);   // the tail still points at the speaker
    }
  }
}
