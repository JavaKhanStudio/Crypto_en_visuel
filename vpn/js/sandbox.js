// The sandbox: turn the VPN and HTTPS on or off, put Eve at the café, at the provider, at the VPN
// (in Victor's place) or at Bob's (in his), let her change a bit on the way, and send a request:
// her tag and the panel say what she reads there, and whether the packet got through.
import { t, raw, onLang } from './i18n.js';
import { sfx } from '../../ficelle/lib/sound.js';

const $ = id => document.getElementById(id);
const PLACES = ['cafe', 'isp', 'vpn', 'bob'];

export function initSandbox(ctx) {
  const { stage, rig, instant } = ctx;
  const pick = { tunnel: true, https: true, eve: 'cafe', flip: false };
  let busy = false, result = null;
  // a bit can only be changed inside the tunnel, where Eve stands before the VPN opens it
  const canFlip = () => pick.tunnel && (pick.eve === 'cafe' || pick.eve === 'isp');

  function buttons() {
    const sb = raw('sb');
    const groups = [['sb-vpn', [true, false], 'tunnel', x => x ? sb.on : sb.off], ['sb-https', [true, false], 'https', x => x ? sb.on : sb.off],
      ['sb-eve', PLACES, 'eve', x => sb.at[x]]];
    for (const [id, list, field, name] of groups) {
      const el = $(id); el.innerHTML = '';
      for (const val of list) {
        const b = document.createElement('button'); b.textContent = name(val);
        b.classList.toggle('on', pick[field] === val); b.disabled = busy;
        b.onclick = () => { if (busy) return; pick[field] = val; sfx.click(); reset(); };
        el.appendChild(b);
      }
    }
    $('sb-flip').checked = pick.flip && canFlip(); $('sb-flip').disabled = busy || !canFlip();
  }

  function render() {
    buttons();
    for (const id of ['sb-send', 'sb-reset']) $(id).disabled = busy;
    const st = $('sb-status');
    if (!result) { st.textContent = busy ? '…' : pick.flip && !canFlip() ? t('sb.flipNo') : t('sb.ready'); return; }
    st.innerHTML = `${t('sb.seen')}<br><b>${result.lines.join('<br>')}</b><br>${result.dropped ? t('sb.dropped') : t('sb.arrived')}`;
  }

  function state() { return { tunnel: pick.tunnel, https: pick.https, eve: pick.eve, card: 'sees' }; }
  function reset() {
    result = null; stage.speed = instant ? 50 : 1.3;
    stage.apply(state()); rig.fly('sandbox'); render();
  }

  async function send() {
    if (busy) return;
    busy = true; result = null; render();
    try {
      stage.apply(state());
      if (!await stage.send(['e'], { flip: pick.flip && canFlip() })) return;
      result = { lines: stage.lines('e').map(([text]) => text), dropped: stage.st.dropped, read: stage.st.read.includes('e') };
      result.dropped ? sfx.lose() : sfx.win();
    } finally { busy = false; render(); }
  }

  $('sb-send').onclick = send;
  $('sb-reset').onclick = () => { if (!busy) { Object.assign(pick, { tunnel: true, https: true, eve: 'cafe', flip: false }); reset(); } };
  $('sb-flip').onchange = () => { pick.flip = $('sb-flip').checked; render(); };
  onLang(() => { if (!busy) reset(); });

  return { enter: reset, render, result: () => result, pick, leave: () => { stage.speed = instant ? 50 : 1; } };
}
