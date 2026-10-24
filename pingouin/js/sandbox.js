// The sandbox: a message of one's own (up to 4 blocks), ECB or CBC (the slides' IV or a fresh
// one), then the sending to Bob: Eve may flip the bit of one's choice, Alice may seal with an
// HMAC. The status says, block by block, what Bob reads: intact, changed, or unreadable.
import { t, onLang } from './i18n.js';
import * as A from './values.js';
import { SLOT } from './world.js';
import { show } from './stage.js';
import { sfx } from '../../ficelle/lib/sound.js';

const $ = id => document.getElementById(id);

export function initSandbox(ctx) {
  const { stage, rig, instant } = ctx;
  let busy = false, active = false, phase = 'clear', P = A.P, result = null;
  const pace = () => instant ? 1 : 2;

  const msgBytes = () => { let b = A.bytes($('sb-msg').value); while (b.length > 63) b = b.slice(0, -1); return b; };
  const mode = () => document.querySelector('input[name="sb-mode"]:checked').value;
  function selects() {
    const n = A.blocks(A.pad(msgBytes())).length, blk = $('sb-block'), keep = +blk.value || 1;
    blk.innerHTML = Array.from({ length: n }, (_, i) => `<option value="${i + 1}">C${i + 1}</option>`).join('');
    blk.value = Math.min(keep, n);
    if (!$('sb-byte').options.length) $('sb-byte').innerHTML = Array.from({ length: 16 }, (_, i) => `<option>${i}</option>`).join('');
    if (!$('sb-bit').options.length) $('sb-bit').innerHTML = Array.from({ length: 8 }, (_, i) => `<option>${i}</option>`).join('');
  }

  function render() {
    for (const id of ['sb-encrypt', 'sb-send', 'sb-reset', 'sb-msg', 'sb-newiv', 'sb-eve', 'sb-block', 'sb-byte', 'sb-bit', 'sb-hmac']) $(id).disabled = busy;
    document.querySelectorAll('input[name="sb-mode"]').forEach(r => r.disabled = busy || phase !== 'clear');
    $('sb-msg').disabled = busy || phase !== 'clear';
    $('sb-encrypt').disabled = busy || phase !== 'clear';
    $('sb-send').disabled = busy || phase !== 'sealed';
    $('sb-newiv').disabled = busy || phase !== 'clear' || mode() !== 'cbc';
    const C = stage.st.crates.filter(c => /^P\d$/.test(c.id)).map(c => c.bytes);
    const rows = [`${t('sb.blocks')} : <b>${P.length}</b>`];
    if (phase !== 'clear') {
      const seen = C.map(c => c.join(',')), dup = seen.filter(x => seen.indexOf(x) !== seen.lastIndexOf(x)).length;
      rows.push(t('sb.same', { n: `<b>${dup}</b>` }));
    }
    if (result?.refused) rows.push(`<b class="ko">${t('sb.refused')}</b>`);
    else if (result) result.read.forEach((b, i) => {
      const s = show(b), state = s.endsWith(' ..') ? 'garbage' : A.same(b, P[i]) ? 'intact' : 'changed';
      rows.push(`${t('sb.read')} P${i + 1} : <b>${esc(s)}</b> <span class="${state}">${t('sb.' + state)}</span>`);
    });
    if (!busy && phase === 'clear') rows.push(t('sb.ready'));
    if (!busy && phase === 'sealed') rows.push(t('sb.sent'));
    $('sb-status').innerHTML = rows.join('<br>');
  }

  function reset() {
    P = A.blocks(A.pad(msgBytes())); phase = 'clear'; result = null;
    stage.speed = instant ? 50 : 1;
    stage.apply({ crates: P.map((b, i) => ({ id: 'P' + (i + 1), label: 'P' + (i + 1), bytes: b, look: 'text', x: SLOT.inA[i] })),
      rings: mode() === 'cbc', wall: { plain: 1, ecb: 1, cbc: 1 }, table: { kind: 'msg', rows: [] } });
    for (let i = 0; i < P.length; i++) stage.row('P' + (i + 1), show(P[i]));
    selects(); render();
  }

  async function encrypt() {
    if (busy || phase !== 'clear') return;
    busy = true; render();
    try {
      rig.fly('sbA');
      const iv = $('sb-newiv').checked ? crypto.getRandomValues(new Uint8Array(16)) : A.IV1;
      const ok = mode() === 'cbc' ? await stage.cbc(iv, P, pace()) : await stage.ecb(P, pace());
      if (ok) phase = 'sealed';
    } finally { busy = false; render(); }
  }

  async function send() {
    if (busy || phase !== 'sealed') return;
    busy = true; render();
    try {
      const mac = $('sb-hmac').checked, eve = $('sb-eve').checked;
      rig.fly('sbMid');
      if (mac) { stage.st.table = { kind: 'mac', rows: [] }; if (!await stage.seal(pace())) return; }
      if (eve) {
        const f = { block: +$('sb-block').value - 1, byte: +$('sb-byte').value, mask: 1 << +$('sb-bit').value };
        if (!await stage.send(f.block, pace())) return;
        if (!await stage.flip(f, pace(), !mac)) return;
      }
      rig.fly('sbB');
      if (!await stage.send(null, pace())) return;
      if (mac) { if (!await stage.check(pace())) return; if (stage.st.verdict === 'bad') { result = { refused: true }; phase = 'done'; return; } }
      if (!await stage.decrypt(pace())) return;
      result = { read: stage.st.read }; phase = 'done';
      if (result.read.every((b, i) => A.same(b, P[i]))) sfx.win();
    } finally { busy = false; render(); }
  }

  $('sb-msg').value = A.MSG;
  $('sb-msg').oninput = () => { if (!busy) reset(); };
  document.querySelectorAll('input[name="sb-mode"]').forEach(r => r.onchange = () => { if (!busy) { sfx.click(); reset(); } });
  $('sb-encrypt').onclick = encrypt;
  $('sb-send').onclick = send;
  $('sb-reset').onclick = () => { if (!busy) { sfx.click(); reset(); } };
  onLang(() => { if (active) render(); });

  return {
    enter: () => { active = true; reset(); rig.fly('sbA'); },
    leave: () => { active = false; stage.speed = instant ? 50 : 1; },
    encrypt, send, reset, state: () => ({ busy, phase, result, blocks: P.length }),
  };
}
const esc = s => s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
