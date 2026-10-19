// The sandbox: the reader writes an order, picks what Eve does at her gate (lets the packet through,
// or changes one byte of one brick, at the place they choose) and the order of Bob's moves (check the
// seal then decrypt, or the mistake: decrypt then check). Each send draws fresh keys, a fresh IV and
// a fresh OAEP seed; the card shows the four bricks as Bob gets them and each of his moves.
import { t, lang, onLang, ORDER_DEFAULT } from './i18n.js';
import * as P from './packet.js';
import { bobSays, eveSays } from './story.js';

const $ = id => document.getElementById(id);

export function initSandbox(ctx) {
  const st = { view: 'sandbox', stats: { sent: 0, ok: 0, rejected: 0, late: 0 } };
  const order = $('sb-order'), byte = $('sb-byte');
  const pick = name => document.querySelector(`input[name="${name}"]:checked`).value;
  const sb = { token: 0 };
  let keys = null;   // drawn once per order typed, so the card does not change under the reader
  const show = () => { if (ctx.mode() === 'sandbox') ctx.renderCard(st); };
  const stats = () => { $('sb-stats').innerHTML = t('sb.stats', st.stats); };
  // the packet as Alice sends it, then as Eve leaves it, then what Bob makes of it
  const build = () => {
    keys ??= P.fresh();
    st.s = P.send(order.value || ' ', keys);
    const flip = pick('sb-eve') === 'flip', brick = pick('sb-brick'), len = P.field(st.s, brick).length;
    for (const e of document.querySelectorAll('input[name="sb-brick"]')) e.disabled = !flip;
    byte.disabled = !flip; byte.max = len;
    const i = Math.max(1, Math.min(len, parseInt(byte.value) || 1));
    st.eve = flip ? P.tamper(st.s, brick, i - 1) : st.s;
    st.checkFirst = pick('sb-bob') === 'check';
    st.r = P.receive(st.eve, st.checkFirst);
    show();
  };
  order.addEventListener('input', () => { keys = null; build(); });
  byte.addEventListener('input', build);
  for (const e of document.querySelectorAll('#sandbox input[type="radio"]')) e.addEventListener('change', build);

  $('sb-send').onclick = async () => {
    if (!order.value.trim()) return ctx.toast(t('sb.empty'));
    if (ctx.world.busy) return ctx.toast(t('m.busy'));
    const tok = ++sb.token, live = () => tok === sb.token && ctx.mode() === 'sandbox';
    keys = null; build();   // fresh keys, IV and seed every send
    const e = st.eve, r = st.r;
    st.stats.sent++; stats();
    ctx.world.busy = true;
    try {
      await ctx.ride({ eve: eveSays(e), bob: bobSays(r), cargo: 'packet', mark: e.eve?.brick, reject: !!r.rejected, live,
        onRead: () => {
          if (!r.rejected) st.stats.ok++; else { st.stats.rejected++; if (r.decrypted) st.stats.late++; }
          stats();
        } });
      if (live()) ctx.rig.fly('both');
    } finally { ctx.world.busy = false; }
  };
  onLang(() => { stats(); build(); });

  sb.enter = () => {
    if (!order.value) order.value = ORDER_DEFAULT();
    ctx.showcase();
    stats(); build(); ctx.rig.fly('both');
  };
  return sb;
}
