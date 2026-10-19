// Free play: every lever of the protocol on one panel.
import { t } from './i18n.js';

const $ = id => document.getElementById(id);

export function initSandbox(ctx) {
  const { sim, rig } = ctx;
  let follow = true;
  const sendAndMaybeFollow = m => { if (m && follow) rig.chase(m.obj); return m; };

  $('sb-send-a').onclick = () => sendAndMaybeFollow(sim.send('a'));
  $('sb-send-b').onclick = () => { const m = sim.send('b'); if (!m) ctx.toast(t('m.nothingToAck')); sendAndMaybeFollow(m); };
  $('sb-auto').onclick = async () => {
    $('sb-auto').disabled = true;
    const r = await sim.auto(12);
    if (r === 'lost') ctx.toast(t('sb.autoStop'));
    $('sb-auto').disabled = false;
  };
  $('sb-burst').onclick = async () => {
    const from = sim.level % 2 === 0 ? 'a' : 'b';
    rig.fly('both', 1.6);
    const res = await sim.burst(from, 10);
    if (res) ctx.toast(t('m.burstResult', { ok: res.filter(r => r === 'delivered').length }));
  };
  $('sb-p').oninput = e => { sim.p = e.target.value / 100; render(); };
  $('sb-next-caught').onchange = e => sim.nextCaught = e.target.checked;
  $('sb-dawn').onclick = async () => { $('sb-dawn').disabled = true; await ctx.dawn(+$('sb-rule').value); $('sb-dawn').disabled = false; };
  $('sb-reset').onclick = () => { ctx.resetWorld(); sim.reset(); rig.fly('overview'); };
  $('sb-follow').onclick = () => { follow = !follow; $('sb-follow').classList.toggle('active', follow); if (!follow) rig.stopFollow(); };
  $('sb-follow').classList.add('active');

  function render() {
    const p = Math.round(sim.p * 100);
    $('sb-p-out').textContent = `${p} %`;
    const burst = 1 - Math.pow(sim.p, 10);
    $('sb-stats').innerHTML = t('sb.stats', { ...sim.stats, p, burst: (burst * 100).toFixed(burst > .999 ? 3 : 1) + ' %' });
  }
  return {
    enter() {
      ctx.resetWorld(); sim.reset();
      sim.p = $('sb-p').value / 100; sim.nextCaught = $('sb-next-caught').checked;
      rig.setOrbit(0); rig.fly('overview'); render();
    },
    render,
    clearFlag() { $('sb-next-caught').checked = false; },
  };
}
