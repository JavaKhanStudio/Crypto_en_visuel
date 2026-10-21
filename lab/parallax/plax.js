// r195 lab: a three.js reader for Simon's parallax pages (JKS_Tools2D_ParallaxBackground, Apache-2.0).
// It reads the interchange format the library's other-engine readers read (docs/other-engines.md): the page
// as .jplax (JSON) and its libGDX .atlas + PNG. Only IMAGE layers, which is all a hand-made page like
// calm-day uses: decal, sizeRatio, flip, speed, speedXAtRest, padX, repeatOnX and the two gradients.
// Not ported (the Godot reader's 2900 lines are the reference): SEQUENCE, SHADER (WAVE/FOG), PARTICLES,
// FLOOR, LURKER, MIRROR, EMPTY hooks, cross-fades, tints, detail levels.
import * as THREE from 'three';

export const WORLD_W = 40;   // Parallax_Heart's default world width; speeds and decals are in its units

// A libGDX .atlas: both layouts (xy/size/orig/offset, and bounds/offsets from libGDX 1.9.13). Regions keep
// file order, then index order when any region has one, as libGDX does: regionPosition counts in that order.
export async function loadAtlas(url) {
  const text = await (await fetch(url)).text(), dir = url.replace(/[^/]*$/, '');
  const pages = [];
  let page = null, region = null;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trimEnd();
    if (!line.trim()) { page = region = null; continue; }
    const indented = /^\s/.test(line), [k, v] = line.trim().split(/:\s*/);
    if (!page) { page = { file: line.trim(), regions: [] }; pages.push(page); continue; }
    if (v === undefined) { region = { name: k, index: -1 }; page.regions.push(region); continue; }
    const nums = v.split(',').map(Number);
    if (!region || !indented && !['xy', 'size', 'orig', 'offset', 'bounds', 'offsets', 'index', 'rotate'].includes(k)) { page[k] = v; continue; }
    if (k === 'xy') [region.x, region.y] = nums;
    else if (k === 'size') [region.w, region.h] = nums;
    else if (k === 'bounds') [region.x, region.y, region.w, region.h] = nums;
    else if (k === 'orig') [region.ow, region.oh] = nums;
    else if (k === 'offset') [region.ox, region.oy] = nums;
    else if (k === 'offsets') [region.ox, region.oy, region.ow, region.oh] = nums;
    else if (k === 'index') region.index = nums[0];
    else if (k === 'rotate') region.rotate = v === 'true';
  }
  for (const p of pages) {
    p.image = await new Promise((ok, ko) => { const im = new Image(); im.onload = () => ok(im); im.onerror = ko; im.src = dir + p.file; });
    if (p.regions.some(r => r.index >= 0)) p.regions.sort((a, b) => (a.index < 0) - (b.index < 0) || a.index - b.index);
  }
  return { pages, find(name, position = 0) {
    const all = pages.flatMap(p => p.regions.filter(r => r.name === name).map(r => ({ ...r, page: p })));
    return all[position] ?? all[0];
  } };
}

// One region cut out of its sheet into its own texture, so it can be drawn and tiled alone.
// At most 2048 px wide: a phone's GPU may refuse a 4096+ texture, and calm's strips are 5000.
const cache = new Map();
function regionTexture(r, flipX, flipY) {
  const key = `${r.page.file}/${r.name}/${r.x},${r.y}/${flipX}${flipY}`;
  if (cache.has(key)) return cache.get(key);
  const k = Math.min(1, 2048 / r.w), c = document.createElement('canvas');
  c.width = Math.round(r.w * k); c.height = Math.round(r.h * k);
  const g = c.getContext('2d');
  g.translate(flipX ? c.width : 0, flipY ? c.height : 0); g.scale(flipX ? -1 : 1, flipY ? -1 : 1);
  g.drawImage(r.page.image, r.x, r.y, r.w, r.h, 0, 0, c.width, c.height);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  cache.set(key, t);
  return t;
}

const color = c => new THREE.Color().setRGB(c.r, c.g, c.b, THREE.SRGBColorSpace);

// The page, as layers measured in world units (WORLD_W wide, worldH high), back to front.
export async function loadPage(url, atlasDir = url.replace(/[^/]*$/, '')) {
  const page = await (await fetch(url)).json();
  const atlas = await loadAtlas(atlasDir + page.pageModel.atlasName);
  const layers = page.pageModel.pageList.map((m, i) => {
    const kind = m.kind ?? 'IMAGE';
    if (kind !== 'IMAGE') throw new Error(`layer ${i}: ${kind} is not ported to three.js yet`);
    const r = atlas.find(m.regionName, m.regionPosition);
    const sizeRatio = m.sizeRatio ?? 1, width = WORLD_W * sizeRatio;
    return {
      i, model: m, region: r, width, height: (r.oh ?? r.h) * (WORLD_W / (r.ow ?? r.w)) * sizeRatio,
      speed: m.parallaxScalingSpeedX, atRest: m.speedXAtRest ?? 0, padX: m.padX ?? 0,
      texture: regionTexture(r, m.flipX, m.flipY),
    };
  });
  return {
    layers, repeatX: page.repeatOnX, repeatY: page.repeatOnY,
    gradients: {
      top: [color(page.topHalf_top), color(page.topHalf_bottom)], topSize: page.topHalfSize,
      bottom: [color(page.bottomHalf_top), color(page.bottomHalf_bottom)], bottomSize: page.bottomHalfSize,
    },
  };
}

// ParallaxLayer.act, as a closed form: where the layer's left edge is after the heart has travelled `travel`
// world units and `seconds` have passed (its at-rest drift), in world units from the view's left edge.
export function layerX(l, travel, seconds, worldH) {
  return l.model.decal_X_Ratio * WORLD_W / 100 - travel * l.speed - seconds * l.atRest * l.speed;
}
export const layerY = (l, worldH) => l.model.decal_Y_Ratio * worldH / 100;

// The two gradients as one canvas texture for a screen-high quad (libGDX draws them opaque, the bottom over the top).
export function gradientTexture(g, h = 256) {
  const c = document.createElement('canvas'); c.width = 4; c.height = h;
  const x = c.getContext('2d');
  const band = (from, to, [a, b]) => {
    if (to <= from) return;
    const grad = x.createLinearGradient(0, from, 0, to);
    grad.addColorStop(0, '#' + a.getHexString(THREE.SRGBColorSpace)); grad.addColorStop(1, '#' + b.getHexString(THREE.SRGBColorSpace));
    x.fillStyle = grad; x.fillRect(0, from, 4, to - from);
  };
  band(0, h * (1 - g.topSize), g.top);
  band(h * g.bottomSize, h, g.bottom);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
