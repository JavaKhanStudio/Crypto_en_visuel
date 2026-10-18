// The sandbox's measuring worker: bcrypt takes a quarter of a second or more, so it runs here,
// off the page's thread, and the 3D keeps moving. Messages: { op: 'bcrypt', pw, setting } ->
// { s, ms }; { op: 'md5' } -> { perSecond }, how many MD5 this browser computes in a second.
import { bcrypt, md5 } from './hash.js';

bcrypt('warm-up', '$2b$04$' + '.'.repeat(22));     // computes Blowfish's tables once, outside any timing

onmessage = ({ data: m }) => {
  if (m.op === 'bcrypt') {
    const t0 = performance.now(), s = bcrypt(m.pw, m.setting);
    postMessage({ id: m.id, s, ms: performance.now() - t0 });
  } else if (m.op === 'md5') {
    let n = 0; const t0 = performance.now();
    while (performance.now() - t0 < 500) for (let i = 0; i < 200; i++, n++) md5('password' + n);
    postMessage({ id: m.id, perSecond: n / ((performance.now() - t0) / 1000) });
  }
};
