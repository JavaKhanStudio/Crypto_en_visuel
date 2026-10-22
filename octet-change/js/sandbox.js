// The sandbox: the reader writes an order, picks what Eve does (nothing, XOR 0f on one byte of the IV
// or of the ciphertext, or her own forged rider) and whether Bob checks the seal before decrypting.
// Each send draws a fresh key, IV and HMAC key; the card shows the packet, Bob's seal when he
// rejects it, or the blocks he decrypts and whether they are what Alice wrote.
import { t, lang, onLang, ORDER_DEFAULT } from './i18n.js';
import * as A from '../../lib/saga-aes.js';
import { bobSays, eveSays } from './story.js';

const $ = id => document.getElementById(id);

export function initSandbox(ctx) {
  const st = { view: 'sandbox', how: 'iv', check: true, stats: { sent: 0, hit: 0, fooled: 0, rejected: 0 } };
  const order = $('sb-order'), byte = $('sb-byte'), check = $('sb-check');
  const how = () => document.querySelector('input[name="sb-how"]:checked').value;
  const sb = { token: 0 };
  let keys = null;   // drawn once per order typed, so the card does not change under the reader
  const show = () => { if (ctx.mode() === 'sandbox') ctx.renderCard(st); };
  const stats = () => { $('sb-stats').innerHTML = t('sb.stats', st.stats); };
  // the packet as Alice seals it, then as it reaches Bob after Eve
  const build = () => {
    st.how = how(); st.check = check.checked;
    keys ??= { key: A.random(32), iv: A.random(16), mac: A.random(32) };
    const s = st.s = A.send(order.value || ' ', keys.key, keys.iv, keys.mac);
    const ivOrCt = st.how === 'iv' || st.how === 'ct';
    byte.disabled = !ivOrCt;
    byte.max = st.how === 'iv' ? 16 : s.C.length * 16;
    const i = Math.max(1, Math.min(+byte.max, +byte.value || 1)) - 1;
    st.forged = A.send(A.FORGED[lang], A.random(32), A.random(16), A.random(32));
    st.pkt = ivOrCt ? A.tamper(s, st.how, i) : st.how === 'forge' ? st.forged : { iv: s.iv, C: s.C, tag: s.tag };
    show();
  };
  order.addEventListener('input', () => { keys = null; build(); });
  for (const e of [byte, check, ...document.querySelectorAll('input[name="sb-how"]')]) e.addEventListener('change', build);
  byte.addEventListener('input', build);

  $('sb-send').onclick = async () => {
    if (!order.value.trim()) return ctx.toast(t('sb.empty'));
    if (ctx.world.busy) return ctx.toast(t('m.busy'));
    const tok = ++sb.token, live = () => tok === sb.token && ctx.mode() === 'sandbox';
    keys = null; build();   // a fresh key, IV and HMAC key every send
    const s = st.s, pkt = st.pkt, r = A.receive(pkt, s.key, s.macKey, st.check);
    const eve = st.how === 'forge' ? t('m.forge') : st.how === 'none' ? t('m.pass', { h: A.hex(A.concat([s.iv, ...s.C]), 8) }) : eveSays(s, pkt);
    const changed = st.how !== 'none';
    st.stats.sent++; stats();
    ctx.world.busy = true;
    try {
      await ctx.ride({ eve, bob: bobSays(r, st.check), forged: st.how === 'forge', reject: !!r.rejected, live,
        onRead: () => {
          if (changed) st.stats.hit++;
          if (r.rejected) st.stats.rejected++;
          else if (changed && r.padGood) st.stats.fooled++;
          stats();
        } });
      if (live()) ctx.rig.fly('both');
    } finally { ctx.world.busy = false; }
  };
  onLang(() => { stats(); build(); });

  sb.enter = () => {
    if (!order.value) order.value = ORDER_DEFAULT();
    if (!byte.value) byte.value = A.HOUR + 1;
    stats(); build(); ctx.rig.fly('both');
  };
  return sb;
}
