// The card in the top right corner: the slide « Mots de passe - Le sel » filled in as Alice and
// Bob sign up (alice password -> 5f4dcc3b, then alice password+x7k2m -> cffbee8f), then Eve's
// look-ups in her book, her tries, and the speeds of « SHA-256 est trop rapide » and « bcrypt -
// La lenteur ». A fingerprint that appears twice is marked.
import { t, raw, lang } from './i18n.js';

const el = document.getElementById('card');

export function renderCard(stage) {
  const { kind, rows } = stage.st.table;
  const hashes = rows.map(r => r[3]).filter(Boolean);
  const twice = (v, col) => col === 3 && /^[0-9a-f]{8}$/.test(v) && hashes.filter(h => h === v).length > 1 && kind === 'sel';
  const cell = (v, col, span) => {
    const word = v.startsWith('@') ? t(v.slice(1)) : lang === 'fr' && /^\d+\.\d+ s$/.test(v) ? v.replace('.', ',') : v;
    const cls = [col === 0 ? 'k' : 'v', v === '→' || v === '=' || v === '≠' ? 'op' : '', v === '≠' ? 'ko' : '', twice(v, col) ? 'same' : '',
      /^[0-9a-f]{8}$|^\$2b\$/.test(v) ? 'hex' : '', v.startsWith('@') ? 'say' : ''];
    return `<td class="${cls.join(' ')}"${span > 1 ? ` colspan="${span}"` : ''}>${esc(word)}</td>`;
  };
  // a heading spans the row; a short row's last cell spans to the end
  const line = r => r[0].startsWith('@head.') ? `<tr><td class="head" colspan="4">${esc(t(r[0].slice(1)))}</td></tr>`
    : `<tr>${r.map((v, col) => cell(v, col, col === r.length - 1 ? 5 - r.length : 1)).join('')}</tr>`;
  const body = rows.map(line).join('');
  el.innerHTML = `<h3>${raw('card.title')[kind]}</h3><p class="where">${raw('card.where')[kind]}</p>
    <table>${body || `<tr><td class="empty">${t('card.blank')}</td></tr>`}</table>`;
}
const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
