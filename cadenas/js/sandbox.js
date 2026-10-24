// The sandbox: lock Alice's box (or not), send it, let Eve grab it (or not), and try
// to open it as Alice, Eve or Bob. Only Bob's key opens Bob's padlock, unless Eve stole it.
import { t, raw } from './i18n.js';
import { sfx } from '../../ficelle/lib/sound.js';

const $ = id => document.getElementById(id);

export function initSandbox(ctx) {
  const { stage, rig, toast } = ctx;
  let busy = false;

  async function act(fn) {
    if (busy) return;
    busy = true; render();
    try { await fn(); } finally { busy = false; render(); }
  }

  function render() {
    const st = stage.st;
    if (!st) return;
    $('sb-status').innerHTML = `<b>${raw('sb.where')[st.box]}</b><br>${st.lid ? t('sb.opened') : st.locked ? t('sb.locked') : t('sb.unlocked')}`;
    for (const id of ['sb-lock', 'sb-send', 'sb-try-a', 'sb-try-e', 'sb-try-b', 'sb-reset']) $(id).disabled = busy;
  }

  function reset() {
    stage.apply({ dist: true, stolen: $('sb-stolen').checked });
    rig.fly('overview'); render();
  }

  $('sb-lock').onclick = () => act(async () => {
    const st = stage.st;
    if (st.lid) return toast(t('sb.isOpen'));
    if (st.locked) return toast(t('sb.already'));
    if (st.box !== 'a') return toast(t('sb.gone'));
    await rig.fly('aliceClose', 1.4);
    await stage.lockBox();
  });

  $('sb-send').onclick = () => act(async () => {
    const st = stage.st;
    if (st.box === 'b') return toast(t('sb.atBob'));
    const to = st.box === 'a' && $('sb-intercept').checked ? 'e' : 'b';
    rig.chase(stage.courier);
    await stage.carry(st.box, to);
    await rig.fly(to === 'e' ? 'eveClose' : 'bobClose', 1.4);
  });

  const tryOpen = who => act(async () => {
    const st = stage.st;
    if (st.box !== who) return toast(raw('sb.notHere')[who]);
    if (st.lid) return toast(t('sb.isOpen'));
    await rig.fly({ a: 'aliceClose', e: 'eveClose', b: 'bobClose' }[who], 1.2);
    if (!st.locked) {                      // nothing to open: just lift the lid
      await stage.tween(.8, k => stage.chest.userData.setLid(k)); st.lid = 1;
      return toast(t('sb.openNoLock'), 4500);
    }
    if (who === 'b') { await stage.openWith(stage.bobKey, 'b'); sfx.win(); return toast(t('sb.okB'), 4500); }
    if (who === 'e' && st.stolen) { await stage.openWith(stage.bobKey2, 'e'); sfx.lose(); return toast(t('sb.okE'), 5500); }
    await stage.tryFail(who, { withLock: who === 'e' });
    toast(t(who === 'a' ? 'sb.failA' : 'sb.failE'), 4500);
  });
  $('sb-try-a').onclick = () => tryOpen('a');
  $('sb-try-e').onclick = () => tryOpen('e');
  $('sb-try-b').onclick = () => tryOpen('b');
  $('sb-reset').onclick = () => { if (!busy) reset(); };
  $('sb-stolen').onchange = () => { if (!busy) reset(); };

  return { enter: reset, render };
}
