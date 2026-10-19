// The card in the top right corner follows the stage: the gaps Eve has measured, how many each
// candidate divides, the text, key and cipher letter by letter, the groups that come back, the five
// columns. Every figure is computed from js/kasiski.js, never written by hand.
import { t, raw, lang } from './i18n.js';
import { TEXT, KEY, metres, repeats, columns } from './kasiski.js';

const el = document.getElementById('card');
const sep = () => lang === 'en' ? '.' : ',';
// the seven rows of the deck's table: five multiples of 5, two coincidences
const TRI = ['PMA', 'HQZ', 'OME', 'QQU', 'YLG', 'IED', 'RFR'];

export function renderCard(stage) {
  const st = stage.st, c = raw('card');
  let title = '', body = '';
  if (st.card === 'trace' || st.card === 'count') {
    const gs = stage.gapList.slice(0, st.tape);
    title = c.trace;
    body = `<p class="where">${c.gaps}</p><div class="chips">${gs.map(g => `<span class="chip${st.red && g.d % st.road.C ? ' bad' : ''}">${metres(g.d, sep())}</span>`).join('') || `<em>${c.none}</em>`}</div>`;
    if (st.card === 'count' && st.grown) {
      const { cs, n, win } = stage.barData();
      body += `<p class="where">${c.count}</p><table class="counts">${cs.map(x => `<tr class="${x.L === win ? 'win' : ''}"><td>${metres(x.L, sep())}</td><td><i style="width:${x.n / n * 100}%"></i></td><td>${t('card.of', { n: x.n, m: n })}</td></tr>`).join('')}</table>`;
    }
    if (st.red) body += `<p class="legend">${c.legendRed}</p>`;
  } else if (st.card === 'vig') {
    // the first letters, or the twelve around the wheel: text, key under it, cipher once stamped
    const a = Math.max(0, Math.min(st.kw - 8, 96 - 16)), idx = [...Array(16).keys()].map(k => a + k), cipher = stage.cipher();
    title = c.vig;
    body = `<table class="vig"><tr><th>${c.text}</th>${idx.map(i => `<td>${TEXT[i]}</td>`).join('')}</tr>
      <tr><th>${c.key}</th>${idx.map(i => `<td class="k${i === st.kw ? ' now' : ''}">${KEY[i % 5]}</td>`).join('')}</tr>
      <tr><th>${c.cipher}</th>${idx.map(i => `<td class="c">${i < st.stamped ? cipher[i] : ''}</td>`).join('')}</tr></table>`;
  } else if (st.card === 'repeat') {
    title = c.repeat;
    const cipher = stage.cipher();
    body = [51, 81].map(p => `<p class="where">${t('card.pos', { i: p })}</p><table class="vig">
      <tr><th>${c.text}</th>${[...TEXT.slice(p, p + 12)].map(x => `<td>${x}</td>`).join('')}</tr>
      <tr><th>${c.key}</th>${[...Array(12).keys()].map(k => `<td class="k">${KEY[(p + k) % 5]}</td>`).join('')}</tr>
      <tr><th>${c.cipher}</th>${[...cipher.slice(p, p + 12)].map(x => `<td class="c${st.hot ? ' hot' : ''}">${x}</td>`).join('')}</tr></table>`).join('')
      + `<p class="legend">81 − 51 = 30 = 5 × 6</p>`;
  } else if (st.card === 'tri' || st.card === 'ccount') {
    const reps = repeats(stage.cipher());
    title = st.card === 'tri' ? c.tri : c.ccount;
    if (st.card === 'tri') {
      const rows = TRI.map(g => reps.find(r => r.tri === g)).filter(Boolean);
      body = `<table class="tri"><tr>${c.triHead.map(h => `<th>${h}</th>`).join('')}</tr>${rows.map(r => `<tr class="${r.d % 5 ? 'bad' : ''}"><td>${r.tri}</td><td>${r.a} → ${r.b}</td><td>${r.d % 5 ? r.d : `${r.d} = 5 × ${r.d / 5}`}</td></tr>`).join('')}</table><p class="legend">${c.triMore}</p>`;
    } else {
      const { cs, n, win } = stage.barData();
      body = `<table class="counts">${cs.map(x => `<tr class="${x.L === win && st.grown ? 'win' : ''}"><td>${x.L}</td><td><i style="width:${st.grown ? x.n / n * 100 : 0}%"></i></td><td>${st.grown ? t('card.of', { n: x.n, m: n }) : ''}</td></tr>`).join('')}</table>`;
    }
  } else if (st.card === 'cols') {
    const cols = columns(stage.cipher(), 5), lit = st.lit || [];
    title = c.cols;
    body = `<table class="tri"><tr><th>${c.col}</th><th>${c.top}</th><th>${c.minusE}</th></tr>${cols.map((x, j) => `<tr class="${lit[j] ? 'win' : ''}"><td>${j + 1}</td><td>${x.top} · ${t('card.times', { n: x.n, m: x.col.length })}</td><td>${lit[j] ? x.key : '?'}</td></tr>`).join('')}</table>`;
  }
  el.classList.toggle('empty', !title);
  el.innerHTML = title ? `<h3>${title}</h3>${body}` : '';
}
