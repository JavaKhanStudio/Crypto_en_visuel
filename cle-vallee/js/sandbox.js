// The sandbox: the reader writes an order, picks how Alice's two keys travel (in the clear, or locked
// with Bob's padlock, RSA-OAEP) and what Eve does at her gate (reads what she can, or changes the
// order on the way). Each send draws fresh keys, a fresh IV and a fresh OAEP seed; the card shows
// what travels, what Eve gets, and what Bob reads.
import { t, lang, onLang, ORDER_DEFAULT } from './i18n.js';
import * as P from './packet.js';
import { bobSays, eveSays } from './story.js';

const $ = id => document.getElementById(id);

export function initSandbox(ctx) {
  const st = { view: 'sandbox', stats: { sent: 0, keys: 0, fooled: 0, rejected: 0 } };
  const order = $('sb-order');
  const pick = name => document.querySelector(`input[name="${name}"]:checked`).value;
  const sb = { token: 0 };
  let keys = null;   // drawn once per order typed, so the card does not change under the reader
  const show = () => { if (ctx.mode() === 'sandbox') ctx.renderCard(st); };
  const stats = () => { $('sb-stats').innerHTML = t('sb.stats', st.stats); };
  // the packet as Alice sends it, then as Eve leaves it
  const build = () => {
    keys ??= P.fresh();
    st.s = P.send(order.value || ' ', keys, pick('sb-keys'));
    st.rewrite = pick('sb-eve') === 'rewrite';
    st.eve = P.eve(st.s, st.rewrite, lang);
    show();
  };
  order.addEventListener('input', () => { keys = null; build(); });
  for (const e of document.querySelectorAll('#sandbox input[type="radio"]')) e.addEventListener('change', build);

  $('sb-send').onclick = async () => {
    if (!order.value.trim()) return ctx.toast(t('sb.empty'));
    if (ctx.world.busy) return ctx.toast(t('m.busy'));
    const tok = ++sb.token, live = () => tok === sb.token && ctx.mode() === 'sandbox';
    keys = null; build();   // fresh keys, IV and seed every send
    const s = st.s, e = st.eve, r = P.receive(e.pkt);
    st.stats.sent++; stats();
    ctx.world.busy = true;
    try {
      await ctx.ride({ eve: eveSays(e, st.rewrite), bob: bobSays(s, r), cargo: s.how === 'clear' ? 'keys' : 'locked', reject: !!r.rejected, live,
        onRead: () => {
          if (e.keys) st.stats.keys++;
          if (r.rejected) st.stats.rejected++;
          else if (st.rewrite) st.stats.fooled++;
          stats();
        } });
      if (live()) ctx.rig.fly('both');
    } finally { ctx.world.busy = false; }
  };
  onLang(() => { stats(); build(); });

  sb.enter = () => {
    if (!order.value) order.value = ORDER_DEFAULT();
    stats(); build(); ctx.rig.fly('both');
  };
  return sb;
}
