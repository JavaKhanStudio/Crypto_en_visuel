// r553: the scytale's printed cradles with its thickest stick (5 letters a turn) resting in them, for
// tools/print_shot.py --ep scytale --assets tests/print/scytale-cradles-fit.js --asset cradles-fit:
// the cradles reshaped as scytale/js/print-assets.js prints them, the stick on the posts' tops,
// so a shot shows whether the rod fits the forks. A check, not an episode's list.
import { stick } from '../../scytale/js/props.js';
import { deep } from '../../scytale/js/print-assets.js';

export const ASSETS = [
  { id: 'cradles-fit', label: "The cradles as printed, Eve's 5-a-turn stick resting in them", kind: 'prop', size: { max: 70 },
    get: d => {
      const g = new d.THREE.Group(), c = d.stage.sticks.eG.userData.cradles.clone(), s = stick(5);
      c.position.set(0, 0, 0);
      s.position.y = c.children[0].geometry.parameters.height + s.userData.r;   // on the posts' tops
      g.add(c, s); g.userData.cradles = c; return g;
    },
    scale: (d, o) => deep(d, o.userData.cradles) },
];
