// The card in the top right corner: the strip's letters as a table. Wound on a stick, one row
// per line of that stick (the one in front marked); lying flat, one row in strip order. Each
// letter keeps the colour of the line Alice wrote it on, so a wrong stick shows mixed colours.
import { t, raw } from './i18n.js';

export const ROW_COLORS = ['#ff8a5c', '#5fd1ff', '#ffd84d', '#9be37a', '#d58cff', '#ff6fae'];
const el = document.getElementById('card');

export function renderCard(stage) {
  const st = stage.st, L = stage.lay, on = st.strip.on;
  const cell = j => {
    const ch = stage.shown(j) ? L.strip[j] : '';
    return `<span class="cell${j === stage.hot ? ' hot' : ''}" style="--c:${ch ? ROW_COLORS[(j % L.k) % ROW_COLORS.length] : 'rgba(255,255,255,.12)'}">${ch || '&nbsp;'}</span>`;
  };
  const idx = [...L.strip.keys()];
  let title, rows;
  if (on) {
    const kk = stage.sticks[on].userData.k, f = stage.front(on);
    title = `${raw('stick')[on]} · ${t('stick.per', { k: kk })}`;
    rows = Array.from({ length: kk }, (_, r) => `<div class="line${r === f ? ' front' : ''}">${idx.filter(j => j % kk === r).map(cell).join('')}${r === f ? `<em>◀ ${t('card.front')}</em>` : ''}</div>`);
  } else {
    title = raw('table')[st.strip.at];
    rows = [`<div class="line flat">${idx.map(cell).join('')}</div>`];
  }
  const written = st.strip.written > 0;
  el.innerHTML = `<h3>${t('card.title')}</h3><p class="where">${title}</p>${rows.join('')}<p class="legend">${written ? t('card.legend') : t('card.blank')}</p>`;
}
