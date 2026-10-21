// The sandbox: write a message, pick Alice's stick (letters per turn) and the stick Eve tries
// to read it back with, and run it all: wind, write, unwind, carry to Eve, wind on her stick,
// read every line. The status gives the strip and the lines read back.
import { t, onLang } from './i18n.js';
import { clean, lines, show } from './scytale.js';
import { sfx } from '../../lib/sound.js';

const $ = id => document.getElementById(id);
const KS = [2, 3, 4, 5, 6];

export function initSandbox(ctx) {
  const { stage, rig, instant } = ctx;
  const pick = { alice: 4, reader: 3 };
  let busy = false, result = null, typed = null;

  const msg = () => clean(typed ?? ctx.message()).slice(0, 20);

  function buttons() {
    for (const who of ['alice', 'reader']) {
      const el = $('sb-' + who); el.innerHTML = '';
      for (const k of KS) {
        const b = document.createElement('button'); b.textContent = t('sb.per', { k });
        b.classList.toggle('on', pick[who] === k); b.disabled = busy;
        b.onclick = () => { if (busy) return; pick[who] = k; sfx.click(); reset(); };
        el.appendChild(b);
      }
    }
  }

  function render() {
    buttons();
    for (const id of ['sb-run', 'sb-reset', 'sb-msg']) $(id).disabled = busy;
    $('sb-turn').disabled = busy || !result;
    if (typed === null) $('sb-msg').value = ctx.message();
    if (!result) { $('sb-status').textContent = busy ? '…' : msg() ? t('sb.ready') : t('sb.empty'); return; }
    const r = result;
    $('sb-status').innerHTML = [
      `${t('sb.strip')} : <b>${r.strip}</b>`,
      `${t('sb.lines', { k: r.k })} : <b>${r.lines.join(' · ')}</b>`,
      `<b>${r.same ? t('sb.same') : t('sb.differ')}</b>`,
    ].join('<br>');
  }

  function state() {
    return { msg: msg(), k: pick.alice, sticks: { a: pick.alice, eT: pick.reader }, hide: ['eG'], strip: { on: null, at: 'a', written: 0 } };
  }

  function reset() {
    result = null; stage.speed = instant ? 50 : 1.7;
    stage.apply(state()); rig.fly('alice'); render();
  }

  async function run() {
    if (busy || !msg()) return;
    busy = true; result = null; render();
    try { await play(); } finally { busy = false; render(); }
  }

  async function play() {
    const st = stage;
    st.apply(state()); const tok = st.token, live = () => st.live(tok);
    await rig.fly('alice', 1.2);
    if (!await st.wind('a')) return;
    await rig.fly('aliceStick', 1);
    if (!await st.write()) return;
    if (!await st.unwind()) return;
    await rig.fly('road', 1.2);
    rig.chase(st.couriers[0]);
    if (!await st.carry('a', 'e')) return;
    await rig.fly('eve', 1.2);
    if (!await st.wind('eT')) return;
    await rig.fly('eveThin', 1);
    if (!await st.readAll('eT', .8) || !live()) return;
    const read = lines(st.lay.strip, pick.reader).map(show);
    result = { strip: show(st.lay.strip), k: pick.reader, lines: read, same: pick.reader === pick.alice };
    result.same ? sfx.win() : sfx.lose();
  }

  $('sb-run').onclick = run;
  $('sb-reset').onclick = () => { if (!busy) { typed = null; reset(); } };
  $('sb-turn').onclick = () => { if (!busy && result) stage.next('eT'); };
  $('sb-msg').oninput = () => { typed = $('sb-msg').value; if (!busy) reset(); };
  onLang(() => { if (!busy) reset(); });

  return { enter: reset, render, result: () => result, leave: () => { stage.speed = instant ? 50 : 1; } };
}
