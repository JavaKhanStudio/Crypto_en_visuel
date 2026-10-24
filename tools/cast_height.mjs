// r644: the height of each lib/cast.js figure against an episode's own person() (before it is deleted), so a
// roll-out keeps the stage's scale: node tools/cast_height.mjs [<ep>/js/props.js] [kind ...]
import { register } from 'node:module';
register('../ficelle/tools/three_hooks.mjs', import.meta.url);
const THREE = await import('three');
const { person } = await import('../ficelle/lib/cast.js');
const args = process.argv.slice(2), file = args.find(a => a.endsWith('.js')), kinds = args.filter(a => !a.endsWith('.js'));
const old = file ? (await import('../' + file)).person : null;
const box = f => { f.updateMatrixWorld(true); return new THREE.Box3().setFromObject(f); };
for (const k of kinds.length ? kinds : ['a', 'b', 'e', 'n', 'g', 'v', 'i']) {
  const n = box(person(k)), o = old && box(old(k));
  console.log(k, 'cast', n.min.y.toFixed(2), '..', n.max.y.toFixed(2), o ? `  own ${o.min.y.toFixed(2)} .. ${o.max.y.toFixed(2)}` : '');
}
