// The card in the top right corner: the slide « HMAC - La timing attack ». It always shows the
// two code paths (the dangerous == and the constant-time compare_digest) and names the guard on
// duty; underneath, a line that follows the story — the explanation, Eve's recovered prefix and
// her try count, or the recap.
import { raw, num } from './i18n.js';

const el = document.getElementById('card');
const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

export function renderCard(stage) {
  const st = stage.st, kind = st.table.kind, C = raw('card');
  const bad = `<pre class="code${st.guard === 'eq' ? ' on' : ''}">${esc(C.code.bad)}</pre>`;
  const good = `<pre class="code${st.guard === 'cd' ? ' on' : ''}">${esc(C.code.good)}</pre>`;
  let extra = `<p class="lead">${C.lead[kind] ?? C.lead.code}</p>`;
  if (kind === 'hunt') {
    const full = st.prefix, shown = full.length > 20 ? full.slice(0, 20) : full;
    const p = full ? esc(shown) + (full.length > 20 || full.length < 64 ? '…' : '') : '—';
    extra += `<p class="hunt"><span class="found">${C.found.replace('{p}', `<b class="hex">${p}</b>`)}</span>
      <span class="essais">${C.essais.replace('{n}', num(st.tries))}</span></p>
      <p class="budget">${C.budget}</p>`;
  } else if (kind === 'safe') {
    extra += `<p class="budget">${C.equal}</p>`;
  }
  el.innerHTML = `<h3>${C.title}</h3><p class="where">${C.now[st.guard]}</p>${bad}${good}${extra}`;
}
