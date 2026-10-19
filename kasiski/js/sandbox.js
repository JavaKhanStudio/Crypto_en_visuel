// The sandbox, two experiments. The wheel: pick its turn and how many gravel marks fall on the road,
// roll, measure, count: does the step that divides the most gaps give the wheel back? The cipher:
// encrypt the same paragraph with your own key, join the groups that come back, count: does the
// length come out, and the key, column by column?
import * as THREE from 'three';
import { t, onLang } from './i18n.js';
import { TEXT, clean, vigenere, randomRoad, gaps, track, wheelCounts, best, repeats, counts, columns, metres, CANDIDATES } from './kasiski.js';
import { START_X, LANE_N } from './stage.js';
import { sfx } from './sound.js';
import { lang } from './i18n.js';

const $ = id => document.getElementById(id);
const CS = [150, 200, 250, 300], GRAVEL = [0, 2, 4, 6];

export function initSandbox(ctx) {
  const { stage, rig, instant } = ctx;
  const pick = { C: 200, gravel: 2 };
  let busy = false, result = null, typed = null;
  const key = () => clean(typed ?? 'LEMON').slice(0, 8);
  const sep = () => lang === 'en' ? '.' : ',';

  function buttons() {
    for (const [id, list, field, name] of [['sb-C', CS, 'C', x => metres(x, sep())], ['sb-gravel', GRAVEL, 'gravel', String]]) {
      const el = $(id); el.innerHTML = '';
      for (const val of list) {
        const b = document.createElement('button'); b.textContent = name(val);
        b.classList.toggle('on', pick[field] === val); b.disabled = busy;
        b.onclick = () => { if (busy) return; pick[field] = val; sfx.click(); reset(); };
        el.appendChild(b);
      }
    }
  }

  function render() {
    buttons();
    for (const id of ['sb-roll', 'sb-count', 'sb-reset', 'sb-key']) $(id).disabled = busy;
    if (typed === null) $('sb-key').value = 'LEMON';
    if (!result) { $('sb-status').textContent = busy ? '…' : key().length < 2 ? t('sb.badKey') : t('sb.ready'); return; }
    const r = result;
    $('sb-status').innerHTML = r.kind === 'wheel' ? [
      t('sb.gaps', { n: r.n }), `<b>${t('sb.best', { L: metres(r.L, sep()) })}</b>`,
      `<b>${r.L === r.C ? t('sb.right') : t('sb.wrong', { C: metres(r.C, sep()) })}</b>`,
    ].join('<br>') : [
      t('sb.dists', { n: r.n }), `<b>${t('sb.bestLen', { L: r.L })}</b>`,
      r.L === r.key.length ? `${t('sb.keyFound', { k: r.found })}<br><b>${r.found === r.key ? t('sb.keyRight') : t('sb.keyWrong')}</b>`
        : `<b>${t('sb.lenWrong', { n: r.key.length })}</b>`,
    ].join('<br>');
  }

  const road = () => randomRoad(pick.C, pick.gravel, 7 + pick.C + pick.gravel * 31);
  function reset() {
    result = null; stage.speed = instant ? 50 : 1.6;
    stage.apply({ road: road(), car: 0, card: 'trace' }); rig.fly('start'); render();
  }

  async function run(fn) {
    if (busy) return;
    busy = true; result = null; render();
    try { await fn(); } finally { busy = false; render(); }
  }

  async function roll() {
    const st = stage, rd = road();
    st.apply({ road: rd, car: 0, card: 'trace' });
    const end = rd.turns * rd.C / 100 + 2;
    rig.chase(st.car, new THREE.Vector3(-3, 4, 10));
    if (!await st.drive(end, 9)) return;
    rig.chase(st.focus, new THREE.Vector3(0, 9, 14));
    if (!await st.measure(0, st.gapList.length, .22)) return;
    if (!await st.redden()) return;
    st.st.bars = 'wheel'; st.st.card = 'count';
    await rig.fly('sbBars', 1.2);
    if (!await st.grow(1.2)) return;
    const ds = gaps(track(rd)).map(g => g.d), b = best(wheelCounts(ds, CANDIDATES));
    result = { kind: 'wheel', n: ds.length, L: b.L, C: rd.C };
    b.L === rd.C ? sfx.win() : sfx.lose();
  }

  async function count() {
    const k = key(); if (k.length < 2) return;
    const cipher = vigenere(TEXT, k), st = stage;
    st.apply({ car: null, lane: true, eve: true, cipher, stamped: LANE_N, kw: 0, card: 'ccount' });
    await rig.fly('laneAll', 1.4);
    if (!await st.showArcs()) return;
    st.st.bars = 'cipher';
    await rig.fly('sbBars', 1.2);
    if (!await st.grow(1.2)) return;
    const ds = repeats(cipher).map(r => r.d), L = best(counts(ds, 2, 8)).L;
    const found = columns(cipher, L).map(c => c.key).join('');
    result = { kind: 'cipher', n: ds.length, L, key: k, found };
    found === k ? sfx.win() : sfx.lose();
  }

  $('sb-roll').onclick = () => run(roll);
  $('sb-count').onclick = () => run(count);
  $('sb-reset').onclick = () => { if (!busy) { typed = null; reset(); } };
  $('sb-key').oninput = () => { typed = $('sb-key').value; if (!busy) render(); };
  onLang(() => { if (!busy) reset(); });

  return { enter: reset, render, result: () => result, leave: () => { stage.speed = instant ? 50 : 1; } };
}
