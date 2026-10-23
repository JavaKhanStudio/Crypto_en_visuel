// r451: a print list for tests/print_lab.py, read by lab/print/?ep=deux-generaux&assets=tests/print/shape-assets.js.
// It uses every field of the list shape on 1.1's own builders, so the test proves each one without
// touching an episode's real list (Simon's notes on 1.1 are r453's). Not an episode's list: the
// checked date below is a fixture, never Simon's word.
import { buildRider } from '../../lib/messenger.js';

const mesh = (o, type, test = () => true) => { let m; o.traverse(c => { if (!m && c.isMesh && c.geometry.type === type && test(c.geometry.parameters)) m = c; }); return m; };

export const ASSETS = [
  { id: 'shape-rider', label: "Alice's messenger: no cape, a longer scroll, the rider apart from his horse", kind: 'figure', size: { h: 90 },
    get: () => buildRider('a'), omit: (d, o) => [o.userData.beacon],
    strip: (d, o) => ({ cape: o.userData.cape }),
    scale: (d, o) => ({ scroll: [o.userData.scroll, [1, 1, 1.5]] }),
    bodies: (d, o) => ({ rider: [mesh(o, 'CylinderGeometry', p => p.radiusTop === .35), mesh(o, 'SphereGeometry'), mesh(o, 'ConeGeometry'), o.userData.scroll] }) },
  { id: 'shape-checked', label: 'A soldier, checked (a fixture date)', kind: 'figure', size: { h: 25 }, checked: '2026-10-23',
    get: d => new d.THREE.Mesh(new d.THREE.ConeGeometry(.6, 2, 6), new d.THREE.MeshStandardMaterial({ color: 0x4da3ff })) },
];
