// The card in the top right corner. On a machine: the table of the current, filled in as it runs,
// one row per key pressed: the key, the position before the press, the letter after the cable, the
// contact the current reaches after the right, middle and left rotors, the reflector, the left,
// middle and right rotors, and the lamp after the cable. On Eve's side (st.panel): the 13 wires of
// the reflector, the places of the crib, the links of the menu and a guess followed round its loop,
// the bombe's run and the clerk's check of its stops; every figure computed by enigma.js.
import { t, raw, lang } from './i18n.js';
import { A, REFLECTOR, STARTS, clashes } from './enigma.js';

const el = document.getElementById('card');
export const fmt = n => n.toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-US');

function reflector() {
  const pairs = [...A].filter((c, i) => c < REFLECTOR[i]).map(c => `${c}–${REFLECTOR[A.indexOf(c)]}`);
  return `<h3>${t('pane.ref.title')}</h3><p class="where">${t('pane.ref.sub')}</p><p class="pairs">${pairs.join(' ')}</p>`;
}
function crib(sl) {
  const rows = Object.entries(sl.marks || {}).map(([k, m]) => {
    k = +k; const hit = clashes(sl.cipher, sl.crib, k);
    const why = m === 'out' ? t('pane.crib.out', { c: sl.crib[hit[0]], n: k + hit[0] + 1 }) : t('pane.crib.ok');
    return `<tr class="${m}"><th>${k + 1}</th><td>${why}</td></tr>`;
  });
  const left = Object.entries(sl.marks || {}).filter(([, m]) => m === 'ok').map(([k]) => +k + 1);
  return `<h3>${t('pane.crib.title')}</h3><p class="where">${sl.crib} · ${t('pane.crib.sub', { n: sl.cipher.length - sl.crib.length + 1 })}</p>
    <table class="places"><tr><th>${t('pane.crib.place')}</th><th></th></tr>${rows.join('')}</table>
    ${left.length ? `<p class="msg">${t('pane.crib.left')} ${left.join(', ')}</p>` : ''}`;
}
function menu(mn, k) {
  const n = mn.n ?? mn.links.length;
  // three links to a row, so the card stays short beside the slate
  const cells = mn.links.slice(0, n).map((l, i) => `<th class="${mn.loop?.includes(i) ? 'loop' : ''}">${l.i + 1}</th><td class="${mn.loop?.includes(i) ? 'loop' : ''}">${l.a}–${l.b}</td>`);
  const rows = [...Array(Math.ceil(cells.length / 3)).keys()].map(r => `<tr>${cells.slice(r * 3, r * 3 + 3).join('')}</tr>`).join('');
  let trace = '';
  if (mn.trace) {
    const tr = mn.trace, steps = tr.letters.slice(0, tr.upto).map((c, j) => `${c}→${tr.vals[j]}`).join(' · ');
    const end = tr.upto === tr.letters.length ? (tr.vals.at(-1) === tr.vals[0] ? `<b class="ok">${t('pane.menu.holds')}</b>` : `<b class="bad">${t('pane.menu.falls', { a: tr.vals[0], b: tr.vals.at(-1) })}</b>`) : '';
    trace = `<p class="msg">${t('pane.menu.guess', { p: mn.pos })}<br>${steps} ${end}</p>`;
  }
  return `<h3>${t('pane.menu.title', { k: k + 1 })}</h3><p class="where">${t('pane.menu.sub')}</p><table class="links">${rows}</table>${trace}`;
}
function bombe(r) {
  const head = `<p class="where">${t('pane.bombe.sub', { r: r.rotors.join(' '), x: r.test })}</p>`;
  if (r.checks) {
    const rows = r.checks.map(c => `<tr class="${c.bad.length ? 'out' : 'ok'}"><th>${c.k + 1}</th><td>${c.pos}</td><td>${r.test}–${c.guess}</td><td>${c.bad.length
      ? t('pane.bombe.bad', { c: c.bad[0] }) : `<b>${t('pane.bombe.good')}</b> ${c.pairs.filter(p => p[0] !== p[1]).join(' ')}`}</td></tr>`).join('');
    return `<h3>${t('pane.bombe.checkTitle')}</h3>${head}<table class="stops"><tr><th>${t('pane.crib.place')}</th><th>${t('pane.bombe.pos')}</th><th>${t('pane.bombe.guess')}</th><th></th></tr>${rows}</table>`;
  }
  const rows = r.menus.map((m, i) => {
    const done = r.done[i] || 0, stops = r.stops.filter(s => s.k === m.k);
    return `<tr class="${i === r.m ? 'hot' : ''}"><th>${m.k + 1}</th><td><span class="bar"><i style="width:${100 * done / STARTS}%"></i></span>${fmt(done)}</td><td>${stops.map(s => s.pos).join(' ') || (done === STARTS ? '—' : '')}</td></tr>`;
  }).join('');
  const total = r.done.reduce((a, b) => a + (b || 0), 0);
  return `<h3>${t('pane.bombe.title')}</h3>${head}<table class="stops"><tr><th>${t('pane.crib.place')}</th><th>${t('pane.bombe.tried')}</th><th>${t('pane.bombe.stops')}</th></tr>${rows}</table>
    <p class="msg">${t('pane.bombe.total', { n: fmt(total), s: r.stops.length })}</p>`;
}

export function renderCard(stage) {
  const st = stage.st;
  if (st.panel === 'ref') { el.innerHTML = reflector(); return; }
  if (st.panel === 'crib' && st.slate) { el.innerHTML = crib(st.slate); return; }
  if (st.panel === 'menu' && st.menu) { el.innerHTML = menu(st.menu, st.slate?.k ?? 0); return; }
  if (st.panel === 'bombe' && st.run) { el.innerHTML = bombe(st.run); return; }
  const set = st.set[st.card], R = set.rotors, rows = st.rows.slice(-4);
  const HEAD = [R[2], R[1], R[0], 'ref', R[0], R[1], R[2]];
  const head = `<tr><th>${t('card.key')}</th><th>${t('card.from')}</th><th class="go">⇄</th>${HEAD.map((h, i) => `<th class="${i < 3 ? 'go' : 'back'}">${h === 'ref' ? t('card.ref') : h}</th>`).join('')}<th class="back">⇄</th></tr>`;
  const body = rows.map((r, ri) => {
    const filled = Math.max(0, r.n - 1), last = ri === rows.length - 1;
    const cell = (c, on, cls, hot) => `<td class="${cls} ${on ? 'on' : ''} ${last && hot ? 'hot' : ''}">${on ? c : '·'}</td>`;
    const cells = r.rec.path.map((c, i) => cell(c, i < filled, i < 3 ? 'go' : 'back', i === st.hot)).join('');
    return `<tr><td class="k">${r.rec.key}</td><td class="from">${r.rec.from}</td>${cell(r.rec.in, r.n >= 1, 'go plug', false)}${cells}${cell(r.rec.lamp, r.n >= 8, 'back plug lamp', false)}</tr>`;
  }).join('');
  const pos = st.pos[st.card], plugs = set.plugs ? set.plugs : t('card.noCable');
  const msg = st.msg ? `<p class="msg">${st.msg.plain} → ${st.msg.cipher} <span>(${t('card.start', { p: st.msg.from })})</span></p>` : '';
  el.innerHTML = `<h3>${t('card.title')}</h3><p class="where">${raw('card.whose')[st.card]} · ${t('card.setup', { r: R.join(' ') })} · ${t('card.rings', { g: [...set.rings].join(' ') })} · ${t('card.pos', { p: pos })}<br>${t('card.cables')} ${plugs}</p>
    <table>${head}${body || `<tr><td colspan="12" class="empty">${t('card.blank')}</td></tr>`}</table>${msg}`;
}
