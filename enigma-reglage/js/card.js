// The card in the top right corner. Most of the story: the table of the current, filled in as it
// runs, one row per key pressed: the key, the position before the press, the letter after the
// cable, the contact the current reaches after the right, middle and left rotors, the reflector,
// the left, middle and right rotors, and the lamp after the cable. When the story counts the
// settings (st.tally), the count instead, every figure computed by enigma.js.
import { t, raw, lang } from './i18n.js';
import { ORDERS, STARTS, cableSteps, cableWays, TOTAL } from './enigma.js';

const el = document.getElementById('card');
export const fmt = n => n.toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-US');
// 1.59 × 10^20, in the visitor's language
export function sci(n, digits = 2) {
  const s = n.toString(), e = s.length - 1, m = (Number(s.slice(0, digits + 2)) / 10 ** (digits + 1)).toFixed(digits);
  return `${lang === 'fr' ? m.replace('.', ',') : m} × 10<sup>${e}</sup>`;
}

function tally(tl) {
  const T = raw('tally');
  if (tl.kind === 'orders') {
    const lines = [[T.orders, `5 × 4 × 3 = ${fmt(ORDERS)}`], [T.starts, `26 × 26 × 26 = ${fmt(STARTS)}`], [T.both, `${fmt(ORDERS)} × ${fmt(STARTS)} = ${fmt(ORDERS * STARTS)}`]];
    return lines.slice(0, tl.n).map(([a, b], i) => `<tr class="${i === tl.n - 1 ? 'new' : ''}"><th>${a}</th><td>${b}</td></tr>`).join('');
  }
  if (tl.kind === 'cables') {
    const head = `<tr><th>${T.cable}</th><th>${T.free}</th><th>${T.places}</th><th>${T.ways}</th></tr>`;
    return head + cableSteps(10).slice(0, tl.n).map((c, i) =>
      `<tr class="${i === tl.n - 1 ? 'new' : ''}"><td>${c.k}</td><td>${c.free}</td><td>${c.free} × ${c.free - 1} / 2 = ${c.free * (c.free - 1) / 2}${c.k > 1 ? ` ; ÷ ${c.k}` : ''}</td><td>${fmt(c.ways)}</td></tr>`).join('');
  }
  const lines = [[T.orders, fmt(ORDERS)], [T.starts, fmt(STARTS)], [T.cables10, fmt(cableWays(10))], [T.total, `${fmt(TOTAL)}<br><b>≈ ${sci(TOTAL)}</b>`]];
  return lines.slice(0, tl.n).map(([a, b], i) => `<tr class="${i === tl.n - 1 ? 'new' : ''}"><th>${i ? '× ' : ''}${a}</th><td>${b}</td></tr>`).join('');
}

export function renderCard(stage) {
  const st = stage.st;
  if (st.tally) {
    el.innerHTML = `<h3>${t('tally.title')}</h3><p class="where">${raw('tally.sub')[st.tally.kind]}</p><table class="tally ${st.tally.kind}">${tally(st.tally)}</table>`;
    return;
  }
  const set = st.set[st.card], R = set.rotors, rows = st.rows.slice(-4);
  const HEAD = [R[2], R[1], R[0], 'ref', R[0], R[1], R[2]];
  const head = `<tr><th>${t('card.key')}</th><th>${t('card.from')}</th><th class="go">⇄</th>${HEAD.map((h, i) => `<th class="${i < 3 ? 'go' : 'back'}">${h === 'ref' ? t('card.ref') : h}</th>`).join('')}<th class="back">⇄</th></tr>`;
  const body = rows.map((r, ri) => {
    const filled = Math.max(0, r.n - 1), last = ri === rows.length - 1;
    const cell = (c, on, cls, hot) => `<td class="${cls} ${on ? 'on' : ''} ${last && hot ? 'hot' : ''}">${on ? c : '·'}</td>`;
    const cells = r.rec.path.map((c, i) => cell(c, i < filled, i < 3 ? 'go' : 'back', i === st.hot)).join('');
    // a row pressed with other rings than the header's (before a ring turned) says which
    const was = r.rec.rings !== set.rings ? `<small class="was">${t('card.rings', { g: [...r.rec.rings].join(' ') })}</small>` : '';
    return `<tr class="${was ? 'other' : ''}"><td class="k">${r.rec.key}</td><td class="from">${r.rec.from}${was}</td>${cell(r.rec.in, r.n >= 1, 'go plug', false)}${cells}${cell(r.rec.lamp, r.n >= 8, 'back plug lamp', false)}</tr>`;
  }).join('');
  const pos = st.pos[st.card], plugs = set.plugs ? set.plugs : t('card.noCable');
  const msg = st.msg ? `<p class="msg">${st.msg.plain} → ${st.msg.cipher} <span>(${t('card.start', { p: st.msg.from })})</span></p>` : '';
  el.innerHTML = `<h3>${t('card.title')}</h3><p class="where">${raw('card.whose')[st.card]} · ${t('card.setup', { r: R.join(' ') })} · ${t('card.rings', { g: [...set.rings].join(' ') })} · ${t('card.pos', { p: pos })}<br>${t('card.cables')} ${plugs}</p>
    <table>${head}${body || `<tr><td colspan="12" class="empty">${t('card.blank')}</td></tr>`}</table>${msg}`;
}
