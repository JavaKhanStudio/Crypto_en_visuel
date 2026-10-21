// The card in the top right corner follows the stage: the map's addresses, the envelope's outside and
// inside, the table of who reads what (with and without the tunnel), the two key pairs, the shared
// secret, the sealed packet's bytes, the flipped bit and the two seals. Every value comes from
// js/net.js, computed there, never written by hand.
import { t, raw } from './i18n.js';
import { ADDR, NAME, PUBLIC, KEY, SEALED, PACKET, FLIP, flipped, tagOf, spaced, sees } from './net.js';

const el = document.getElementById('card');
const WHO = ['e', 'i', 'v', 'b'];

// one row of the table: what `who` reads on this path
function row(who, path, c, now) {
  const s = sees(who, path), n = `<span class="no">${c.none}</span>`;
  const content = { clear: who === 'b' ? `<span>${c.read}</span>` : `<span class="bad">${c.read}</span>`, locked: `<span class="good">${c.locked}</span>`, sealed: `<span class="good">${c.sealed}</span>` }[s.content] ?? n;
  const to = s.to ? `<span class="${s.to === 'bob' && who !== 'b' ? 'bad' : ''}">${ADDR[s.to]}</span>` : n;
  return `<tr class="${now ? 'now' : ''}"><th>${c.rows[who]}</th><td>${s.from ? ADDR[s.from] : n}</td><td>${to}</td>
    <td>${s.name && who !== 'b' ? `<span class="bad">${NAME}</span>` : n}</td><td>${content}</td><td>${s.when && who !== 'b' ? c.yes : n}</td></tr>`;
}
function table(path, c, read, title) {
  return `<p class="where">${title}</p><table class="sees"><tr>${c.cols.map(h => `<th>${h}</th>`).join('')}</tr>${WHO.map(w => row(w, path, c, read.includes(w))).join('')}</table>`;
}

export function renderCard(stage) {
  const st = stage.st, c = raw('card'), path = { https: st.https, tunnel: st.tunnel };
  // Eve reads as the place she stands in: light that place's row
  const read = st.read.map(w => w === 'e' ? { cafe: 'e', isp: 'i', vpn: 'v', bob: 'b' }[st.eve] : w);
  const mode = p => `${p.tunnel ? c.withTunnel : c.noTunnel}, ${p.https ? c.https : c.http}`;
  let title = '', body = '';
  if (st.card === 'map') {
    title = c.map;
    body = `<table class="sees">${['cafe', 'bob', 'vpn'].map(k => `<tr><th>${c[k]}</th><td class="bytes plain">${ADDR[k]}</td></tr>`).join('')}</table><p class="legend">${c.docs}</p>`;
  } else if (st.card === 'env') {
    title = c.env;
    body = `<table class="sees"><tr><th>${c.outside}</th><td>${c.from} <b>${ADDR.cafe}</b><br>${c.to} <b>${ADDR.bob}</b></td></tr>
      <tr><th>${c.inside}</th><td>${c.request}</td></tr></table>`;
  } else if (st.card === 'sees') {
    title = c.sees; body = table(path, c, read, mode(path));
  } else if (st.card === 'sees2') {
    title = c.sees; body = table({ https: true, tunnel: false }, c, [], mode({ https: true, tunnel: false })) + table(path, c, read, mode(path));
  } else if (st.card === 'keys') {
    title = c.keys;
    body = `<table class="sees">${['a', 'v'].map(k => `<tr><th>${raw('who')[k]}</th><td>${c.secretRow} : <span class="no">${c.kept}</span><br>${c.publicRow} : <span class="bytes" style="color:#5fb0ff">${spaced(PUBLIC[k], 8)} …</span></td></tr>`).join('')}</table><p class="legend">${c.keysLegend}</p>`;
  } else if (st.card === 'shared') {
    title = c.shared;
    body = `<p class="where">${c.aCalc}</p><p class="bytes">${spaced(KEY.a, 16)} …</p><p class="where">${c.vCalc}</p><p class="bytes">${spaced(KEY.v, 16)} …</p><p class="legend">${c.eCalc}</p>`;
  } else if (st.card === 'seal') {
    title = c.seal;
    body = `<table class="sees"><tr><th>${c.plain}</th><td class="bytes plain">« ${new TextDecoder().decode(PACKET)} »<br>${spaced(PACKET)}</td></tr>
      <tr><th>${c.keyRow}</th><td class="bytes">${spaced(KEY.a, 8)} …</td></tr>
      <tr><th>${c.nonce}</th><td class="bytes plain">0</td></tr>
      <tr><th>${c.ct}</th><td class="bytes">${spaced(SEALED.ct)}</td></tr>
      <tr><th>${c.tagRow}</th><td class="bytes">${spaced(SEALED.tag)}</td></tr>
      <tr><th>${c.newEnv}</th><td>${c.to} <b>${ADDR.vpn}</b> · ${t('card.octets', { n: SEALED.ct.length + SEALED.tag.length })}</td></tr></table>`;
  } else if (st.card === 'flip') {
    const f = flipped(), got = [...f].map((b, i) => i === FLIP ? `<b>${b.toString(16).padStart(2, '0')}</b>` : b.toString(16).padStart(2, '0')).join(' ');
    title = c.flip;
    body = `<table class="sees"><tr><th>${c.got}</th><td class="bytes">${got}</td></tr>
      <tr><th>${c.sent}</th><td class="bytes">${spaced(SEALED.tag)}</td></tr>
      <tr><th>${c.recomputed}</th><td class="bytes bad">${spaced(tagOf(f))}</td></tr></table><p class="legend">${c.reject}</p>`;
  } else if (st.card === 'trust') {
    title = c.trust;
    const r = (who, p, label) => row(who, p, { ...c, rows: { [who]: label } }, false);
    body = `<table class="sees"><tr>${c.cols.map(h => `<th>${h}</th>`).join('')}</tr>${r('i', { https: true, tunnel: false }, c.ispBefore)}${r('v', { https: true, tunnel: true }, c.victorAfter)}</table>`;
  }
  el.classList.toggle('empty', !title);
  el.innerHTML = title ? `<h3>${title}</h3>${body}` : '';
}
