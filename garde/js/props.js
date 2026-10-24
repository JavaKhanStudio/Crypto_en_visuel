// The objects of the story, built from primitives: the badges that travel (a message and its
// HMAC), the guard's booth with its sign, the board where he compares mac with recu letter by
// letter, the gate to Bob's office, Bob's ledger, Eve's stopwatch and her chart of answer times.
// One unit is 10 cm: a person is 1.70 m, a desk 90 cm high.
import * as THREE from 'three';

const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: .6, flatShading: true, ...o });
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

// ---------- a badge: the message, and the HMAC that comes with it ----------
// who: 'a' (Alice's, blue) or 'e' (Eve's, red). mark: 'ok' or 'bad' once the guard has answered.
export const BADGE_W = 13, BADGE_H = 5.4;
export function badge() {
  const g = new THREE.Group();
  const body = box(BADGE_W, BADGE_H, .35, mat(0xf4efe2, { roughness: .9 })); g.add(body);
  const face = canvasPlane(BADGE_W, BADGE_H, 80); face.position.z = .19; g.add(face);
  g.userData = { body, face, key: '' };
  g.userData.paint = (c, L) => {
    const key = [c.who, c.msg, c.recu, c.mark, L.badge].join('|');
    if (key === g.userData.key) return; g.userData.key = key;
    face.userData.paint((x, W, H) => {
      x.fillStyle = '#f4efe2'; x.fillRect(0, 0, W, H);
      x.fillStyle = c.who === 'a' ? '#2a5ea8' : '#9e1b2e'; x.fillRect(0, 0, W, H * .2);
      x.fillStyle = '#ffffff'; x.font = `700 ${H * .13}px system-ui, sans-serif`; x.textBaseline = 'middle'; x.textAlign = 'left';
      x.fillText(L.badge, W * .04, H * .1);
      x.fillStyle = '#20170c'; x.font = `700 ${H * .15}px system-ui, sans-serif`;
      const fit = (s, size, max) => { x.font = `700 ${size}px ${mono}`; const k = Math.min(1, max / x.measureText(s).width); x.font = `700 ${size * k}px ${mono}`; };
      fit(c.msg, H * .15, W * .92); x.fillText(c.msg, W * .04, H * .38);
      x.fillStyle = '#7a6a50'; x.font = `600 ${H * .11}px system-ui, sans-serif`; x.fillText('HMAC', W * .04, H * .6);
      fit(c.recu.slice(0, 16) + '…', H * .2, W * .92); x.fillStyle = '#7a4a10'; x.fillText(c.recu.slice(0, 16) + '…', W * .04, H * .8);
      if (c.mark) { x.strokeStyle = c.mark === 'ok' ? '#2fbf6a' : '#e0283c'; x.lineWidth = H * .07; x.strokeRect(H * .04, H * .04, W - H * .08, H - H * .08); }
    });
  };
  return g;
}

// ---------- the guard's booth: a counter, two posts, a sign that says how he compares, a lamp ----------
export function booth() {
  const g = new THREE.Group(), wood = mat(0x4a3424, { roughness: .9 }), steel = mat(0x2c3038, { metalness: .5, roughness: .5 });
  g.add(box(22, DESK_Y, 6, wood, 0, DESK_Y / 2, 0));
  g.add(box(23, .8, 7, mat(0x6b4a30), 0, DESK_Y + .4, 0));
  for (const x of [-11, 11]) g.add(box(1.2, 26, 1.2, steel, x, 13, 2.6));
  g.add(box(24, 2.4, 1.6, steel, 0, 27, 2.6));
  const sign = textPlane('if mac == recu:', '#ffe7a8', '#1b1410', 22, 2.2); sign.position.set(0, 27, 3.45); g.add(sign);
  // the slot where a badge is laid, and the lamp: green if the guard lets it through, red if not
  g.add(box(14, .3, 4, mat(0x1b1d24), 0, DESK_Y + .95, 1.2));
  const bulbM = new THREE.MeshStandardMaterial({ color: 0x222222, emissive: 0x000000, emissiveIntensity: 2.5 });
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(1.4, 16, 12), bulbM); bulb.position.set(0, 30.2, 2.6); g.add(bulb);
  const light = new THREE.PointLight(0xffffff, 0, 40, 1.6); light.position.set(0, 29, 6); g.add(light);
  g.userData = { sign, bulb, light };
  g.userData.setSign = text => { if (sign.userData.text === text) return; sign.userData.text = text; sign.userData.redraw(text); };
  g.userData.setLamp = v => {
    const col = v === 'ok' ? 0x3cff8a : v === 'bad' ? 0xff3347 : 0x000000;
    bulbM.emissive.set(col); light.color.set(col || 0xffffff); light.intensity = v ? 90 : 0;
  };
  return g;
}

// ---------- the board on the wall behind the guard: mac (what he computed) over recu (the badge) ----------
// 64 hex letters in two blocks of 32. A letter of mac shows only once he has looked at it: green
// if it matches the badge's, red if not. cursor: the column he is on.
export const BOARD_W = 80, BOARD_H = 25;
export function board() {
  const m = canvasPlane(BOARD_W, BOARD_H, 36);
  const g = new THREE.Group();
  g.add(box(BOARD_W + 2, BOARD_H + 2, 1, mat(0x1a1d24, { metalness: .4 }), 0, 0, -.6));
  g.add(m); g.userData = { face: m };
  return g;
}
export function drawBoard(g, L, b) {
  g.userData.face.userData.paint((x, W, H) => {
    x.fillStyle = '#0a0f1a'; x.fillRect(0, 0, W, H);
    x.textBaseline = 'middle'; x.textAlign = 'left';
    x.fillStyle = '#9fd0ff'; x.font = `700 ${H * .075}px system-ui, sans-serif`; x.fillText(L.title, W * .02, H * .07);
    x.textAlign = 'right'; x.fillStyle = '#ffd84d'; x.font = `700 ${H * .065}px system-ui, sans-serif`;
    x.fillText(b.n ? L.looked.replace('{n}', b.n) : '', W * .98, H * .07);
    const left = W * .1, cw = (W * .885) / 32, th = H * .17;
    for (let blk = 0; blk < 2; blk++) {
      const y0 = H * (.24 + blk * .43);
      x.textAlign = 'left'; x.font = `700 ${H * .06}px ${mono}`;
      x.fillStyle = '#c9b8ff'; x.fillText('mac', W * .015, y0);
      x.fillStyle = '#ffb070'; x.fillText('recu', W * .015, y0 + th);
      for (let k = 0; k < 32; k++) {
        const i = blk * 32 + k, cx = left + k * cw;
        const seen = i < b.n, same = b.mac[i] === (b.recu || '')[i];
        x.fillStyle = !seen ? '#1c2232' : same ? '#1d6b40' : '#8a1a28'; x.fillRect(cx + 2, y0 - th * .45, cw - 4, th * .9);
        x.fillStyle = '#2a2016'; x.fillRect(cx + 2, y0 + th * .55, cw - 4, th * .9);
        x.textAlign = 'center'; x.font = `700 ${th * .62}px ${mono}`;
        x.fillStyle = seen ? '#ffffff' : '#4a5470'; x.fillText(seen ? b.mac[i] : '?', cx + cw / 2, y0);
        x.fillStyle = b.recu ? '#ffd8a8' : '#4a3a2a'; x.fillText(b.recu ? b.recu[i] : '·', cx + cw / 2, y0 + th);
        if (i === b.cursor) { x.strokeStyle = '#ffd84d'; x.lineWidth = cw * .12; x.strokeRect(cx + 1, y0 - th * .5, cw - 2, th * 2); }
      }
    }
  });
}

// ---------- the gate to Bob's office: two posts and a barred leaf on a hinge ----------
export function gate() {
  const g = new THREE.Group(), gold = mat(0xb8913a, { metalness: .8, roughness: .3 }), steel = mat(0x2c3038, { metalness: .5 });
  for (const z of [-1, 17]) g.add(box(2, 24, 2, steel, 0, 12, z));
  g.add(box(2.4, 2, 20, steel, 0, 25, 8));
  const leaf = new THREE.Group(); leaf.position.set(0, 0, 0); g.add(leaf);       // hinged on the back post
  for (let z = 1.5; z <= 15.5; z += 2) leaf.add(box(.5, 19, .5, gold, 0, 11, z));
  for (const y of [2.5, 11, 19.5]) leaf.add(box(.6, .6, 15, gold, 0, y, 8.5));
  g.userData = { leaf, setOpen: k => leaf.rotation.y = -k * Math.PI * .55 };
  return g;
}

// ---------- Bob's desk: his ledger of the orders the guard let through ----------
export function bobDesk() {
  const g = new THREE.Group(), wood = mat(0x5b4030, { roughness: .9 }), steel = mat(0x2c3038, { metalness: .5 });
  g.add(box(18, 1, 9, wood, 0, DESK_Y - .5, 0));
  for (const [x, z] of [[-8, -3.8], [8, -3.8], [-8, 3.8], [8, 3.8]]) g.add(box(.8, DESK_Y - 1, .8, steel, x, (DESK_Y - 1) / 2, z));
  const stand = new THREE.Group(); stand.position.set(0, DESK_Y, -2.5); stand.rotation.x = -.2; g.add(stand);
  stand.add(box(17, 9.6, .5, mat(0x1d2028), 0, 5, -.3));
  const ledger = canvasPlane(16.2, 8.8, 56); ledger.position.set(0, 5, .0); stand.add(ledger);
  const lamp = new THREE.PointLight(0xffd08a, 35, 30, 1.6); lamp.position.set(0, DESK_Y + 12, 4); g.add(lamp);
  g.userData = { ledger };
  return g;
}
export function drawLedger(g, title, rows) {
  g.userData.ledger.userData.paint((x, W, H) => {
    x.fillStyle = '#efe4c8'; x.fillRect(0, 0, W, H);
    x.fillStyle = '#6b4a10'; x.font = `700 ${H * .11}px Georgia, serif`; x.textBaseline = 'middle'; x.textAlign = 'left'; x.fillText(title, W * .05, H * .12);
    x.fillStyle = 'rgba(80,50,20,.3)'; x.fillRect(W * .05, H * .21, W * .9, 3);
    rows.forEach((r, i) => {
      const y = H * (.36 + i * .2);
      x.fillStyle = r.who === 'e' ? '#b0182c' : '#20170c'; x.font = `700 ${H * .095}px ${mono}`;
      const k = Math.min(1, W * .82 / x.measureText(r.msg).width); x.font = `700 ${H * .095 * k}px ${mono}`;
      x.fillText(r.msg, W * .05, y);
      x.fillStyle = '#2fbf6a'; x.font = `700 ${H * .1}px system-ui`; x.textAlign = 'right'; x.fillText('✔', W * .96, y); x.textAlign = 'left';
    });
  });
}

// ---------- Eve's chart, on a stand: how long the guard took to answer each badge ----------
export function chart() {
  const g = new THREE.Group(), steel = mat(0x2c3038, { metalness: .5 });
  for (const x of [-10, 10]) g.add(box(.8, 22, .8, steel, x, 11, -1));
  g.add(box(25, 15, .6, mat(0x1d1418), 0, 23, -.5));
  const face = canvasPlane(24, 14, 48); face.position.set(0, 23, -.15); g.add(face);
  g.userData = { face };
  return g;
}
// c: { title, sub, bars: [{ c, t, hi }], max, unit } — one bar per letter tried, the slowest gold
export function drawChart(g, c) {
  g.userData.face.userData.paint((x, W, H) => {
    x.fillStyle = '#120c10'; x.fillRect(0, 0, W, H);
    x.textBaseline = 'middle'; x.textAlign = 'left';
    x.fillStyle = '#ff8f9a'; x.font = `700 ${H * .075}px system-ui, sans-serif`; x.fillText(c.title, W * .03, H * .07);
    x.fillStyle = '#ffd84d'; x.font = `700 ${H * .07}px ${mono}`;
    const kk = Math.min(1, W * .94 / x.measureText(c.sub).width); x.font = `700 ${H * .07 * kk}px ${mono}`; x.fillText(c.sub, W * .03, H * .16);
    const base = H * .86, top = H * .3, bw = W * .94 / 16;
    x.fillStyle = '#3a2a30'; x.fillRect(W * .03, base, W * .94, 2);
    const max = c.max || Math.max(1, ...c.bars.map(b => b.t));
    for (let i = 0; i < 16; i++) {
      const b = c.bars[i], cx = W * .03 + i * bw;
      x.textAlign = 'center'; x.fillStyle = '#c9d4ea'; x.font = `700 ${H * .065}px ${mono}`; x.fillText('0123456789abcdef'[i], cx + bw / 2, H * .93);
      if (!b) continue;
      const h = (base - top) * b.t / max;
      x.fillStyle = b.hi ? '#ffd84d' : '#ff4d5e'; x.fillRect(cx + bw * .1, base - h, bw * .8, h);
      // the value, turned on its side along the bar: sixteen values written across would run together.
      // Inside the bar's top when it is tall enough, else just above it.
      const v = c.fmt(b.t), fs = bw * .58; x.font = `700 ${fs}px ${mono}`;
      const len = x.measureText(v).width, inside = h > len + fs * .8;
      x.save(); x.translate(cx + bw / 2, inside ? base - h + fs * .4 : base - h - fs * .4); x.rotate(-Math.PI / 2);
      x.textAlign = inside ? 'right' : 'left'; x.fillStyle = inside ? '#120c10' : b.hi ? '#ffd84d' : '#e8b0b8';
      x.fillText(v, 0, 0); x.restore();
    }
  });
}

// ---------- Eve's stopwatch, floating by her: how long the guard took to answer ----------
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
  x.fillStyle = color; x.font = `700 ${k * .7}px system-ui, sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, c.width / 2, k * .55, c.width * .94);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: round, toneMapped: false }));
  m.userData.redraw = (t, col = color, b = bg) => { x.clearRect(0, 0, c.width, k); x.fillStyle = b; if (round) { x.beginPath(); x.arc(c.width / 2, k / 2, k / 2 - 2, 0, Math.PI * 2); x.fill(); } else x.fillRect(0, 0, c.width, k); x.fillStyle = col; x.fillText(t, c.width / 2, k * .55, c.width * .94); tex.needsUpdate = true; };
  return m;
}
