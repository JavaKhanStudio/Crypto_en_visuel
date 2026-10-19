// The sandbox: the reader writes Alice's order, picks Eve's trick at her gate (let the packet
// through, change a byte of the ciphertext, build her own packet signed with her key, or send a copy
// of Alice's last packet again) and Bob's defenses besides the seal (Alice's signature, the number).
// Alice always signs and numbers her packets, with fresh keys, IV and seed every send; Bob decides
// what he checks. The card shows the packet as Bob gets it and each of his moves.
import { t, raw, lang, onLang, ORDER_DEFAULT } from './i18n.js';
import * as P from './packet.js';
import * as S from './sign.js';
import { bobSays, LAST } from './story.js';

const $ = id => document.getElementById(id);

export function initSandbox(ctx) {
  const st = { view: 'sandbox', stats: { sent: 0, ok: 0, rejected: 0, eve: 0 } };
  const order = $('sb-order');
  const pick = name => document.querySelector(`input[name="${name}"]:checked`).value;
  const sb = { token: 0 };
  // Alice's next number, Bob's last accepted one, and the last packet Alice sent (Eve's copy)
  let next = LAST + 1, last = LAST, sent = null, keys = null;
  const show = () => { if (ctx.mode() === 'sandbox') ctx.renderCard(st); };
  const stats = () => { $('sb-stats').innerHTML = t('sb.stats', st.stats); };
  // what goes on the road, given Eve's trick, and what Bob makes of it
  const build = () => {
    const trick = pick('sb-eve');
    st.checks = { sig: $('sb-sig').checked, last: $('sb-num').checked ? last : null };
    keys ??= P.fresh();
    const alice = P.send(order.value || ' ', keys, { num: next, signer: S.ALICE });
    st.sent = alice; st.evil = false;
    if (trick === 'pass') { st.pkt = alice; st.title = raw('card.sbPass'); }
    if (trick === 'flip') { st.pkt = P.tamper(alice); st.title = raw('card.sbFlip'); }
    if (trick === 'forge') {
      // Eve's own packet: her keys, her order, Bob's padlock, the next number (she reads them pass), her signature
      st.pkt = P.send(P.FORGED[lang], P.EVE_KEYS, { num: next, signer: S.EVE, salt: S.SALT_EVE }); st.evil = true; st.title = raw('card.sbForge');
    }
    if (trick === 'replay') {
      st.pkt = sent ? P.replay(sent) : null; st.evil = true;
      st.title = sent ? t('card.sbReplay', { k: P.numOf(sent.num) }) : '';
    }
    st.r = st.pkt && P.receive(st.pkt, st.checks);
    if (st.pkt) show(); else if (ctx.mode() === 'sandbox') ctx.renderCard(null);
  };
  order.addEventListener('input', () => { keys = null; build(); });
  for (const e of document.querySelectorAll('#sandbox input')) if (e !== order) e.addEventListener('change', build);

  $('sb-send').onclick = async () => {
    if (!order.value.trim()) return ctx.toast(t('sb.empty'));
    if (ctx.world.busy) return ctx.toast(t('m.busy'));
    keys = null; build();   // fresh keys, IV and seed every send
    if (!st.pkt) return ctx.toast(t('sb.noCopy'));
    const tok = ++sb.token, live = () => tok === sb.token && ctx.mode() === 'sandbox';
    const e = st.pkt, r = st.r, trick = pick('sb-eve'), city = trick === 'forge' || trick === 'replay';
    const eve = { pass: t('m.evePass'), flip: t('m.eveFlip'), forge: t('m.eveForgeSig'), replay: t('m.eveReplay') }[trick];
    st.stats.sent++; stats();
    if (!city) { sent = st.sent; next++; }   // Alice sent a packet: Eve has it to copy, Alice's next number moves on
    if (!r.rejected) last = Math.max(last, P.numOf(e.num));   // Bob remembers the number of what he accepts
    ctx.world.busy = true;
    try {
      await ctx.ride({ eve, bob: bobSays(r), from: city ? 'city' : 'a', cargo: 'packet', bricks: P.has(e),
        mark: trick === 'forge' ? P.has(e) : trick === 'flip' ? 'ct' : null, reject: !!r.rejected, live,
        onRead: () => {
          if (r.rejected) st.stats.rejected++; else { st.stats.ok++; if (st.evil) st.stats.eve++; }
          stats();
        } });
      if (live()) { ctx.rig.fly('both'); build(); }
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
