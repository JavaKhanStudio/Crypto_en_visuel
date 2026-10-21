// The sandbox: pick the order Eve wants through and the guard on duty (== or compare_digest),
// then launch the timing attack. With ==, Eve times each badge and recovers the HMAC letter by
// letter until the gate opens; with compare_digest the sixteen bars stay equal and she learns
// nothing. The HMACs are real (garde/js/hmac.js), the same the story uses.
import { t, onLang } from './i18n.js';
import { MSG_E } from './data.js';
import { sfx } from '../../lib/sound.js';

const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

export function initSandbox(ctx) {
  const { stage, rig, instant } = ctx;
  let busy = false, active = false, report = null;

  const guard = () => document.querySelector('input[name="sb-guard"]:checked').value;
  const msg = () => $('sb-msg').value.trim();

  function render() {
    $('sb-msg').disabled = busy;
    document.querySelectorAll('input[name="sb-guard"]').forEach(r => r.disabled = busy);
    $('sb-run').disabled = busy || !msg();
    $('sb-reset').disabled = busy;
    const rows = [];
    if (!msg()) rows.push(t('sb.empty'));
    if (report) rows.push(report());
    rows.push(t('sb.budget'));
    $('sb-status').innerHTML = rows.join('<br>');
  }

  function reset() {
    report = null; stage.speed = instant ? 50 : 1;
    stage.apply({ guard: guard(), msg: msg() || MSG_E, prefix: '', table: { kind: guard() === 'cd' ? 'safe' : 'hunt' } });
    render();
  }

  async function run() {
    if (busy || !msg()) return;
    busy = true; report = null; render();
    try {
      const g = guard();
      stage.apply({ guard: g, msg: msg(), prefix: '', table: { kind: g === 'cd' ? 'safe' : 'hunt' } });
      rig.fly('sbMid');
      if (!await stage.round({ full: 4 })) return;                 // the first position, every bar visible
      if (g === 'eq') {
        rig.fly('sbA');
        if (!await stage.finish()) return;                         // the rest, and the gate
        const p = stage.st.prefix.slice(0, 10);
        report = () => t('sb.cracked', {}).replace('{n}', stage.st.tries).replace('{p}', esc(p));
      } else {
        report = () => t('sb.safe', {}).replace('{n}', stage.st.tries);
      }
      sfx.win();
    } finally { busy = false; render(); }
  }

  $('sb-msg').value = MSG_E;
  $('sb-msg').oninput = () => { if (!busy) reset(); };
  document.querySelectorAll('input[name="sb-guard"]').forEach(r => r.onchange = () => { if (!busy) { sfx.click(); reset(); } });
  $('sb-run').onclick = run;
  $('sb-reset').onclick = () => { if (!busy) { sfx.click(); reset(); } };
  onLang(() => { if (active) render(); });

  return {
    enter: () => { active = true; reset(); rig.fly('sbMid'); },
    leave: () => { active = false; stage.speed = instant ? 50 : 1; },
    run, reset, state: () => ({ busy, report }),
  };
}
