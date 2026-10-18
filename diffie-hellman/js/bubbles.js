// Comic-style speech bubbles pinned to a point of the 3D scene. They follow it
// on screen every frame, type their text in, and hide when the point is behind
// the camera.
import * as THREE from 'three';
import { raw } from './i18n.js';
import { colorOf } from './paint.js';

const layer = document.getElementById('bubbles');
const tmp = new THREE.Vector3();

export class Bubbles {
  constructor(camera) { this.camera = camera; this.items = new Map(); }

  // who: 'a' | 'b' | 'e' | 'n'. anchor: Vector3, Object3D or () => Vector3.
  // side: 'up' sits above the anchor; 'left' beside it, its tail pointing right at it, when it fits.
  show(id, who, text, anchor, { lift = 0, ttl = 0, side = 'up' } = {}) {
    this.hide(id, true);
    const el = document.createElement('div');
    el.className = `bubble ${who}`;
    el.innerHTML = `<span class="who"></span><span class="txt"></span>`;
    el.querySelector('.who').textContent = raw('who')[who];
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
      row.className = 'row'; chip.textContent = raw('paint')[recipe]; chip.style.borderColor = '#' + colorOf(recipe).getHexString();
      w.textContent = raw('recap')[word]; row.append(chip, w); txt.appendChild(row);
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
      it.el.querySelector('.who').textContent = raw('who')[it.who];
      if (it.rows) this.fillCard(it);
      if (texts[id]) { it.full = texts[id]; it.shown = it.full.length; it.el.querySelector('.txt').textContent = it.full; }
    }
  }

  update(dt) {
    const w = innerWidth, h = innerHeight, top = document.getElementById('topbar').getBoundingClientRect().bottom + 8;
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
      it.el.style.transform = `translate(${cx}px, ${cy}px)`;
      it.el.style.visibility = behind ? 'hidden' : 'visible';
    }
  }
}
