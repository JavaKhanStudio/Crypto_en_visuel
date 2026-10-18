// The card in the top right corner: the slides' tables (« ECB - Un exemple », « CBC - Un
// exemple », « Bit-flip - Un exemple »), a row written each time a block comes out. A value that
// appears twice in a column is marked: P1 and P3 always, C1 and C3 in ECB only.
import { t, raw } from './i18n.js';

const el = document.getElementById('card');

export function renderCard(stage) {
  const { kind, rows } = stage.st.table, head = raw('card.head')[kind] || [];
  const twice = (v, col) => v.length > 3 && rows.filter(r => r[col] === v).length > 1;
  const cell = (v, col) => {
    const cls = [col % 2 === 0 ? 'k' : 'v', v.startsWith('⊕') || v === '=' || v === '≠' ? 'op' : '', v === '≠' ? 'ko' : '', twice(v, col) ? 'same' : '', / \.\.$/.test(v) ? 'hex' : ''];
    return `<td class="${cls.join(' ')}">${esc(v.startsWith('@') ? t(v.slice(1)) : v)}</td>`;
  };
  const body = rows.map(r => `<tr>${r.map(cell).join('')}</tr>`).join('');
  const verdict = stage.st.verdict ? `<p class="verdict ${stage.st.verdict}">${t('card.verdict.' + stage.st.verdict)}</p>` : '';
  el.innerHTML = `<h3>${raw('card.title')[kind]}</h3><p class="where">${t('card.key')}</p>
    <table>${head.length ? `<tr>${head.map(h => `<th>${h}</th>`).join('')}</tr>` : ''}${body || `<tr><td class="empty">${t('card.blank')}</td></tr>`}</table>${verdict}`;
}
const esc = s => s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
