// r330 (r187, Simon 21 Oct: « Bob should stay Bob, Alice stay Alice … clearly identifiable traits,
// that we can add a disguise on »): the cast of every visuel, built by ONE function. It was 11 copies
// of person(kind) in <ep>/js/props.js, in 8 drifted versions; this is their union.
//     import { person } from '../../lib/cast.js';
//     person('a')                                  // Alice as the episodes draw her today
//     person('e', { disguise: 'roman' })           // Eve in the scytale's Rome
//     person('b', { disguise: 'wartime', scale: 5.3, hand: 'key' })
// A person is two layers:
//   - the KIND, what never changes whatever the setting: the body, the cloth colour, and one or two
//     signature traits in the team colour (CAST below). A disguise cannot remove them;
//   - the DISGUISE, three slots filled per setting: head (a hat or hair), body (over the robe) and
//     hand (a held item). DISGUISES names a setting's costume for each kind; any slot can also be
//     given alone ({ head: 'beret' }), and wins over the disguise's.
// One unit is one metre at scale 1 (a person is 3 m tall at 1, as the episodes drew them); the
// enigma family, garde and pingouin draw at 5.3. userData: head, arms, slots { head, body, hand }, kind.
import * as THREE from 'three';

export const TEAM = { a: 0x4da3ff, b: 0xffc24d, e: 0xff3347, g: 0xe8c45a, v: 0x5fd18f, n: 0xc9b48a, i: 0xb9c3d6 };
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: .6, flatShading: true, ...o });
const dark = mat(0x15110c, { roughness: 1 });
const mesh = (geo, m, x = 0, y = 0, z = 0, shadow = false) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = shadow; return o; };

// ---------- the kinds: what never changes ----------
// cloth: the robe and arms; hair: drawn when the head slot leaves the head bare; sign(g, c): the
// signature traits, in the team colour c.
export const CAST = {
  a: { name: 'Alice', cloth: 0x2a5ea8, hair: 'bun',
    sign(g, c) {   // the blue scarf
      const scarf = mesh(new THREE.TorusGeometry(.4, .1, 8, 16), mat(c), 0, 2.12); scarf.rotation.x = Math.PI / 2; g.add(scarf);
    } },
  b: { name: 'Bob', cloth: 0x6b4a2b, hair: 'short',
    sign(g, c) {   // the gold belt
      const belt = mesh(new THREE.TorusGeometry(.62, .06, 6, 20), mat(c, { metalness: .5 }), 0, 1.55); belt.rotation.x = Math.PI / 2; g.add(belt);
    } },
  e: { name: 'Eve', cloth: 0x7a1424, hair: 'short', eyes: false,
    sign(g) {      // the black eye mask, wide white eyes behind it
      const mask = mesh(new THREE.TorusGeometry(.42, .075, 6, 20, Math.PI), dark, 0, 2.6); mask.rotation.x = Math.PI / 2; g.add(mask);
      for (const x of [-.14, .14]) { g.add(mesh(new THREE.SphereGeometry(.07, 10, 8), mat(0xfaf6ee), x, 2.6, .45)); g.add(mesh(new THREE.SphereGeometry(.04, 8, 6), dark, x, 2.6, .51)); }
    } },
  n: { name: 'messenger', cloth: 0x8a6a3a, hair: 'short', sign() {} },
  g: { name: 'guard', cloth: 0x1f2a44, hair: 'short',
    sign(g, c) {   // a gold badge on the chest, a moustache
      const star = mesh(new THREE.CircleGeometry(.14, 5), mat(c, { metalness: .8, roughness: .2, side: THREE.DoubleSide }), .22, 1.85, .56); star.rotation.x = -.25; g.add(star);
      const tash = mesh(new THREE.CapsuleGeometry(.05, .22, 4, 8), mat(0x3a2414), 0, 2.47, .4); tash.rotation.z = Math.PI / 2; g.add(tash);
    } },
  v: { name: 'Victor', cloth: 0x1f5a3c, hair: 'dark',
    sign(g, c) {   // the headset, the server room's operator
      const band = mesh(new THREE.TorusGeometry(.46, .045, 6, 20, Math.PI), mat(0x222428), 0, 2.6); g.add(band);
      for (const x of [-.46, .46]) { const ear = mesh(new THREE.CylinderGeometry(.13, .13, .1, 12), mat(c), x, 2.58); ear.rotation.z = Math.PI / 2; g.add(ear); }
    } },
  i: { name: 'customer', cloth: 0x55607a, hair: 'short', sign() {} },
};

// ---------- the slots: what a setting dresses ----------
// head items sit on a head of radius .42 centred at y 2.55
const HEAD = {
  bun(g) { const hair = mat(0x6b3d1f);
    const cap = mesh(new THREE.SphereGeometry(.45, 16, 10, 0, Math.PI * 2, 0, Math.PI * .55), hair, 0, 2.6); cap.rotation.x = -.35; g.add(cap);
    g.add(mesh(new THREE.SphereGeometry(.2, 10, 8), hair, 0, 2.95, -.3)); },
  short(g) { g.add(mesh(new THREE.SphereGeometry(.44, 14, 8, 0, Math.PI * 2, 0, Math.PI * .45), mat(0x4a3424), 0, 2.6)); },
  dark(g) { g.add(mesh(new THREE.SphereGeometry(.44, 14, 8, 0, Math.PI * 2, 0, Math.PI * .4), mat(0x2b2118), 0, 2.6)); },
  flatCap(g) { const m = mat(0x3d2c1c);   // Bob's, today
    g.add(mesh(new THREE.CylinderGeometry(.46, .46, .16, 16), m, 0, 2.88)); g.add(mesh(new THREE.BoxGeometry(.5, .05, .35), m, 0, 2.82, .4)); },
  fedora(g) { const felt = mat(0x2a2a30), hat = new THREE.Group(); hat.position.y = 2.86; hat.rotation.x = .12; g.add(hat);   // Eve's, today (r65: not a pointed hood)
    hat.add(mesh(new THREE.CylinderGeometry(.74, .74, .05, 24), felt, 0, 0, 0, true));
    hat.add(mesh(new THREE.CylinderGeometry(.31, .41, .36, 16), felt, 0, .19, 0, true));
    hat.add(mesh(new THREE.CylinderGeometry(.415, .42, .1, 16), mat(0x9e1b2e), 0, .08)); },
  travellerHat(g) { const m = mat(0x6b5330);   // the messenger's broad hat
    g.add(mesh(new THREE.CylinderGeometry(.3, .38, .28, 14), m, 0, 2.98)); g.add(mesh(new THREE.CylinderGeometry(.75, .75, .05, 18), m, 0, 2.86)); },
  postCap(g) { g.add(mesh(new THREE.CylinderGeometry(.4, .44, .3, 14), mat(0x2f3a2e), 0, 2.9)); },   // the courier's
  peakedCap(g, c) { const navy = mat(0x15203a);   // the guard's
    g.add(mesh(new THREE.CylinderGeometry(.5, .44, .3, 16), navy, 0, 2.92)); g.add(mesh(new THREE.BoxGeometry(.6, .05, .32), mat(0x0b0f1c), 0, 2.8, .42));
    const band = mesh(new THREE.TorusGeometry(.47, .04, 6, 20), mat(c, { metalness: .7, roughness: .3 }), 0, 2.84); band.rotation.x = Math.PI / 2; g.add(band); },
  headphones(g) {   // enigma's Eve listens to the radio: over the fedora
    HEAD.fedora(g);
    const band = mesh(new THREE.TorusGeometry(.5, .04, 6, 20, Math.PI), mat(0x222222, { metalness: .6 }), 0, 2.6); band.rotation.x = -Math.PI / 2 - .5; g.add(band);
    for (const s of [-1, 1]) { const cup = mesh(new THREE.CylinderGeometry(.16, .16, .12, 14), mat(0x333333, { metalness: .5 }), s * .5, 2.6); cup.rotation.z = Math.PI / 2; g.add(cup); } },
  // new, for the prototype's settings
  laurel(g) { const leaf = mat(0x4f7a2e);   // Rome: a laurel wreath on the hair
    HEAD.short(g); const r = mesh(new THREE.TorusGeometry(.43, .05, 6, 22), leaf, 0, 2.78); r.rotation.x = Math.PI / 2; g.add(r);
    for (let k = 0; k < 14; k++) { const a = k / 14 * Math.PI * 2; const l = mesh(new THREE.SphereGeometry(.07, 6, 4), leaf, Math.cos(a) * .44, 2.8, Math.sin(a) * .44); l.scale.set(1, .6, 1.8); l.rotation.y = -a; g.add(l); } },
  palla(g) { const m = mat(0xe8e0cc);   // Rome: a veil over the bun (Alice)
    HEAD.bun(g); const v = mesh(new THREE.SphereGeometry(.5, 16, 10, 0, Math.PI * 2, 0, Math.PI * .5), m, 0, 2.6, -.16); v.rotation.x = -.95; g.add(v); },
  galea(g) { const iron = mat(0x9aa0a6, { metalness: .6, roughness: .4 });   // Rome: an iron helmet, a red crest (Eve as a legionary scout)
    g.add(mesh(new THREE.SphereGeometry(.47, 16, 10, 0, Math.PI * 2, 0, Math.PI * .5), iron, 0, 2.62));
    const crest = mesh(new THREE.BoxGeometry(.09, .28, .7), mat(0x9e1b2e), 0, 3.12); g.add(crest); },
  beret(g) { HEAD.bun(g); const b = mesh(new THREE.CylinderGeometry(.42, .46, .12, 18), mat(0x1b2f55), .06, 2.98); b.rotation.z = -.18; g.add(b); },   // 1940s
  officerCap(g) { const m = mat(0x4a4a32);   // 1940s
    g.add(mesh(new THREE.CylinderGeometry(.52, .44, .26, 16), m, 0, 2.95)); g.add(mesh(new THREE.BoxGeometry(.6, .05, .32), mat(0x1a1a12), 0, 2.82, .42)); },
  coif(g) { const m = mat(0x8d8f93, { metalness: .5, roughness: .5 });   // the saga: a mail coif (Bob)
    // open at the face (the gap is centred on +z): Bob's eyes must show
    g.add(mesh(new THREE.SphereGeometry(.47, 16, 10, Math.PI / 2 + .75, Math.PI * 2 - 1.5, 0, Math.PI * .7), m, 0, 2.58, -.02));
    const neck = mesh(new THREE.CylinderGeometry(.5, .56, .28, 16), m, 0, 2.18); g.add(neck); },
  circlet(g, c) { HEAD.bun(g); const r = mesh(new THREE.TorusGeometry(.44, .035, 6, 24), mat(c, { metalness: .7, roughness: .3 }), 0, 2.72); r.rotation.x = Math.PI / 2; g.add(r); },   // the saga: Alice
  chaperon(g) { const m = mat(0x2a2a30);   // the saga: Eve's round chaperon with its red band (round, never pointed: r65)
    const roll = mesh(new THREE.TorusGeometry(.38, .17, 10, 20), m, 0, 2.86); roll.rotation.x = Math.PI / 2; g.add(roll);
    g.add(mesh(new THREE.SphereGeometry(.36, 14, 8, 0, Math.PI * 2, 0, Math.PI * .5), m, 0, 2.88));
    const band = mesh(new THREE.TorusGeometry(.44, .05, 6, 22), mat(0x9e1b2e), 0, 2.78); band.rotation.x = Math.PI / 2; g.add(band); },
};
const BODY = {
  apron(g) { const a = mesh(new THREE.CylinderGeometry(.5, .86, 1.7, 10, 1, true, -.9, 1.8), mat(0x9b6a3a, { side: THREE.DoubleSide }), 0, .9); a.scale.set(1.04, 1, 1.04); g.add(a); },
  hood(g, c, cloth) { const h = mesh(new THREE.TorusGeometry(.42, .14, 8, 18), mat(cloth), 0, 2.15); h.rotation.x = Math.PI / 2; g.add(h); },   // Victor's hoodie
  toga(g) { const t = mesh(new THREE.TorusGeometry(.66, .16, 6, 24), mat(0xeee6d2), 0, 1.45); t.rotation.set(Math.PI / 2, .55, 0); t.scale.set(1, .82, 1); g.add(t); },   // Rome: a drape from the left shoulder across to the right hip
  cloak(g, c) { const k = mesh(new THREE.CylinderGeometry(.52, .95, 2.1, 12, 1, true, Math.PI * .65, Math.PI * .7), mat(new THREE.Color(c).multiplyScalar(.45), { side: THREE.DoubleSide }), 0, 1.07, -.02); g.add(k); },   // the saga
  trench(g) { const m = mat(0x8a7350); const t = mesh(new THREE.CylinderGeometry(.5, .92, 1.95, 10), m, 0, 1.0); g.add(t);   // 1940s
    for (const s of [-1, 1]) { const lap = mesh(new THREE.BoxGeometry(.18, .5, .05), m, s * .17, 1.85, .5); lap.rotation.z = s * .3; g.add(lap); } },
};
// held items, in front of the chest
const HAND = {
  key(g, c) { const m = mat(c, { metalness: .7, roughness: .3 });
    g.add(mesh(new THREE.TorusGeometry(.12, .035, 6, 14), m, .42, 1.35, .72)); g.add(mesh(new THREE.BoxGeometry(.05, .05, .34), m, .42, 1.35, .95)); },
  scroll(g) { const s = mesh(new THREE.CylinderGeometry(.08, .08, .5, 10), mat(0xeadbb4), .4, 1.35, .72); s.rotation.z = Math.PI / 2; g.add(s); },
  letter(g) { const l = mesh(new THREE.BoxGeometry(.42, .3, .03), mat(0xf3ecdc), .38, 1.4, .74); l.rotation.x = -.3; g.add(l); },
};
export const SLOTS = { head: Object.keys(HEAD), body: Object.keys(BODY), hand: Object.keys(HAND) };

// ---------- the settings ----------
// today: each kind as the episodes draw it now (the roll-out keeps them identical);
// the others: the prototype's proposals, for Simon to judge on lab/cast/.
export const DISGUISES = {
  today:    { a: {}, b: { head: 'flatCap', body: 'apron' }, e: { head: 'fedora' }, n: { head: 'travellerHat' },
              g: { head: 'peakedCap' }, v: { body: 'hood' }, i: {} },
  roman:    { a: { head: 'palla', body: 'toga' }, b: { head: 'laurel', body: 'toga' }, e: { head: 'galea' }, n: { head: 'travellerHat', hand: 'scroll' } },
  wartime:  { a: { head: 'beret', body: 'trench' }, b: { head: 'officerCap', body: 'trench' }, e: { head: 'headphones' }, n: { head: 'postCap', hand: 'letter' } },
  medieval: { a: { head: 'circlet', body: 'cloak' }, b: { head: 'coif', body: 'cloak' }, e: { head: 'chaperon', body: 'cloak' }, n: { head: 'travellerHat', hand: 'scroll' } },
};

export function person(kind, { disguise = 'today', head, body, hand, cloth, scale = 1 } = {}) {
  const K = CAST[kind] || CAST.i, c = TEAM[kind] ?? TEAM.i, d = DISGUISES[disguise]?.[kind] || {};
  const g = new THREE.Group(), clothC = cloth ?? K.cloth, clothM = mat(clothC), skin = mat(0xf0c8a0);
  g.add(mesh(new THREE.CylinderGeometry(.45, .85, 2.1, 10), clothM, 0, 1.05, 0, true));
  const headM = mesh(new THREE.SphereGeometry(.42, 16, 12), skin, 0, 2.55, 0, true); g.add(headM);
  if (K.eyes !== false) for (const x of [-.14, .14]) g.add(mesh(new THREE.SphereGeometry(.05, 8, 6), dark, x, 2.6, .38));
  const arms = new THREE.Group(); arms.position.y = 1.8; g.add(arms);
  for (const s of [-1, 1]) { const arm = mesh(new THREE.CapsuleGeometry(.13, .8, 4, 8), clothM, s * .55, -.3, .15); arm.rotation.z = s * .35; arm.rotation.x = -.5; arms.add(arm); }
  // the slots, each its own group so an episode can swap one later (userData.slots)
  const slots = {};
  const want = { head: head ?? d.head ?? K.hair, body: body ?? d.body, hand: hand ?? d.hand };
  for (const [slot, table] of [['body', BODY], ['head', HEAD], ['hand', HAND]]) {
    const s = new THREE.Group(); s.name = slot; g.add(s); slots[slot] = s;
    if (want[slot]) table[want[slot]]?.(s, c, clothC);
  }
  K.sign(g, c);   // last: the traits sit over any costume
  g.userData = { head: headM, arms, slots, kind, disguise };
  if (scale === 1) return g;
  const outer = new THREE.Group(); g.scale.setScalar(scale); outer.add(g);
  outer.userData = g.userData;
  return outer;
}
