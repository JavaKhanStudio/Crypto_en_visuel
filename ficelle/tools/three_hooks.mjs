// Lets node resolve the episodes' bare 'three' imports to the shared vendor copy (the browser's importmap).
const root = new URL('../vendor/three/', import.meta.url).href;
export async function resolve(spec, ctx, next) {
  if (spec === 'three') return { url: root + 'three.module.min.js', shortCircuit: true };
  if (spec.startsWith('three/addons/')) return { url: root + 'addons/' + spec.slice(13), shortCircuit: true };
  return next(spec, ctx);
}
