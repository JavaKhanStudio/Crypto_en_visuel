// The penguin of the slide « Modes d'opération - ECB - Le pingouin », for real: a penguin drawn
// in four flat colours, one byte per pixel, read row after row as the file stores it, so a block
// is 16 pixels of a row. Encrypted with the slides' key, in ECB and in CBC (the slides' IV);
// each encrypted byte is shown as a colour, its hue and its lightness spread over the 256 values.
// In ECB a run of 16 pixels of one colour always gives the same block: the silhouette comes back
// as a pattern.
import { KEY, IV1, ecb, cbc } from './values.js';
import * as THREE from 'three';

export const W = 192, H = 224;            // 12 blocks a row, 224 rows
const PALETTE = [[0x5a, '#8fc3e8'], [0x0f, '#15171c'], [0xf0, '#f4f1ea'], [0xa6, '#f2a01e']];   // sky, black, white, orange

function draw() {
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d'), e = (cx, cy, rx, ry, col) => { x.fillStyle = col; x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); x.fill(); };
  x.fillStyle = PALETTE[0][1]; x.fillRect(0, 0, W, H);
  e(96, 140, 66, 76, PALETTE[1][1]);                               // body
  e(96, 62, 46, 44, PALETTE[1][1]);                                // head
  e(96, 150, 46, 60, PALETTE[2][1]);                               // belly
  e(78, 56, 13, 17, PALETTE[2][1]); e(114, 56, 13, 17, PALETTE[2][1]);   // eyes
  e(81, 60, 6, 8, PALETTE[1][1]); e(111, 60, 6, 8, PALETTE[1][1]);
  x.fillStyle = PALETTE[3][1]; x.beginPath(); x.moveTo(74, 80); x.quadraticCurveTo(96, 66, 118, 80); x.quadraticCurveTo(96, 100, 74, 80); x.fill();   // beak
  e(62, 214, 30, 11, PALETTE[3][1]); e(130, 214, 30, 11, PALETTE[3][1]);  // feet
  e(30, 140, 14, 46, PALETTE[1][1]); e(162, 140, 14, 46, PALETTE[1][1]);  // wings
  // each pixel to the nearest of the four colours, as one byte
  const d = x.getImageData(0, 0, W, H).data, rgb = PALETTE.map(([, h]) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)));
  const px = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) {
    let best = 0, bd = 1e9;
    rgb.forEach((c, k) => { const dd = (c[0] - d[i * 4]) ** 2 + (c[1] - d[i * 4 + 1]) ** 2 + (c[2] - d[i * 4 + 2]) ** 2; if (dd < bd) { bd = dd; best = k; } });
    px[i] = PALETTE[best][0];
  }
  return px;
}

let cache = null;
export function penguin() {
  if (cache) return cache;
  const plain = draw(), B = Array.from({ length: plain.length / 16 }, (_, i) => plain.slice(i * 16, i * 16 + 16));
  const join = list => { const o = new Uint8Array(plain.length); list.forEach((b, i) => o.set(b, i * 16)); return o; };
  const e = ecb(KEY, B), c = cbc(KEY, IV1, B).C;
  // how many distinct blocks each version has: the ECB one has as few as the image
  const distinct = list => new Set(list.map(b => b.join(','))).size;
  return cache = { plain, ecb: join(e), cbc: join(c), blocks: B.length, distinct: { plain: distinct(B), ecb: distinct(e), cbc: distinct(c) } };
}

const plainColor = Object.fromEntries(PALETTE.map(([b, h]) => [b, h]));
const encColor = x => '#' + new THREE.Color().setHSL(((x * 157) % 256) / 256, .75, .14 + .66 * ((x * 91) % 256) / 255).getHexString();
// Paint `canvas` with the image: rows above `upto` (0..1) encrypted (`which`: 'ecb' | 'cbc'),
// the rest still in clear.
export function paint(canvas, which, upto = 1) {
  const p = penguin(); canvas.width = W; canvas.height = H;
  const x = canvas.getContext('2d'), img = x.createImageData(W, H), rows = Math.round(H * upto);
  const enc = which ? p[which] : null, lut = {};
  for (let i = 0; i < W * H; i++) {
    const b = enc && i < rows * W ? enc[i] : p.plain[i];
    const h = enc && i < rows * W ? (lut['e' + b] ??= encColor(b)) : plainColor[b];
    const n = parseInt(h.slice(1), 16);
    img.data[i * 4] = n >> 16; img.data[i * 4 + 1] = (n >> 8) & 255; img.data[i * 4 + 2] = n & 255; img.data[i * 4 + 3] = 255;
  }
  x.putImageData(img, 0, 0);
}
