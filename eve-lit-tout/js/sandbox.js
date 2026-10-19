// The sandbox: the reader writes an order and picks how Alice sends it: in the clear, encrypted
// always with the same key and IV, or with a fresh key and IV each time. Each send rides past Eve,
// who reads what she can and keeps it in her notebook: a ciphertext (or a text) she has already
// seen is flagged. The card shows the send's key, blocks, padding and ciphertext.
import { t, lang, onLang, ORDER_DEFAULT } from './i18n.js';
import * as A from './aes.js';

const $ = id => document.getElementById(id);

export function initSandbox(ctx) {
  const st = { view: 'sandbox', how: 'fresh', send: null, book: [], stats: { sent: 0, read: 0, seen: 0 } };
  const fixed = { key: A.random(32), iv: A.random(16) };   // « the same key and IV », drawn once a visit
  const order = $('sb-order'), how = () => document.querySelector('input[name="sb-how"]:checked').value;
  const sb = { token: 0 };
  const show = () => { if (ctx.mode() === 'sandbox') ctx.renderCard(st); };
  const stats = () => { $('sb-stats').innerHTML = t('sb.stats', st.stats); };
  // what the card shows before a send: the order as it is typed, with the chosen way
  const preview = () => {
    st.how = how();
    const msg = order.value || ' ';
    st.send = st.how === 'fresh' ? A.send(msg, A.random(32), A.random(16)) : A.send(msg, fixed.key, fixed.iv);
    show();
  };
  order.addEventListener('input', preview);
  document.querySelectorAll('input[name="sb-how"]').forEach(r => r.addEventListener('change', preview));

  $('sb-send').onclick = async () => {
    const msg = order.value.trim();
    if (!msg) return ctx.toast(t('sb.empty'));
    if (ctx.world.busy) return ctx.toast(t('m.busy'));
    const tok = ++sb.token, live = () => tok === sb.token && ctx.mode() === 'sandbox';
    st.how = how();
    const s = st.send = st.how === 'fresh' ? A.send(msg, A.random(32), A.random(16)) : A.send(msg, fixed.key, fixed.iv);
    const plain = st.how === 'plain', seenIt = st.book.some(d => plain ? d.plain === msg : d.c && A.same(d.full, A.concat(s.C)));
    st.stats.sent++; stats(); show();
    ctx.world.busy = true;
    try {
      await ctx.ride({
        eve: plain ? t('m.readPlain', { m: msg }) : t('m.readCipher', { h: A.hex(A.concat([s.iv, ...s.C]), 8) }),
        eve2: seenIt ? t('m.seen') : null,
        bob: plain ? t('m.bobPlain', { m: msg }) : t('m.bobCipher', { m: s.back }), live,
        onRead: () => {
          if (plain) st.stats.read++;
          if (seenIt) st.stats.seen++;
          st.book.push(plain ? { day: st.book.length + 1, plain: msg, seen: seenIt, tag: seenIt ? 'same' : null }
            : { day: st.book.length + 1, c: s.C[0], full: A.concat(s.C), seen: seenIt, tag: seenIt ? 'same' : null });
          stats(); show();
        },
      });
      if (live()) ctx.rig.fly('both');
    } finally { ctx.world.busy = false; }
  };
  $('sb-reset').onclick = () => { st.book = []; st.stats = { sent: 0, read: 0, seen: 0 }; stats(); show(); };
  onLang(() => { stats(); show(); });

  sb.enter = () => {
    if (!order.value) order.value = ORDER_DEFAULT();
    stats(); preview(); ctx.rig.fly('both');
  };
  return sb;
}
