// The card in the top right corner: the slide's own table, filled in as the current runs.
// One row per key pressed: the key, the position before the press, then the contact the
// current reaches after III, II, I, the reflector, I, II, III (the last one is the lamp).
import { t, raw } from './i18n.js';

const el = document.getElementById('card');
const HEAD = ['III', 'II', 'I', 'ref', 'I', 'II', 'III'];

export function renderCard(stage) {
  const st = stage.st, rows = st.rows.slice(-4);
  const head = `<tr><th>${t('card.key')}</th><th>${t('card.from')}</th>${HEAD.map((h, i) => `<th class="${i < 3 ? 'go' : 'back'}">${h === 'ref' ? t('card.ref') : h}</th>`).join('')}</tr>`;
  const body = rows.map((r, ri) => {
    const filled = Math.max(0, r.n - 1), last = ri === rows.length - 1;
    const cells = r.rec.path.map((c, i) => {
      const cls = [i < 3 ? 'go' : 'back', i === 6 ? 'lamp' : '', i < filled ? 'on' : '', last && i === st.hot ? 'hot' : ''].join(' ');
      return `<td class="${cls}">${i < filled ? c : '·'}</td>`;
    }).join('');
    return `<tr><td class="k">${r.rec.key}</td><td class="from">${r.rec.from}</td>${cells}</tr>`;
  }).join('');
  const pos = st.pos[st.card];
  const msg = st.msg ? `<p class="msg">${st.msg.plain} → ${st.msg.cipher} <span>(${t('card.start', { p: st.msg.from })})</span></p>` : '';
  el.innerHTML = `<h3>${t('card.title')}</h3><p class="where">${raw('card.whose')[st.card]} · ${t('card.setup')} · ${t('card.pos', { p: pos })}</p>
    <table>${head}${body || `<tr><td colspan="9" class="empty">${t('card.blank')}</td></tr>`}</table>${msg}`;
}
