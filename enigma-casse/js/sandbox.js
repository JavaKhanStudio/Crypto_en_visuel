// The sandbox: an intercepted cipher and a crib (Eve's by default, both editable). Slide the crib
// along the cipher with ◀ ▶ or all the way: each place is marked ruled out (a letter under itself)
// or possible on the slate. On a possible place, run the bombe: its menu through the 17 576
// positions of rotor order I II III, rings at A; the clerk checks the stops, and a stop that holds
// can be tried on Eve's machine, which types the cipher with the rotors, position and cables found.
import { t, onLang } from './i18n.js';
import { A, clashes, places, menu, menuLetters, lamps } from './enigma.js';
import { CIPHER, CRIB, ROT } from './story.js';
import { sfx } from '../../ficelle/lib/sound.js';

const $ = id => document.getElementById(id);
const clean = s => s.toUpperCase().replace(/[^A-Z]/g, '');
// the letter of a menu with the most links: the bombe tests its cable
export const testLetter = links => menuLetters(links).map(c => [c, links.filter(l => l.a === c || l.b === c).length]).sort((x, y) => y[1] - x[1])[0][0];

export function initSandbox(ctx) {
  const { stage, rig, instant } = ctx;
  let cipher = CIPHER, crib = CRIB, k = 0, marks = {}, busy = false, active = false, bad = false, result = null;
  const maxK = () => cipher.length - crib.length;

  function slateState(extra = {}) {
    return { pads: { e: cipher }, slate: { cipher, crib, k, marks }, panel: 'crib', ...extra };
  }
  function show() { stage.speed = instant ? 50 : 1; stage.apply(slateState()); }

  function render() {
    const ok = !bad;
    $('sb-cipher').disabled = $('sb-crib').disabled = busy;
    if (document.activeElement !== $('sb-cipher')) $('sb-cipher').value = cipher;
    if (document.activeElement !== $('sb-crib')) $('sb-crib').value = crib;
    $('sb-bad').classList.toggle('hidden', ok);
    $('sb-place').textContent = ok ? t('sb.placeOf', { k: k + 1, n: maxK() + 1 }) : '—';
    $('sb-left').disabled = busy || !ok || k === 0; $('sb-right').disabled = busy || !ok || k >= maxK();
    $('sb-slide').disabled = busy || !ok;
    const hit = ok ? clashes(cipher, crib, k) : [];
    $('sb-bombe').disabled = busy || !ok || hit.length > 0;
    $('sb-try').classList.toggle('hidden', !result?.good);
    $('sb-try').disabled = busy;
    $('sb-reset').disabled = busy;
    const rows = [];
    if (ok) rows.push(hit.length ? t('sb.out', { k: k + 1, c: crib[hit[0]], n: k + hit[0] + 1 }) : t('sb.ok', { k: k + 1 }));
    if (ok && !hit.length) rows.push(`<span class="hint">${t('sb.note', { x: testLetter(menu(cipher, crib, k)) })}</span>`);
    if (busy && result === 'running') rows.push(`<b>${t('sb.running')}</b>`);
    if (result?.stops) rows.push(result.stops.length ? t('sb.stops', { n: result.stops.length, g: result.holds.length }) : t('sb.none'));
    if (result?.read) rows.push(`<b>${t('sb.reads', { m: result.read })}</b>`);
    $('sb-status').innerHTML = rows.join('<br>');
  }

  async function go(to, all = false) {
    if (busy || bad) return;
    busy = true; result = null; render();
    try {
      stage.apply(slateState()); rig.fly('slate');
      const ok = await stage.slide(to, all ? .45 : .2);
      if (ok) { k = to; marks = stage.st.slate.marks; }
    } finally { busy = false; render(); }
  }

  async function runBombe() {
    if (busy || bad || clashes(cipher, crib, k).length) return;
    const links = menu(cipher, crib, k), test = testLetter(links);
    busy = true; result = 'running'; render();
    try {
      stage.apply(slateState({ menu: { links, n: null, rotors: ROT, pos: 'AAA' }, panel: 'bombe',
        run: { menus: [{ k, links }], test, rotors: ROT, m: 0, n: 0, done: [], stops: [], checks: null } }));
      await rig.fly('bombe');
      if (!await stage.runBombe(instant ? .1 : 3)) return;
      if (!await stage.checkStops(.3)) return;
      const checks = stage.st.run.checks, holds = checks.filter(c => !c.bad.length);
      result = { stops: checks, holds, good: holds[0] || null };
      holds.length ? sfx.win() : sfx.reject();
    } finally { busy = false; if (result === 'running') result = null; render(); }
  }

  // the first stop that holds, on Eve's machine: rotors I II III, rings A, its position and cables
  async function tryIt() {
    const g = result?.good; if (busy || !g) return;
    const plugs = g.pairs.filter(p => p[0] !== p[1]).join(' '), set = { rotors: ROT, rings: 'AAA', plugs };
    busy = true; render();
    try {
      stage.apply({ ...slateState(), apart: { e: 1 }, set: { e: set }, pos: { e: g.pos }, card: 'e', panel: null, pads: { e: '' } });
      await rig.fly('eveDrum');
      if (!await stage.typeQuick('e', cipher, instant ? .01 : .3)) return;
      result = { ...result, read: lamps(cipher, g.pos, set) };
      stage.st.msg = { plain: cipher, cipher: result.read, from: g.pos }; stage.relabel();
    } finally { busy = false; render(); }
  }

  function edit() {
    if (busy) return;
    const c = clean($('sb-cipher').value), w = clean($('sb-crib').value);
    bad = !c || !w || w.length > c.length;
    if (!bad) { cipher = c; crib = w; k = Math.min(k, maxK()); marks = {}; result = null; show(); }
    render();
  }

  $('sb-left').onclick = () => go(k - 1);
  $('sb-right').onclick = () => go(k + 1);
  $('sb-slide').onclick = () => { k = 0; marks = {}; show(); go(maxK(), true); };
  $('sb-bombe').onclick = runBombe;
  $('sb-try').onclick = tryIt;
  $('sb-reset').onclick = () => { if (!busy) { cipher = CIPHER; crib = CRIB; k = 0; marks = {}; bad = false; result = null; sfx.click(); show(); rig.fly('slate'); render(); } };
  $('sb-cipher').addEventListener('change', edit);
  $('sb-crib').addEventListener('change', edit);
  onLang(() => { if (active) render(); });

  return {
    enter: () => { active = true; result = null; show(); rig.fly('slate'); render(); },
    leave: () => { active = false; stage.speed = instant ? 50 : 1; },
    go, runBombe, tryIt, places: () => places(cipher, crib),
    state: () => ({ cipher, crib, k, marks, busy, bad, result }),
    configure: (c, w, at = 0) => { if (!busy) { $('sb-cipher').value = c; $('sb-crib').value = w; edit(); k = at; show(); render(); } },
  };
}
