// The sandbox: Alice's and Bob's passwords, how the site stores them (MD5 without salt, MD5 with
// a salt, bcrypt rounds=12), the sign-ups, then Eve steals the database: she looks it up in her
// table, then works out how long trying every password of the same shape would take her.
// bcrypt runs for real, in a worker (sel/js/worker.js), and the stopwatch shows its real time.
import { t, onLang, num, dec } from './i18n.js';
import { saltString } from './hash.js';
import { USERS, LIST, RATE } from './data.js';
import { dur } from './stage.js';
import { sfx } from '../../lib/sound.js';

const $ = id => document.getElementById(id);
const SLIDE = USERS.map(u => u.salt);
const ALPHA = 'abcdefghijklmnopqrstuvwxyz0123456789';

// the worker, and a promise per message
let worker = null, seq = 0; const waiting = new Map();
function ask(msg) {
  if (!worker) { worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' }); worker.onmessage = ({ data }) => { waiting.get(data.id)?.(data); waiting.delete(data.id); }; }
  return new Promise(res => { const id = ++seq; waiting.set(id, res); worker.postMessage({ ...msg, id }); });
}

// how many symbols a password draws from: lowercase, uppercase, digits, the rest
export function symbols(pw) {
  let n = 0;
  if (/[a-z]/.test(pw)) n += 26;
  if (/[A-Z]/.test(pw)) n += 26;
  if (/[0-9]/.test(pw)) n += 10;
  if (/[^a-zA-Z0-9]/.test(pw)) n += 33;
  return n;
}

export function initSandbox(ctx) {
  const { stage, rig, instant } = ctx;
  let busy = false, active = false, phase = 'clear', salts = [...SLIDE], measured = '', note = '', report = null;

  const store = () => document.querySelector('input[name="sb-store"]:checked').value;
  const pws = () => [$('sb-pa').value, $('sb-pb').value];

  function render() {
    for (const id of ['sb-pa', 'sb-pb']) $(id).disabled = busy || phase !== 'clear';
    document.querySelectorAll('input[name="sb-store"]').forEach(r => r.disabled = busy || phase !== 'clear');
    $('sb-newsalt').disabled = busy || phase !== 'clear' || store() !== 'salt';
    $('sb-signup').disabled = busy || phase !== 'clear' || pws().some(p => !p);
    $('sb-steal').disabled = busy || phase !== 'signed';
    $('sb-reset').disabled = busy; $('sb-measure').disabled = busy;
    const rows = [];
    if (store() === 'salt') rows.push(`${t('sb.salts')} <b>${salts.join(', ')}</b>`);
    if (pws().some(p => !p)) rows.push(t('sb.empty'));
    if (note) rows.push(note);
    if (report) rows.push(...report());
    if (!busy && phase === 'clear' && pws().every(Boolean)) rows.push(t('sb.ready'));
    if (!busy && phase === 'signed') rows.push(t('sb.signed'));
    if (measured) rows.push(measured);
    $('sb-status').innerHTML = rows.join('<br>');
  }

  function reset() {
    phase = 'clear'; note = ''; report = null;
    stage.speed = instant ? 50 : 1;
    const fn = store() === 'bcrypt' ? 'bcrypt' : 'md5';
    stage.apply({ machine: fn, base: { fn, rows: [] }, table: { kind: 'sel', rows: [] } });
    render();
  }

  async function signup() {
    if (busy || phase !== 'clear') return;
    busy = true; render();
    try {
      const mode = store(), fn = mode === 'bcrypt' ? 'bcrypt' : 'md5';
      stage.st.table = { kind: fn === 'bcrypt' ? 'slow' : 'sel', rows: mode === 'salt' ? [['@head.salt']] : fn === 'md5' ? [['@head.nosalt']] : [] };
      rig.fly('sbA');
      for (const [i, u] of USERS.entries()) {
        const pw = pws()[i];
        let opts = {};
        if (fn === 'bcrypt') {
          note = t('sb.computing', { u: u.u }); render();
          const r = await ask({ op: 'bcrypt', pw, setting: saltString(crypto.getRandomValues(new Uint8Array(16)), 12) });
          opts = { bstr: r.s, watch: r.ms / 1000 }; note = '';
        }
        if (!await stage.signup(u.u, pw, mode === 'salt' ? salts[i] : null, fn, opts)) return;
      }
      rig.fly('sbMid');
      const h = stage.st.base.rows.map(r => r.hash);
      if (h[0] === h[1]) await stage.same();
      phase = 'signed';
    } finally { busy = false; render(); }
  }

  async function steal() {
    if (busy || phase !== 'signed') return;
    busy = true; render();
    try {
      rig.fly('sbB');
      if (!await stage.steal()) return;
      if (!await stage.lookup()) return;
      const fn = store() === 'bcrypt' ? 'bcrypt' : 'md5', rows = stage.st.copy.rows;
      // what Eve gets, per user; a function, so that it follows a change of language
      report = () => [...(rows[0].hash === rows[1].hash ? [t('sb.same')] : []), ...USERS.map((u, i) => {
        const pw = pws()[i], r = rows[i];
        if (r.found) return t('sb.found', { u: u.u, w: esc(r.found) });
        if (LIST.some(([w]) => w === pw)) return t('sb.inList', { u: u.u, w: esc(pw) });
        const n = symbols(pw), space = n ** [...pw].length;
        return t('sb.space', { u: u.u, n, l: [...pw].length, s: big(space), r: num(RATE[fn]), d: dur(space / RATE[fn]) });
      })];
      if (!await stage.counter(fn)) return;
      phase = 'done';
    } finally { busy = false; render(); }
  }

  async function measure() {
    if (busy) return;
    busy = true; measured = t('sb.measuring'); render();
    try {
      const b = await ask({ op: 'bcrypt', pw: 'password', setting: saltString(crypto.getRandomValues(new Uint8Array(16)), 12) });
      const m = await ask({ op: 'md5' });
      measured = t('sb.measured', { b: t('sec', { s: dec(b.ms / 1000) }), m: num(m.perSecond) });
      sfx.win();
    } finally { busy = false; render(); }
  }

  $('sb-pa').value = $('sb-pb').value = 'password';
  for (const id of ['sb-pa', 'sb-pb']) $(id).oninput = () => { if (!busy) reset(); };
  document.querySelectorAll('input[name="sb-store"]').forEach(r => r.onchange = () => { if (!busy) { sfx.click(); reset(); } });
  $('sb-newsalt').onclick = () => { if (busy) return; sfx.click(); salts = salts.map(() => Array.from(crypto.getRandomValues(new Uint8Array(5)), x => ALPHA[x % 36]).join('')); reset(); };
  $('sb-signup').onclick = signup;
  $('sb-steal').onclick = steal;
  $('sb-reset').onclick = () => { if (!busy) { sfx.click(); salts = [...SLIDE]; reset(); } };
  $('sb-measure').onclick = measure;
  onLang(() => { if (active) render(); });

  return {
    enter: () => { active = true; reset(); rig.fly('sbA'); },
    leave: () => { active = false; stage.speed = instant ? 50 : 1; },
    signup, steal, measure, reset, state: () => ({ busy, phase, report, measured, salts }),
  };
}
// a big count: 2,8 × 10^14, or the number itself when it is small
function big(n) { if (n < 1e6) return num(n); const e = Math.floor(Math.log10(n)); return `${dec(n / 10 ** e, 1)} × 10^${e}`; }
const esc = s => s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
