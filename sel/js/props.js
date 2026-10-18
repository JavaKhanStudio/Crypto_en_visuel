// The objects of the story, built from primitives: the cards that fly (a password, a salt, the
// two joined, a fingerprint), Alice's and Bob's terminals, the salt shaker, the hash machine,
// the site's base (a server cabinet with its table on the front), Eve's desk with her book of
// precomputed fingerprints, her copy of the stolen base, and her rig with its counter.
// One unit is 10 cm: a person is 1.70 m, a desk 90 cm high.
import * as THREE from 'three';

export const COLORS = { a: 0x4da3ff, b: 0xffc24d, e: 0xff3347 };
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: .6, flatShading: true, ...o });
const dark = mat(0x15110c, { roughness: 1 });
const box = (w, h, d, m, x = 0, y = 0, z = 0) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = true; b.receiveShadow = true; return b; };
export const DESK_Y = 9;      // the top of a desk

// A canvas texture on a plane: draw(ctx, w, h) paints it, redraw() repaints.
function canvasPlane(w, h, px = 64, opts = {}) {
  const c = document.createElement('canvas'); c.width = Math.round(w * px); c.height = Math.round(h * px);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, transparent: !!opts.transparent }));
  m.userData = { canvas: c, ctx: c.getContext('2d'), tex, paint(f) { f(this.ctx, c.width, c.height); tex.needsUpdate = true; } };
  return m;
}
const mono = '"Courier New", Courier, monospace';

// ---------- a flying card ----------
// kind: 'pw' a password (cream paper), 'salt' a salt (white, blue ink), 'join' the two glued
// (cream, the salt part in blue), 'hash' a fingerprint (dark, gold hex), 'try' Eve's guess.
// The card is as wide as its text.
export const CARD_H = 3.2;
export function card() {
  const g = new THREE.Group();
  const body = box(1, CARD_H, .35, mat(0xefe4c8, { roughness: .9 })); g.add(body);
  const face = canvasPlane(1, CARD_H, 96); face.position.z = .19; g.add(face);
  g.userData = { body, face, key: '' };
  g.userData.paint = (c) => {
    const key = [c.kind, c.text, c.salt, c.mark].join('|');
    if (key === g.userData.key) return; g.userData.key = key;
    const full = c.text + (c.salt || ''), w = Math.max(5, full.length * 1.15 + 2);
    body.scale.x = w; face.scale.x = w;
    const cv = face.userData.canvas; cv.width = Math.round(w * 96); cv.height = Math.round(CARD_H * 96);
    const bg = { pw: '#efe4c8', salt: '#f4f7fb', join: '#efe4c8', hash: '#191b26', try: '#2a1418' }[c.kind];
    body.material.color.set(bg);
    face.userData.paint((x, W, H) => {
      x.fillStyle = bg; x.fillRect(0, 0, W, H);
      x.strokeStyle = c.mark === 'same' || c.mark === 'bad' ? '#ff4d5e' : c.mark === 'ok' ? '#5fe39a' : c.kind === 'hash' ? '#ffd84d' : 'rgba(60,40,20,.35)';
      x.lineWidth = c.mark ? 18 : 8; x.strokeRect(6, 6, W - 12, H - 12);
      x.font = `700 ${H * .5}px ${mono}`; x.textBaseline = 'middle';
      const tw = x.measureText(full).width; let at = (W - tw) / 2;
      const ink = { pw: '#20170c', salt: '#1f5fb0', join: '#20170c', hash: '#ffd84d', try: '#ffb3bb' }[c.kind];
      x.fillStyle = ink; x.fillText(c.text, at, H * .54); at += x.measureText(c.text).width;
      if (c.salt) { x.fillStyle = '#1f5fb0'; x.fillText(c.salt, at, H * .54); }
    });
  };
  return g;
}

// ---------- a desk with a terminal: where Alice and Bob sign up and log in ----------
export function terminal(color) {
  const g = new THREE.Group(), wood = mat(0x5b4030, { roughness: .9 }), steel = mat(0x2c3038, { metalness: .5, roughness: .5 });
  g.add(box(14, 1, 8, wood, 0, DESK_Y - .5, 0));
  for (const [x, z] of [[-6.3, -3.3], [6.3, -3.3], [-6.3, 3.3], [6.3, 3.3]]) g.add(box(.8, DESK_Y - 1, .8, steel, x, (DESK_Y - 1) / 2, z));
  g.add(box(1.4, 3, 1.4, steel, 0, DESK_Y + 1.5, -2.2));
  const monitor = box(10, 6.5, .8, steel, 0, DESK_Y + 5.6, -2.4); g.add(monitor);
  const screen = canvasPlane(9, 5.6, 48); screen.position.set(0, DESK_Y + 5.6, -1.95); g.add(screen);
  const kb = box(7, .4, 2.4, mat(0x1d2028), 0, DESK_Y + .2, 1.6); g.add(kb);
  const light = new THREE.PointLight(color, 30, 25, 1.6); light.position.set(0, DESK_Y + 6, 2); g.add(light);
  g.userData = { screen, light };
  // the screen: the site's login box, with what is being typed (dots) and a line under it
  g.userData.show = (title, dots, line, tint = '#9fd0ff') => screen.userData.paint((x, W, H) => {
    x.fillStyle = '#0d1424'; x.fillRect(0, 0, W, H);
    x.fillStyle = '#16233d'; x.fillRect(W * .08, H * .1, W * .84, H * .8);
    x.fillStyle = tint; x.font = `700 ${H * .13}px system-ui, sans-serif`; x.textAlign = 'center'; x.fillText(title, W / 2, H * .3);
    x.fillStyle = '#0b1020'; x.fillRect(W * .16, H * .42, W * .68, H * .18);
    x.fillStyle = '#e8eefc'; x.font = `700 ${H * .14}px ${mono}`; x.fillText(dots, W / 2, H * .56);
    x.fillStyle = '#c9d4ea'; x.font = `600 ${H * .11}px system-ui, sans-serif`; x.fillText(line, W / 2, H * .78);
  });
  g.userData.show('', '', '');
  return g;
}

// ---------- the salt shaker on its stand ----------
export function shaker() {
  const g = new THREE.Group(), glass = new THREE.MeshPhysicalMaterial({ color: 0xdfe8f0, roughness: .1, transmission: .6, thickness: 1, transparent: true, opacity: .55 });
  const stand = mat(0x3a3f4a, { metalness: .5 });
  g.add(box(7, DESK_Y, 7, stand, 0, DESK_Y / 2, 0));
  const jar = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.6, 7, 20), glass); jar.position.y = DESK_Y + 3.5; g.add(jar);
  const salt = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.5, 4.2, 20), mat(0xf6f6f2, { roughness: 1 })); salt.position.y = DESK_Y + 2.2; g.add(salt);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 2.2, 2.2, 20), mat(0xb8c0cc, { metalness: .8, roughness: .3 })); cap.position.y = DESK_Y + 8.1; g.add(cap);
  for (let i = 0; i < 7; i++) { const h = new THREE.Mesh(new THREE.CircleGeometry(.22, 8), dark); h.rotation.x = -Math.PI / 2; const a = i * Math.PI * 2 / 6; h.position.set(i ? Math.cos(a) * 1 : 0, DESK_Y + 9.22, i ? Math.sin(a) * 1 : 0); g.add(h); }
  const sign = textPlane('SEL', '#1a2a40', '#e8f0fa', 5, 1.8); sign.position.set(0, DESK_Y - 2.4, 3.55); g.add(sign);
  g.userData = { jar, cap, sign };
  return g;
}

// ---------- the hash machine: a housing on a stand, a card goes in, a fingerprint comes out ----------
// Its sign says MD5 or bcrypt; for bcrypt, a gear turns while it works.
export function machine() {
  const g = new THREE.Group(), steel = mat(0x5a6170, { metalness: .6, roughness: .35 }), trim = mat(0x8a3fc2, { metalness: .4, roughness: .4 });
  g.add(box(16, DESK_Y, 9, mat(0x2c3038, { metalness: .5 }), 0, DESK_Y / 2, 0));
  const W = 12, H = 10;
  g.add(box(W, H, 1, steel, 0, DESK_Y + H / 2, -4));                 // open in front: the card is seen inside
  for (const x of [-1, 1]) g.add(box(1.2, H, 1.2, steel, x * (W / 2), DESK_Y + H / 2, 3.8));
  g.add(box(W + 2, 3.4, 9, steel, 0, DESK_Y + H + 1.7, 0));
  const glowM = new THREE.MeshStandardMaterial({ color: 0, emissive: 0xc070ff, emissiveIntensity: .3, transparent: true, opacity: .35, side: THREE.DoubleSide });
  const mouth = new THREE.Mesh(new THREE.PlaneGeometry(W - 1.2, H - .6), glowM); mouth.position.set(0, DESK_Y + H / 2, -3.45); g.add(mouth);
  g.add(box(W + 2.1, .8, 9.1, trim, 0, DESK_Y + H + .2, 0));
  const sign = textPlane('MD5', '#ffffff', '#3d1a5a', 9, 2.8); sign.position.set(0, DESK_Y + H + 1.8, 4.56); g.add(sign);
  const gear = new THREE.Group(); gear.position.set(0, DESK_Y + H + 5.6, 0);
  const gm = mat(0xc9a24a, { metalness: .8, roughness: .3 });
  gear.add(new THREE.Mesh(new THREE.TorusGeometry(2.2, .55, 8, 24), gm));
  for (let i = 0; i < 10; i++) { const t = box(.9, 1.1, .9, gm); const a = i / 10 * Math.PI * 2; t.position.set(Math.cos(a) * 2.9, Math.sin(a) * 2.9, 0); t.rotation.z = a; gear.add(t); }
  gear.visible = false; g.add(gear);
  const light = new THREE.PointLight(0xc070ff, 0, 30, 1.6); light.position.set(0, DESK_Y + H / 2, 3); g.add(light);
  g.userData = { sign, gear, light, glowM, H };
  g.userData.setHot = k => { glowM.emissiveIntensity = .3 + 3 * k; glowM.opacity = .35 + .45 * k; light.intensity = 60 * k; };
  g.userData.setKind = k => { if (sign.userData.kind === k) return; sign.userData.kind = k; sign.userData.redraw(k === 'bcrypt' ? 'bcrypt' : 'MD5', '#ffffff', k === 'bcrypt' ? '#1a4a3a' : '#3d1a5a'); gear.visible = k === 'bcrypt'; };
  return g;
}

// ---------- the base: a server cabinet, its table on the front ----------
export const BASE_W = 36, BASE_H = 24;
export function cabinet() {
  const g = new THREE.Group(), steel = mat(0x22262e, { metalness: .5, roughness: .45 });
  g.add(box(BASE_W + 4, BASE_H + 22, 10, steel, 0, (BASE_H + 22) / 2, 0));
  // blinking lights in the rack slots, under the board
  const leds = [];
  for (let r = 0; r < 4; r++) for (let k = 0; k < 10; k++) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(.6, .6), new THREE.MeshBasicMaterial({ color: k % 3 ? 0x3cff8a : 0x4da3ff, toneMapped: false }));
    m.position.set(-BASE_W / 2 + 3 + k * 3.4, 4 + r * 3, 5.02); g.add(m); leds.push(m);
    if (k === 0) g.add(box(BASE_W + 2, .3, .3, mat(0x3a3f4a), 0, 2.6 + r * 3, 5.05));
  }
  const board = canvasPlane(BASE_W, BASE_H, 40); board.position.set(0, 18 + BASE_H / 2, 5.05); g.add(board);
  g.userData = { board, leds };
  return g;
}

// The base's table, drawn: a title, the columns, a row per user. rows: [{ u, salt, hash, mark, found }]
// cols: the column names; found (Eve's copy only) adds what her book says.
export function drawTable(m, title, cols, rows, opts = {}) {
  m.userData.paint((x, W, H) => {
    x.fillStyle = opts.bg || '#0b1220'; x.fillRect(0, 0, W, H);
    x.strokeStyle = opts.edge || '#2c4a7a'; x.lineWidth = W * .006; x.strokeRect(W * .01, H * .015, W * .98, H * .97);
    x.textBaseline = 'middle'; x.textAlign = 'left';
    x.fillStyle = opts.ink || '#9fd0ff'; x.font = `700 ${H * .085}px system-ui, sans-serif`; x.fillText(title, W * .04, H * .1);
    const xs = opts.xs || [.04, .31, .52], rowH = H * .15, y0 = H * .27;
    // each cell shrinks its font to fit before the next column (the last one before Eve's verdict)
    const end = [xs[1], xs[2], rows.some(r => r.found !== undefined) ? .7 : .97].map(e => W * (e - .015));
    const fit = (text, i, size, family = mono) => { x.font = `700 ${size}px ${family}`; const k = Math.min(1, (end[i] - W * xs[i]) / x.measureText(text).width); x.font = `700 ${size * k}px ${family}`; x.fillText(text, W * xs[i], y0 + fit.dy); };
    x.fillStyle = '#7f8aa3'; fit.dy = 0;
    cols.forEach((c, i) => fit(c, i, H * .055, 'system-ui, sans-serif'));
    x.fillStyle = '#2c3a55'; x.fillRect(W * .03, y0 + H * .045, W * .94, H * .006);
    rows.forEach((r, i) => {
      const y = y0 + rowH * (i + 1);
      if (r.mark) { x.fillStyle = r.mark === 'ok' ? 'rgba(95,227,154,.18)' : r.mark === 'bad' ? 'rgba(255,77,94,.16)' : 'rgba(255,77,94,.24)'; x.fillRect(W * .03, y - rowH * .42, W * .94, rowH * .84); }
      fit.dy = y - y0;
      x.fillStyle = '#e8eefc'; fit(r.u, 0, H * .075);
      x.fillStyle = '#7fb6ff'; fit(r.salt || '—', 1, H * .075);
      // a bcrypt cell ($2b$12$dKaaqY…2lfRkm) loses its salt here: the salt has its own column
      const h = r.hash.startsWith('$2b$') ? r.hash.slice(0, 7) + '…' + r.hash.split('…')[1] : r.hash;
      x.fillStyle = '#ffd84d'; fit(h, 2, H * .075);
      if (r.found !== undefined) { x.textAlign = 'right'; x.font = `700 ${H * .06}px ${mono}`; x.fillStyle = r.found ? '#5fe39a' : '#ff8f9a'; x.fillText(r.found ? r.found + ' ✔' : '✖', W * .96, y); x.textAlign = 'left'; }
    });
    if (opts.foot) { x.font = `600 ${H * .055}px system-ui, sans-serif`; x.fillStyle = '#7f8aa3'; x.fillText(opts.foot, W * .04, H * .93); }
  });
}

// ---------- Eve's desk: the book open on it, her copy of the base on a stand ----------
export function eveDesk() {
  const g = new THREE.Group(), wood = mat(0x3b2a30, { roughness: .8 }), steel = mat(0x2c3038, { metalness: .5 });
  g.add(box(26, 1, 10, wood, 0, DESK_Y - .5, 0));
  for (const [x, z] of [[-12, -4], [12, -4], [-12, 4], [12, 4]]) g.add(box(.8, DESK_Y - 1, .8, steel, x, (DESK_Y - 1) / 2, z));
  // the book: two pages, tilted towards the viewer, a red leather cover under them
  const book = new THREE.Group(); book.position.set(-6, DESK_Y + 3, .5); book.rotation.x = -.95;   // propped up on a wedge
  book.add(box(13.4, 9.4, .5, mat(0x6e1420, { roughness: .7 }), 0, 0, -.3));
  const page = canvasPlane(12.6, 8.8, 64); page.position.z = .02; book.add(page);
  g.add(book);
  for (const x of [-11, -1]) g.add(box(.6, 5.4, .6, mat(0x4a3428, { roughness: .9 }), x, DESK_Y + 2.7, -3.9));   // the stand's posts
  // the copy: a sheet on a little easel
  const easel = new THREE.Group(); easel.position.set(7.5, DESK_Y, -1.5); easel.rotation.x = -.25;
  easel.add(box(11.4, 8.4, .4, mat(0x1d2028), 0, 4.6, -.25));
  const sheet = canvasPlane(10.8, 7.8, 64); sheet.position.set(0, 4.6, .0); easel.add(sheet);
  g.add(easel);
  const lamp = new THREE.PointLight(0xffb070, 40, 30, 1.6); lamp.position.set(0, DESK_Y + 10, 4); g.add(lamp);
  g.userData = { page, sheet, book, easel };
  return g;
}

// The book: Eve's precomputed fingerprints, word -> MD5. hi: the line found (green), miss: a red ✖.
export function drawBook(m, title, list, hi = -1, miss = false) {
  m.userData.paint((x, W, H) => {
    x.fillStyle = '#efe4c8'; x.fillRect(0, 0, W, H);
    x.fillStyle = 'rgba(80,50,20,.18)'; x.fillRect(W / 2 - 3, 0, 6, H);
    x.fillStyle = '#6e1420'; x.font = `700 ${H * .075}px Georgia, serif`; x.textBaseline = 'middle'; x.textAlign = 'center';
    x.fillText(title, W / 2, H * .08);
    const half = Math.ceil(list.length / 2), lh = H * .82 / half;
    list.forEach(([w, h], i) => {
      const col = i < half ? 0 : 1, y = H * .2 + (i % half) * lh, x0 = col ? W * .53 : W * .03;
      if (i === hi) { x.fillStyle = 'rgba(60,200,120,.35)'; x.fillRect(x0 - 4, y - lh * .45, W * .45, lh * .9); }
      x.textAlign = 'left'; x.fillStyle = '#20170c'; x.font = `700 ${H * .056}px ${mono}`; x.fillText(w, x0 + 4, y);
      x.textAlign = 'right'; x.fillStyle = '#7a4a10'; x.fillText(h.slice(0, 8), x0 + W * .44, y);
    });
    if (miss) { x.strokeStyle = 'rgba(220,40,60,.85)'; x.lineWidth = W * .012; x.beginPath(); x.moveTo(W * .1, H * .15); x.lineTo(W * .9, H * .95); x.moveTo(W * .9, H * .15); x.lineTo(W * .1, H * .95); x.stroke(); }
  });
}

// ---------- Eve's rig: a box of graphics cards, a counter on the wall above it ----------
export function rig() {
  const g = new THREE.Group(), steel = mat(0x1b1e26, { metalness: .6, roughness: .4 });
  g.add(box(14, 12, 9, steel, 0, 6, 0));
  const fans = [];
  for (const [x, y] of [[-3.5, 8.5], [3.5, 8.5], [-3.5, 3.5], [3.5, 3.5]]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(2.1, .25, 6, 20), mat(0x3a3f4a, { metalness: .7 })); ring.position.set(x, y, 4.55); g.add(ring);
    const fan = new THREE.Group(); fan.position.set(x, y, 4.6);
    for (let k = 0; k < 5; k++) { const b = box(.5, 1.8, .1, new THREE.MeshBasicMaterial({ color: 0xff3347, toneMapped: false })); b.position.set(Math.cos(k * 1.256) * .9, Math.sin(k * 1.256) * .9, 0); b.rotation.z = k * 1.256 + .5; fan.add(b); }
    g.add(fan); fans.push(fan);
  }
  const screen = canvasPlane(30, 12, 40); screen.position.set(0, 30, -3); g.add(screen);
  g.add(box(31.5, 13.5, .8, mat(0x23262e, { metalness: .4 }), 0, 30, -3.5));
  const glow = new THREE.PointLight(0xff3347, 0, 30, 1.6); glow.position.set(0, 9, 7); g.add(glow);
  g.userData = { fans, screen, glow };
  return g;
}

// The counter: what Eve's rig does per second, and what that means for one user.
export function drawCounter(m, lines) {
  m.userData.paint((x, W, H) => {
    x.fillStyle = '#07090f'; x.fillRect(0, 0, W, H);
    x.textBaseline = 'middle'; x.textAlign = 'left';
    if (!lines) { x.fillStyle = '#2a2f3a'; x.font = `700 ${H * .16}px ${mono}`; x.fillText('— — —', W * .05, H * .45); return; }
    x.fillStyle = '#ff8f9a'; x.font = `600 ${H * .1}px system-ui, sans-serif`; x.fillText(lines.head, W * .04, H * .14);
    x.fillStyle = lines.slow ? '#5fe39a' : '#ff4d5e'; x.font = `700 ${H * .26}px ${mono}`; x.fillText(lines.rate, W * .04, H * .43);
    x.fillStyle = '#c9d4ea'; x.font = `600 ${H * .1}px system-ui, sans-serif`; x.fillText(lines.unit, W * .04, H * .66);
    x.fillStyle = '#ffd84d'; x.font = `700 ${H * .12}px system-ui, sans-serif`;
    const k = Math.min(1, W * .92 / x.measureText(lines.all).width);       // shrink the line to fit the screen
    x.font = `700 ${H * .12 * k}px system-ui, sans-serif`; x.fillText(lines.all, W * .04, H * .86);
  });
}

// ---------- a stopwatch floating by a terminal: how long one fingerprint took ----------
export function stopwatch() {
  const g = new THREE.Group();
  const rim = new THREE.Mesh(new THREE.TorusGeometry(2.6, .35, 8, 28), mat(0xc9ced8, { metalness: .8, roughness: .3 })); g.add(rim);
  const knob = box(.9, 1, .9, mat(0xc9ced8, { metalness: .8 }), 0, 3.3, 0); g.add(knob);
  const face = canvasPlane(4.8, 4.8, 64, { transparent: true }); face.position.z = .05; g.add(face);
  g.userData = { face };
  g.userData.show = (s, label) => face.userData.paint((x, W, H) => {
    x.clearRect(0, 0, W, H); x.fillStyle = '#f4f6fa'; x.beginPath(); x.arc(W / 2, H / 2, W * .48, 0, Math.PI * 2); x.fill();
    x.strokeStyle = '#2a7a4a'; x.lineWidth = W * .05; x.beginPath(); x.arc(W / 2, H / 2, W * .4, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, s), false); x.stroke();
    x.fillStyle = '#1a1d24'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.font = `700 ${H * .25}px ${mono}`; x.fillText(label, W / 2, H * .52);
  });
  return g;
}

// A flat sign with text on it.
export function textPlane(text, color, bg, w, h, round = false) {
  const c = document.createElement('canvas'), k = 128; c.width = Math.round(w / h * k); c.height = k;
  const x = c.getContext('2d');
  x.fillStyle = bg; if (round) { x.beginPath(); x.arc(c.width / 2, k / 2, k / 2 - 2, 0, Math.PI * 2); x.fill(); } else x.fillRect(0, 0, c.width, k);
  x.fillStyle = color; x.font = `700 ${k * .7}px system-ui, sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, c.width / 2, k * .55);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: round, toneMapped: false }));
  m.userData.redraw = (t, col = color, b = bg) => { x.clearRect(0, 0, c.width, k); x.fillStyle = b; if (round) { x.beginPath(); x.arc(c.width / 2, k / 2, k / 2 - 2, 0, Math.PI * 2); x.fill(); } else x.fillRect(0, 0, c.width, k); x.fillStyle = col; x.fillText(t, c.width / 2, k * .55); tex.needsUpdate = true; };
  return m;
}

// ---------- the characters ----------
export function person(kind) {
  const outer = new THREE.Group(), g = new THREE.Group(); outer.add(g); g.scale.setScalar(5.3);
  const c = COLORS[kind];
  const cloth = mat({ a: 0x2a5ea8, b: 0x6b4a2b, e: 0x7a1424 }[kind]), skin = mat(0xf0c8a0);
  const robe = new THREE.Mesh(new THREE.CylinderGeometry(.45, .85, 2.1, 10), cloth); robe.position.y = 1.05; robe.castShadow = true; g.add(robe);
  const head = new THREE.Mesh(new THREE.SphereGeometry(.42, 16, 12), skin); head.position.y = 2.55; head.castShadow = true; g.add(head);
  for (const x of [-.14, .14]) { const eye = new THREE.Mesh(new THREE.SphereGeometry(.05, 8, 6), dark); eye.position.set(x, 2.6, .38); g.add(eye); }
  const arms = new THREE.Group(); arms.position.y = 1.8; g.add(arms);
  for (const s of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(.13, .8, 4, 8), cloth);
    arm.position.set(s * .55, -.3, .15); arm.rotation.z = s * .35; arm.rotation.x = -.5; arms.add(arm);
  }
  if (kind === 'a') {          // Alice: blue scarf and a bun
    const hair = mat(0x6b3d1f);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(.45, 16, 10, 0, Math.PI * 2, 0, Math.PI * .55), hair); cap.position.y = 2.6; cap.rotation.x = -.35; g.add(cap);
    const bun = new THREE.Mesh(new THREE.SphereGeometry(.2, 10, 8), hair); bun.position.set(0, 2.95, -.3); g.add(bun);
    const scarf = new THREE.Mesh(new THREE.TorusGeometry(.4, .1, 8, 16), mat(c)); scarf.rotation.x = Math.PI / 2; scarf.position.y = 2.12; g.add(scarf);
  } else if (kind === 'b') {   // Bob: flat cap, a leather apron
    const capM = mat(0x3d2c1c);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(.46, .46, .16, 16), capM); cap.position.y = 2.88; g.add(cap);
    const brim = new THREE.Mesh(new THREE.BoxGeometry(.5, .05, .35), capM); brim.position.set(0, 2.82, .4); g.add(brim);
    const belt = new THREE.Mesh(new THREE.TorusGeometry(.62, .06, 6, 20), mat(c, { metalness: .5 })); belt.rotation.x = Math.PI / 2; belt.position.y = 1.55; g.add(belt);
  } else {                     // Eve: a deep red hood
    const hood = new THREE.Mesh(new THREE.ConeGeometry(.62, 1.3, 12, 1, true), mat(0x9e1b2e, { side: THREE.DoubleSide })); hood.position.y = 2.85; g.add(hood);
    const mask = new THREE.Mesh(new THREE.TorusGeometry(.4, .06, 6, 16, Math.PI), dark); mask.position.set(0, 2.62, .05); g.add(mask);
  }
  outer.userData.head = head; outer.userData.arms = arms;
  return outer;
}
