// The sandbox: pick Alice's and Bob's secret colours, let Eve watch or sit in the middle,
// let Bob sign his part or not, and run the whole exchange. The status says who ends up
// with which colour, and what Eve knows.
import { t, raw, onLang } from './i18n.js';
import { cssOf } from './paint.js';
import { sfx } from '../../lib/sound.js';

const $ = id => document.getElementById(id);
const CHOICES = { alice: ['R', 'B', 'W'], bob: ['B', 'R', 'W'] };

export function initSandbox(ctx) {
  const { stage, rig, instant } = ctx;
  const pick = { alice: 'R', bob: 'B' };
  let busy = false, result = null;

  const name = r => raw('paint')[r] ?? t('paint.mix');
  const dot = r => `<span class="dot" style="background:${cssOf(r)}"></span>`;

  function swatches() {
    for (const who of ['alice', 'bob']) {
      const el = $('sb-' + who); el.innerHTML = '';
      for (const r of CHOICES[who]) {
        const b = document.createElement('button'); b.innerHTML = dot(r) + name(r);
        b.classList.toggle('on', pick[who] === r); b.disabled = busy;
        b.onclick = () => { if (busy) return; pick[who] = r; sfx.click(); reset(); };
        el.appendChild(b);
      }
    }
  }

  function render() {
    swatches();
    for (const id of ['sb-run', 'sb-reset']) $(id).disabled = busy;
    for (const el of document.querySelectorAll('#sandbox input')) el.disabled = busy;
    if (!result) { $('sb-status').textContent = busy ? '…' : t('sb.ready'); return; }
    const r = result, lines = [];
    if (r.refused) lines.push(`<b>${t('sb.refused')}</b>`);
    else {
      lines.push(`${t('sb.aliceHas')} ${dot(r.a)}<b>${name(r.a)}</b> · ${t('sb.bobHas')} ${dot(r.b)}<b>${name(r.b)}</b>`);
      lines.push(r.a === r.b ? t('sb.same') : t('sb.differ'));
      lines.push(`${t('sb.eveHas')} ${r.eve.map(x => dot(x) + name(x)).join(', ')}`);
      lines.push(`<b>${r.middle ? t('sb.eveKnowsBoth') : t('sb.eveBlind')}</b>`);
    }
    $('sb-status').innerHTML = lines.join('<br>');
  }

  function state() {
    const middle = $('sb-middle').checked, sign = $('sb-sign').checked;
    const pots = {
      aJ: ['a', 0, 'J'], eJ: ['e', 0, 'J'], bJ: ['b', 0, 'J'],
      aS: ['a', 2, pick.alice, { secret: true }], bS: ['b', 2, pick.bob, { secret: true }],
      aM: ['a', 1, ''], bM: ['b', 1, ''],
    };
    if (middle) pots.eN = ['e', 2, 'N', { secret: true }];
    return { pots, cert: sign };
  }

  function reset() {
    result = null; stage.speed = instant ? 50 : 1.7;
    stage.apply(state()); rig.fly('overview'); render();
  }

  async function run() {
    if (busy) return;
    busy = true; result = null; render();
    try { await exchange(); } finally { busy = false; render(); }
  }

  async function exchange() {
    const middle = $('sb-middle').checked, sign = $('sb-sign').checked, st = stage;
    st.apply(state()); const tok = st.token, live = () => st.live(tok);
    await rig.fly('aliceClose', 1.2);
    await st.pour('aJ', 'aM', 'a'); await st.pour('aS', 'aM', 'a'); if (!live()) return;
    await rig.fly('bobClose', 1.2);
    await st.pour('bJ', 'bM', 'b'); await st.pour('bS', 'bM', 'b'); if (!live()) return;
    if (sign) { st.pot('bM').userData.setSeal('bob'); st.save(st.pot('bM')); }
    await rig.fly('road', 1.4);
    if (!middle) {
      await Promise.all([
        st.carry(st.pot('aM'), 'a', 'b', { courier: 0, slot: 1, peek: () => st.copy('aM', 'eO', 3) }),
        st.carry(st.pot('bM'), 'b', 'a', { courier: 1, slot: 1, peek: () => st.copy('bM', 'eV', 5) }),
      ]);
      if (!live()) return;
      if (sign) { await rig.fly('aliceClose', 1.2); await st.check('bM', 'a'); }
      await rig.fly('wide', 1.4);
      await Promise.all([st.pour('aS', 'bM', 'a'), st.pour('bS', 'aM', 'b')]); if (!live()) return;
      result = { a: st.pot('bM').userData.recipe, b: st.pot('aM').userData.recipe, eve: ['J', st.pot('eO').userData.recipe, st.pot('eV').userData.recipe], middle };
    } else {
      await Promise.all([st.carry(st.pot('aM'), 'a', 'e', { courier: 0, slot: 3 }), st.carry(st.pot('bM'), 'b', 'e', { courier: 1, slot: 5 })]);
      if (!live()) return;
      await rig.fly('eveClose', 1.2);
      await st.empty('eK1', 'e', 1); await st.empty('eK2', 'e', 4);
      for (const [s, d] of [['eJ', 'eK1'], ['eJ', 'eK2'], ['eN', 'eK1'], ['eN', 'eK2']]) await st.pour(s, d, 'e');
      if (!live()) return;
      // Eve cannot make Bob's seal: the best she can do is her own
      if (sign) { st.pot('eK2').userData.setSeal('fake'); st.save(st.pot('eK2')); }
      await rig.fly('road', 1.4);
      await Promise.all([st.carry(st.pot('eK1'), 'e', 'b', { courier: 0, slot: 1 }), st.carry(st.pot('eK2'), 'e', 'a', { courier: 1, slot: 1 })]);
      if (!live()) return;
      if (sign) {
        await rig.fly('aliceClose', 1.2); await st.check('eK2', 'a');
        result = { refused: true }; sfx.win(); return;
      }
      await rig.fly('wide', 1.4);
      await Promise.all([st.pour('aS', 'eK2', 'a'), st.pour('bS', 'eK1', 'b'), st.pour('eN', 'aM', 'e').then(() => st.pour('eN', 'bM', 'e'))]);
      if (!live()) return;
      sfx.lose();
      result = { a: st.pot('eK2').userData.recipe, b: st.pot('eK1').userData.recipe, eve: [st.pot('aM').userData.recipe, st.pot('bM').userData.recipe], middle };
    }
  }

  $('sb-run').onclick = run;
  $('sb-reset').onclick = () => { if (!busy) reset(); };
  for (const el of document.querySelectorAll('#sandbox input')) el.onchange = () => { if (!busy) reset(); };
  onLang(render);

  return { enter: reset, render, result: () => result, leave: () => { stage.speed = instant ? 50 : 1; } };
}
