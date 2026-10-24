// r330 (r187, Simon 21 Oct: « Bob should stay Bob, Alice stay Alice … clearly identifiable traits,
// that we can add a disguise on »; round 2, 22 Oct: « think of them as simple toy / lego where we can
// change some of the pieces »): the cast of every visuel, built by ONE function. It was 11 copies of
// person(kind) in <ep>/js/props.js, in 8 drifted versions.
//     import { person } from '../../lib/cast.js';
//     person('a')                                  // Alice as the episodes draw her today
//     person('e', { disguise: 'roman' })           // Eve in the scytale's Rome
//     person('b', { disguise: 'wartime', scale: 5.3, hand: 'key' })
// A person is a TOY: pieces that come apart, as a printed figure does on a board. Every joint is one straight
// peg (male) in one straight hole (female), round 6; userData.joints lists them.
//   body      the robe, the kind's cloth colour and body trait (Bob's belt). A hole in the neck, one in
//             each shoulder.
//   arms      two pieces, 'arm right' (the figure's right, it holds the item) and 'arm left', each a peg
//             out of its top into the robe's shoulder, the arm hanging beside the robe 0.4 mm clear: it turns
//             on its peg from hanging to 60 degrees forward, as the episodes raise it, and meets nothing.
//             Each arm is 'bent' (the fist upright, a hole down through it for a flag's pole or an item's
//             pin) or 'straight' (it hangs): { arms: ['bent', 'straight'] } (right, left), default both bent.
//   shoulder  every ring: a washer that drops over the neck peg and sits on the shoulders, with what
//             hangs from it (Alice's scarf, a toga's sash, the satchel's strap, a tabard). It hangs
//             between the arms, front and back. The head holds it down. Several stack (the kind's own ring on top).
//   head      the face and its fixed trait (Eve's mask, the guard's moustache), a peg under it into
//             the body's hole (the neck: hidden once assembled), a hole on top for the hat's peg.
//   hat       hair or a hat, a cap with a straight peg under it, pressed into the top of the head (on and off
//             by hand). Eve's is always black (her trait: the hacker's black hat), whatever the setting.
//   hand      a held item: a pole through the right fist's upright hole, or an item on a pin in it.
// The KIND fixes the body colour, the head and the kind's own ring; a DISGUISE (a setting) fills hat,
// shoulder and hand. Any slot can be given alone ({ hat: 'beret' }) and wins over the disguise's.
// One unit is one metre at scale 1 (a person is 3 m tall at 1, as the episodes drew them); the enigma
// family, garde and pingouin draw at 5.3. Printed 60 mm tall (r196), 1 unit is about 17.6 mm. Round 3:
// every figure goes together and prints, checked by lib/fit.js (node tests/cast_fit.mjs, lab/cast/fit.html):
// sockets are cut by what goes in them (userData.pin, userData.seat), a cap never reaches below the
// head's widest (it could not come down onto it), what hangs from a ring lies over what hangs from the
// ring under it (o.off), and pose 'bent' (the default) holds items in an upright fist. userData: head, arms (rotation.x raises both),
// pieces { body, arms: [left, right], shoulder, head, hat, hand }, kind, disguise. explode(fig, t) pulls the pieces apart.
import * as THREE from 'three';

export const TEAM = { a: 0x4da3ff, b: 0xffc24d, e: 0xff3347, g: 0xe8c45a, v: 0x5fd18f, n: 0xc9b48a, i: 0xb9c3d6 };
const BLACK = 0x1d1d23, RED = 0x9e1b2e, WHITE = 0xeee6d2, STEEL = 0xa4aab2, GOLD = 0xd8b04a, LEATHER = 0x5a3a22;
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: .6, flatShading: true, ...o });
const metal = c => mat(c, { metalness: .6, roughness: .35 });
const dark = mat(0x15110c, { roughness: 1 });
const mesh = (geo, m, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; return o; };

// ---------- the toy's measures ----------
const TOP = 2.1, HEAD_Y = 2.55, HEAD_R = .42, PIN_R = .13, RING_H = .08;
// round 6 (Simon 23 Oct: « The connectors are too complex. Remember this is for 3D print. A single male female slot
// would work WAY better here »): every joint is ONE straight peg (male) in ONE straight hole (female), nothing else:
// no bulb, no hub. The play is lib/fit.js's JOINT table (Bloc-Art's and FDM practice, .claude/skills/fdm-joints):
// about .1 mm a side where a piece stays put ('press': the neck, a hat, an item), .2 mm where it turns ('turn': the
// arms, the rings on the neck); a peg is at least 2.5 mm across. MM is one mm at 60 mm (r196's figure). Each joint is
// listed in userData.joints, which lib/fit.js checks against that table.
const MM = 1 / 17.6;
const FIST_R = .16, ITEM_R = .075, HOLE_R = ITEM_R + .1 * MM;   // the fist, an item's pin or a pole through the fist (2.6 mm), the hole through the fist
// the arm (rounds 5-6, Simon 23 Oct: « The hole you made to connect the arm remain, it is important to slot it in. But we
// ALSO need to gap so that, once slot in, it can move »): a peg out of the top of the arm into a hole in the robe's
// shoulder, the arm hanging beside the robe, parallel to it, GAP clear, so it turns freely on its peg, as the episodes'
// arm() raises it (0.8 to 1 rad forward); lib/fit.js turns it through SWING and it must meet nothing, the robe included.
const SWING = [-60, 0];   // degrees on its peg: from hanging to 60 forward (the stops are r395's, in the export)
const SLOPE = .4 / TOP, GAP = .4 * MM;   // the robe's slope (its radius grows .19 a unit down); the arm's gap to it (r395: .3 mm)
const SHOULDER_Y = 1.85, ARM_PIN = .085, ARM_DEEP = .2, ARM_R = .13;   // the arm's peg: 3 mm across, 3.5 mm into the robe
// the head (round 7, Simon 23 Oct: « make the top of the head flat to make it easier to print »): a ball cut flat FLAT over
// its centre, a disc 8.7 mm across at 60 mm, so the head prints standing on its top with the neck peg straight up
const FLAT = .34;
const PEG_R = .085, PEG_Y = .1, PEG_TOP = .47;   // a hat's peg, 3 mm across: from .1 over the head's centre up into the hat, 4.2 mm into the head's flat top
const RING_BORE = PIN_R + .2 * MM;   // a ring's hole on the neck peg
const coneR = y => .85 - .4 * y / TOP;   // the robe: .85 at the floor, .45 at the shoulders
// a point just off the robe, angle 0 in front (+z), positive towards the figure's left (+x)
const onRobe = (a, y, off = .05) => new THREE.Vector3(Math.sin(a) * (coneR(y) + off), y, Math.cos(a) * (coneR(y) + off));
// a washer (a closed solid, flat both sides: it prints lying down)
const washer = (rIn, rOut, h, m, y) => mesh(new THREE.LatheGeometry([new THREE.Vector2(rIn, 0), new THREE.Vector2(rOut, 0), new THREE.Vector2(rOut, h), new THREE.Vector2(rIn, h), new THREE.Vector2(rIn, 0)], 24), m, 0, y);
// a flat ribbon w wide, t thick, along points (a sash, a strap, a scarf's tail), lying flat on the robe: its
// thickness points away from the axis (an extruded shape turns with the curve's own frame, and its edge cut
// into the robe, lib/fit.js)
function ribbon(points, w, t, m) {
  const curve = new THREE.CatmullRomCurve3(points), N = 28, pos = [], idx = [], ring = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
  for (let i = 0; i <= N; i++) {
    const p = curve.getPointAt(i / N), tan = curve.getTangentAt(i / N), out = new THREE.Vector3(p.x, 0, p.z).normalize();
    const up = out.addScaledVector(tan, -out.dot(tan)).normalize(), across = new THREE.Vector3().crossVectors(tan, up);
    for (const [a, u] of ring) pos.push(...p.clone().addScaledVector(across, a * w / 2).addScaledVector(up, u * t / 2).toArray());
  }
  for (let i = 0; i < N; i++) for (let k = 0; k < 4; k++) { const a = 4 * i + k, b = 4 * i + (k + 1) % 4; idx.push(a, b, b + 4, a, b + 4, a + 4); }
  const e = 4 * N; idx.push(0, 2, 1, 0, 3, 2, e, e + 1, e + 2, e, e + 2, e + 3);
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx);
  let v = 0; const P = geo.attributes.position, A = new THREE.Vector3(), B = new THREE.Vector3(), C = new THREE.Vector3();
  for (let i = 0; i < idx.length; i += 3) { A.fromBufferAttribute(P, idx[i]); B.fromBufferAttribute(P, idx[i + 1]); C.fromBufferAttribute(P, idx[i + 2]); v += A.dot(B.cross(C)); }
  if (v < 0) { for (let i = 0; i < idx.length; i += 3) [idx[i + 1], idx[i + 2]] = [idx[i + 2], idx[i + 1]]; geo.setIndex(idx); }   // faces out
  geo.computeVertexNormals();
  return mesh(geo, m);
}
// a panel hanging on the robe's slope, front (side 1) or back (-1), from y0 down to y1
function panel(w, y0, y1, m, side = 1, t = .07, off = .04) {
  const p = mesh(new THREE.BoxGeometry(w, y0 - y1, t), m, 0, (y0 + y1) / 2, side * (coneR((y0 + y1) / 2) + off + t / 2));
  p.rotation.x = -side * Math.atan(.4 / TOP); return p;   // leaning in with the robe
}

// ---------- the kinds: what never changes ----------
// cloth: the body; hair: the hat slot when nothing covers it; ring: the kind's own shoulder piece;
// face(head, c): the head's fixed trait; body(g, c): the body's.
const eyes = h => { for (const x of [-.14, .14]) h.add(mesh(new THREE.SphereGeometry(.05, 8, 6), dark, x, HEAD_Y + .05, .38)); };
export const CAST = {
  a: { name: 'Alice', cloth: 0x2a5ea8, hair: 'bun', ring: 'scarf', face: eyes },
  b: { name: 'Bob', cloth: 0xe0a630, hair: 'short', face: eyes, proud: .07,   // proud: how far his buckle stands off the robe
    body(g) {   // a leather belt flush with the robe (part of the body: the arms pass over it), a gold buckle
      const y = 1.3, belt = mesh(new THREE.CylinderGeometry(coneR(y + .08) + .015, coneR(y - .08) + .015, .16, 10), mat(LEATHER), 0, y); g.add(belt);
      g.add(mesh(new THREE.BoxGeometry(.24, .2, .05), metal(GOLD), 0, y, coneR(y) + .02));
      g.add(mesh(new THREE.BoxGeometry(.12, .09, .06), mat(LEATHER), 0, y, coneR(y) + .03));
    } },
  e: { name: 'Eve', cloth: 0x7a1424, hair: 'short',
    face(h) {   // the black eye mask, wide white eyes behind it
      const mask = mesh(new THREE.TorusGeometry(.42, .075, 6, 20, Math.PI), dark, 0, HEAD_Y + .05); mask.rotation.x = Math.PI / 2; h.add(mask);
      for (const x of [-.14, .14]) { h.add(mesh(new THREE.SphereGeometry(.07, 10, 8), mat(0xfaf6ee), x, HEAD_Y + .05, .45)); h.add(mesh(new THREE.SphereGeometry(.04, 8, 6), dark, x, HEAD_Y + .05, .51)); }
    } },
  n: { name: 'messenger', cloth: 0x8a6a3a, hair: 'short', ring: 'satchel', face: eyes },
  g: { name: 'guard', cloth: 0x1f2a44, hair: 'short',
    face(h) { eyes(h); const t = mesh(new THREE.CapsuleGeometry(.05, .22, 4, 8), mat(0x3a2414), 0, HEAD_Y - .08, .4); t.rotation.z = Math.PI / 2; h.add(t); },
    body(g, c) { const star = mesh(new THREE.CylinderGeometry(.14, .14, .08, 5), metal(c), .2, 1.85, Math.sqrt(coneR(1.85) ** 2 - .04) - .02); star.rotation.x = Math.PI / 2 - .19; g.add(star); } },   // the star half sunk in the robe's flat face
  v: { name: 'Victor', cloth: 0x1f5a3c, hair: 'headset', ring: 'hood', face: eyes },
  i: { name: 'customer', cloth: 0x55607a, hair: 'short', face: eyes },
};

// ---------- hat: a cap with a peg into the head ----------
// each draws around the head (centre HEAD_Y); o.felt is the hat's main colour, black for Eve
// (a cap round the head is hollowed by it, lib/fit.js: under r .5 its wall over the head is under 1 mm at 60 mm)
const capOn = (m, open = .5, r = .5, dy = .05, least = .5) => mesh(new THREE.SphereGeometry(Math.max(r, least), 16, 10, 0, Math.PI * 2, 0, Math.PI * open), m, 0, HEAD_Y + dy);
const bunOf = (g, m) => g.add(mesh(new THREE.SphereGeometry(.2, 10, 8), m, 0, HEAD_Y + .38, -.32));
const HAIR = 0x6b3d1f;
const HAT = {
  bun(g) { const m = mat(HAIR); g.add(capOn(m, .5)); bunOf(g, m); },   // never below the head's widest: it could not come down onto it
  short(g) { g.add(capOn(mat(0x4a3424), .45, .44)); },
  dark(g) { g.add(capOn(mat(0x2b2118), .4, .44)); },
  headset(g, o) { HAT.dark(g);   // Victor, the server room's operator
    const band = mesh(new THREE.TorusGeometry(.46, .045, 6, 20, Math.PI), mat(0x222428), 0, HEAD_Y + .05); g.add(band);
    for (const x of [-.46, .46]) { const ear = mesh(new THREE.CylinderGeometry(.13, .13, .1, 12), mat(o.c), x, HEAD_Y + .03); ear.rotation.z = Math.PI / 2; g.add(ear); } },
  flatCap(g, o) { const m = mat(o.felt ?? 0x3d2c1c);   // Bob's, today
    g.add(mesh(new THREE.CylinderGeometry(.46, .46, .24, 16), m, 0, HEAD_Y + .42)); g.add(mesh(new THREE.BoxGeometry(.5, .06, .35), m, 0, HEAD_Y + .32, .4)); },
  fedora(g, o) { const felt = mat(o.felt ?? 0x2a2a30), hat = new THREE.Group(); hat.position.y = HEAD_Y + .31; hat.rotation.x = .12; g.add(hat);   // Eve's, today (r65: not a pointed hood)
    hat.add(mesh(new THREE.CylinderGeometry(.74, .74, .065, 24), felt));
    hat.add(mesh(new THREE.CylinderGeometry(.31, .41, .36, 16), felt, 0, .19));
    hat.add(mesh(new THREE.CylinderGeometry(.415, .42, .1, 16), mat(RED), 0, .08)); },
  travellerHat(g, o) { const m = mat(o.felt ?? 0x6b5330);   // the messenger's broad hat, a feather in its band
    g.add(mesh(new THREE.CylinderGeometry(.3, .38, .28, 14), m, 0, HEAD_Y + .43)); g.add(mesh(new THREE.CylinderGeometry(.75, .75, .065, 18), m, 0, HEAD_Y + .31));
    g.add(mesh(new THREE.CylinderGeometry(.385, .385, .07, 14), mat(RED), 0, HEAD_Y + .35));
    const f = mesh(new THREE.CapsuleGeometry(.05, .42, 4, 8), mat(0xf2ead8), .3, HEAD_Y + .55, -.2); f.rotation.set(-.5, 0, -.6); g.add(f); },
  postCap(g, o) { g.add(mesh(new THREE.CylinderGeometry(.4, .44, .3, 14), mat(o.felt ?? 0x2f3a2e), 0, HEAD_Y + .39)); },   // the courier's
  peakedCap(g, o) { const navy = mat(o.felt ?? 0x15203a);   // the guard's
    g.add(mesh(new THREE.CylinderGeometry(.5, .44, .3, 16), navy, 0, HEAD_Y + .41)); g.add(mesh(new THREE.BoxGeometry(.6, .06, .32), mat(0x0b0f1c), 0, HEAD_Y + .29, .42));
    g.add(mesh(new THREE.CylinderGeometry(.475, .465, .07, 16), metal(o.c), 0, HEAD_Y + .33)); },
  // Rome
  laurel(g) { const leaf = mat(0x4f7a2e); HAT.short(g);
    g.add(washer(.41, .48, .07, leaf, HEAD_Y + .2));
    for (let k = 0; k < 14; k++) { const a = k / 14 * Math.PI * 2, l = mesh(new THREE.SphereGeometry(.07, 6, 4), leaf, Math.cos(a) * .47, HEAD_Y + .25, Math.sin(a) * .47); l.scale.set(1, .6, 1.8); l.rotation.y = -a; g.add(l); } },
  palla(g, o) { const m = mat(o.felt ?? WHITE); HAT.bun(g);   // a veil over the bun (Alice)
    const v = capOn(m, .42, .52, .05); v.rotation.x = -.3; g.add(v); },   // its rim stays over the head's widest
  galea(g, o) { const iron = metal(o.felt ?? STEEL);   // an iron helmet with a red crest; Eve's is black
    g.add(capOn(iron, .5, .47, .07));
    g.add(mesh(new THREE.BoxGeometry(.6, .05, .14), iron, 0, HEAD_Y + .07, -.38));
    g.add(mesh(new THREE.BoxGeometry(.09, .28, .7), mat(RED), 0, HEAD_Y + .57)); },
  // wartime (enigma 5.1-5.3: Alice and Bob are the German navy's radio room, Eve is Bletchley Park)
  sideCap(g, o) { const m = mat(o.felt ?? 0x14213d); HAT.bun(g);   // a navy side cap, worn tilted
    const c = mesh(new THREE.BoxGeometry(.4, .3, .86), m, .08, HEAD_Y + .45, 0); c.rotation.z = -.22; g.add(c);
    const f = mesh(new THREE.BoxGeometry(.46, .08, .88), m, .08, HEAD_Y + .31, 0); f.rotation.z = -.22; g.add(f); },
  watchCap(g, o) { const m = mat(o.felt ?? 0x6f737a);   // a knitted seaman's cap, the brim rolled up
    g.add(capOn(m, .52, .46, .07)); g.add(washer(.43, .5, .15, m, HEAD_Y + .02)); },
  bowler(g, o) { const m = mat(o.felt ?? BLACK);   // London's black bowler (Eve)
    g.add(capOn(m, .5, .4, .3, 0)); g.add(mesh(new THREE.CylinderGeometry(.4, .4, .14, 18), m, 0, HEAD_Y + .33));
    const brim = mesh(new THREE.CylinderGeometry(.6, .6, .065, 22), m, 0, HEAD_Y + .27); brim.scale.z = .92; g.add(brim); },
  leatherHelmet(g, o) { const m = mat(o.felt ?? 0x5a3a22);   // the dispatch rider: leather helmet, goggles up
    g.add(capOn(m, .48, .46, .03));
    const strap = mesh(new THREE.TorusGeometry(.5, .045, 6, 22), mat(0x2a2a2a), 0, HEAD_Y + .26); strap.rotation.x = Math.PI / 2 - .25; g.add(strap);
    for (const x of [-.13, .13]) { const lens = mesh(new THREE.CylinderGeometry(.1, .1, .07, 12), metal(0x8fb0c8), x, HEAD_Y + .33, .33); lens.rotation.x = Math.PI / 2 - .5; g.add(lens); } },
  // medieval (the saga: Alice and Bob are the two generals)
  helm(g, o) { const steel = metal(o.felt ?? STEEL);   // an open helm, a plume in the team colour
    if (o.kind === 'a') bunOf(g, mat(HAIR));
    g.add(capOn(steel, .52, .47, .05));
    g.add(mesh(new THREE.BoxGeometry(.07, .3, .08), steel, 0, HEAD_Y + .02, .5));   // the nasal
    g.add(mesh(new THREE.ConeGeometry(.08, .2, 8), steel, 0, HEAD_Y + .58));
    const plume = mesh(new THREE.CapsuleGeometry(.1, .4, 4, 8), mat(o.c), 0, HEAD_Y + .72, -.18); plume.rotation.x = -.9; g.add(plume); },
  bycocket(g, o) { const m = mat(o.felt ?? BLACK), hat = new THREE.Group(); hat.position.y = HEAD_Y + .3; g.add(hat);   // Eve's: brim up behind, a peak in front, a red feather
    hat.add(mesh(new THREE.CylinderGeometry(.3, .42, .34, 14), m, 0, .14));
    const brim = mesh(new THREE.CylinderGeometry(.62, .62, .065, 20), m, 0, 0, -.04); brim.rotation.x = -.35; hat.add(brim);
    const peak = mesh(new THREE.ConeGeometry(.2, .42, 4), m, 0, .02, .55); peak.rotation.x = Math.PI / 2 + .2; hat.add(peak);
    const f = mesh(new THREE.CapsuleGeometry(.05, .5, 4, 8), mat(RED), -.3, .3, -.15); f.rotation.set(-.4, 0, .7); hat.add(f); },
};

// ---------- shoulder: a ring on the neck pin, what hangs from it hangs between the arms ----------
const SHOULDER = {
  scarf(g, o) { const m = mat(o.c);   // Alice's, her trait in every setting: a thick ring and a tail
    g.add(washer(RING_BORE, .5 + o.off, .14, m, o.y)); g.add(ribbon([onRobe(.48, o.y + .02, .06 + o.off), onRobe(.53, o.y - .35, .05 + o.off), onRobe(.56, o.y - .75, .05 + o.off)], .16, .07, m)); },   // the tail beside a tabard's edge
  satchel(g, o) { const strap = mat(LEATHER), bag = mat(0x7a5530);   // the messenger's, any figure can wear it
    // the strap crosses the back to the right hip (in front, the forearms would stop the ring coming down)
    g.add(washer(RING_BORE, .47 + o.off, RING_H, strap, o.y));
    g.add(ribbon([onRobe(2.2, o.y + .02, .04 + o.off), onRobe(2.7, 1.75, .065 + o.off), onRobe(3.5, 1.35, .065 + o.off), onRobe(3.95, 1.0, .065 + o.off)], .12, .07, strap));
    const b = new THREE.Group(), p = onRobe(-2.3, .82, .16 + o.off); b.position.copy(p); b.rotation.set(-Math.atan(.4 / TOP), -2.3, 0, 'YXZ'); g.add(b);
    b.add(mesh(new THREE.BoxGeometry(.5, .38, .2), bag));
    b.add(mesh(new THREE.BoxGeometry(.52, .18, .22), mat(0x5e3f22), 0, .12, .01));
    b.add(mesh(new THREE.CylinderGeometry(.06, .06, .03, 10), mat(RED), 0, .04, .13).rotateX(Math.PI / 2));
    const horn = mesh(new THREE.TorusGeometry(.13, .045, 6, 16, Math.PI * 1.5), metal(GOLD), .27, -.05, 0); horn.rotation.y = Math.PI / 2; b.add(horn); },
  hood(g, o) { const h = mesh(new THREE.TorusGeometry(.42, .14, 8, 18), mat(o.cloth), 0, o.y + .14); h.rotation.x = Math.PI / 2; g.add(h); },   // Victor's hoodie
  toga(g, o) { const m = mat(WHITE);   // Rome: a sash from the left shoulder across the chest to the right hip
    g.add(washer(RING_BORE, .5 + o.off, RING_H, m, o.y));
    g.add(ribbon([onRobe(.5, o.y + .02, .04 + o.off), onRobe(.3, 1.8, .05 + o.off), onRobe(-.15, 1.25, .05 + o.off), onRobe(-.35, .65, .05 + o.off), onRobe(-.4, .2, .05 + o.off)], .34, .07, m));   // clear of the forearm
    g.add(panel(.55, o.y + RING_H, .5, m, -1, .07, .04 + o.off)); },
  cape(g, o) { const m = mat(o.capeC ?? BLACK);   // a short cape behind the arms
    g.add(washer(RING_BORE, .52 + o.off, RING_H, m, o.y)); g.add(panel(1.0, o.y + RING_H, .6, m, -1, .07, .04 + o.off)); },
  sailorCollar(g, o) { const navy = mat(0x14213d), stripe = mat(0xf0f0f0);   // the navy's square collar
    g.add(washer(RING_BORE, .5 + o.off, RING_H, navy, o.y)); g.add(panel(.8, o.y + RING_H, 1.5, navy, -1, .07, .04 + o.off));
    for (const yy of [1.58, 1.68]) g.add(panel(.72, yy + .04, yy, stripe, -1, .07, .04 + o.off));
    },
  rollNeck(g, o) { g.add(mesh(new THREE.LatheGeometry([0, 1, 2, 3, 4, 5, 6].map(i => new THREE.Vector2(PIN_R + .01 + Math.sin(i / 6 * Math.PI) * .12 + .24, i / 6 * .26)).concat([new THREE.Vector2(PIN_R + .01, .26), new THREE.Vector2(PIN_R + .01, 0)]), 20), mat(0x6f737a), 0, o.y)); },
  collegeScarf(g, o) { const a = mat(0x1b2a55), b = mat(0xd9d2bf);   // Bletchley: a striped college scarf, two tails
    g.add(washer(RING_BORE, .54 + o.off, .12, a, o.y));
    for (const s of [-1, 1]) for (let k = 0; k < 6; k++) { const y = o.y - .06 - k * .15;   // each stripe a hair into the next, the first into the ring
      g.add(mesh(new THREE.BoxGeometry(.17, .16, .07), k % 2 ? b : a, s * .17, y, coneR(y) + .08 + o.off).rotateX(-Math.atan(.4 / TOP))); } },
  tabard(g, o) { const field = mat(WHITE), c = mat(o.c);   // the saga's generals: a white tabard, the team's arms on it
    g.add(washer(RING_BORE, .5 + o.off, RING_H, field, o.y));
    g.add(panel(.52, o.y + RING_H, .55, field, 1, .07, .04 + o.off)); g.add(panel(.52, o.y + RING_H, .55, field, -1, .07, .04 + o.off));
    const arms = new THREE.Group(); arms.position.copy(onRobe(0, 1.35, .12 + o.off)); arms.rotation.x = -Math.atan(.4 / TOP); g.add(arms);
    if (o.kind === 'a') { arms.add(mesh(new THREE.BoxGeometry(.24, .3, .03), c, 0, -.03)); for (const x of [-.08, 0, .08]) arms.add(mesh(new THREE.BoxGeometry(.06, .07, .03), c, x, .15)); }   // a tower
    else { arms.add(mesh(new THREE.CylinderGeometry(.13, .13, .03, 14).rotateX(Math.PI / 2), c)); for (let k = 0; k < 8; k++) { const r = mesh(new THREE.BoxGeometry(.04, .1, .03), c, Math.sin(k * Math.PI / 4) * .2, Math.cos(k * Math.PI / 4) * .2); r.rotation.z = -k * Math.PI / 4; arms.add(r); } } },   // a sun
};

// ---------- hand: an item with a pin into the right hand's hole ----------
// drawn upright around the hand (0, 0, 0)
const HAND = {
  key(g, o) { const m = metal(o.c); g.add(mesh(new THREE.TorusGeometry(.12, .035, 6, 14), m, 0, .2)); g.add(mesh(new THREE.BoxGeometry(.05, .4, .05), m, 0, -.05)); },
  scroll(g) { const s = mesh(new THREE.CylinderGeometry(.08, .08, .5, 10), mat(0xeadbb4), 0, 0, .05); s.rotation.z = Math.PI / 2; g.add(s);
    g.add(mesh(new THREE.CylinderGeometry(.05, .05, .02, 10).rotateX(Math.PI / 2), mat(RED), 0, 0, .14)); },
  letter(g) { const l = mesh(new THREE.BoxGeometry(.42, .3, .06), mat(0xf3ecdc), 0, .1, .1); l.rotation.x = -.3; g.add(l);
    g.add(mesh(new THREE.CylinderGeometry(.05, .05, .04, 10).rotateX(Math.PI / 2 - .3), mat(RED), 0, .1, .13)); },
  scytale(g) { const wood = mat(0x8a5a2b);   // the baton with its strip wound on it
    g.add(mesh(new THREE.CylinderGeometry(ITEM_R, ITEM_R, .9, 10), wood, 0, .15));
    for (let k = 0; k < 7; k++) { const r = mesh(new THREE.TorusGeometry(ITEM_R + .008, .022, 4, 12), mat(0xe6d6a8), 0, .2 + k * .06); r.rotation.x = Math.PI / 2 + .25; g.add(r); } },   // the strip above the fist
  signalPad(g) { g.add(mesh(new THREE.BoxGeometry(.32, .42, .04), mat(0xece6d2), 0, .12, .08)); g.add(mesh(new THREE.BoxGeometry(.32, .06, .05), mat(0x333333), 0, .32, .08)); },
  codebook(g) { g.add(mesh(new THREE.BoxGeometry(.34, .44, .1), mat(0x7a1f1f), 0, .12, .08)); g.add(mesh(new THREE.BoxGeometry(.3, .4, .101), mat(0xf0e8d6), .02, .12, .08)); },
  teacup(g) { const china = mat(0xf4f1ea);
    g.add(mesh(new THREE.CylinderGeometry(.22, .22, .06, 16), china, 0, -.02, .08));
    g.add(mesh(new THREE.CylinderGeometry(.13, .09, .14, 14), china, 0, .07, .08));
    const h = mesh(new THREE.TorusGeometry(.055, .035, 6, 10), china, .15, .08, .08); g.add(h); },
  banner(g, o) { const pole = mat(0x6b4a2b);   // the general's banner, in the team colour
    g.add(mesh(new THREE.CylinderGeometry(ITEM_R, ITEM_R, 2.0, 8), pole, 0, .55)); g.add(mesh(new THREE.SphereGeometry(.07, 8, 6), metal(GOLD), 0, 1.57));
    g.add(mesh(new THREE.BoxGeometry(.62, .5, .04), mat(o.c), -.33, 1.25, 0)); },
  lantern(g) { g.add(mesh(new THREE.TorusGeometry(.08, .02, 6, 12), mat(0x222222), 0, .06));
    g.add(mesh(new THREE.BoxGeometry(.2, .26, .2), mat(0xffd27a, { emissive: 0x8a5a10 }), 0, -.16)); g.add(mesh(new THREE.ConeGeometry(.16, .12, 4), mat(0x222222), 0, .03).rotateY(Math.PI / 4)); },
};
// how each item is held in the fist's upright hole: a pole goes THROUGH it, a lantern hangs UNDER it on a pin,
// the rest stand ON it on a pin (each moved clear of the fist, the pin in the item's colour)
const HOLD = { banner: 'through', scytale: 'through', lantern: 'under' };
function mount(h, how) {
  if (how === 'through') return;
  const b = new THREE.Box3().setFromObject(h), clear = FIST_R + .02, m = h.children[0]?.material;
  const dy = how === 'under' ? Math.min(0, -clear - b.max.y) : Math.max(0, clear - b.min.y), dx = -(b.min.x + b.max.x) / 2, dz = -(b.min.z + b.max.z) / 2;
  for (const c of h.children) c.position.add(new THREE.Vector3(dx, dy, dz));   // over the hole
  const [y0, y1] = how === 'under' ? [b.max.y + dy - .04, FIST_R * .85] : [-FIST_R * .85, b.min.y + dy + .04];
  const pin = mesh(new THREE.CylinderGeometry(ITEM_R, ITEM_R, Math.abs(y1 - y0), 10), m, 0, (y0 + y1) / 2); pin.userData.pin = true; h.add(pin);
}
export const SLOTS = { hat: Object.keys(HAT), shoulder: Object.keys(SHOULDER), hand: Object.keys(HAND) };

// ---------- the settings ----------
// today: each kind as the episodes draw it now (Bob yellow since round 2); the others are proposals
// for Simon to judge on lab/cast/. The kind's own ring (Alice's scarf, the satchel) stays on top.
export const DISGUISES = {
  today:    { a: {}, b: { hat: 'flatCap' }, e: { hat: 'fedora' }, n: { hat: 'travellerHat' }, g: { hat: 'peakedCap' }, v: {}, i: {} },
  roman:    { a: { hat: 'palla', shoulder: 'toga', hand: 'scytale' }, b: { hat: 'laurel', shoulder: 'toga', hand: 'scytale' },
              e: { hat: 'galea', shoulder: 'cape' }, n: { hat: 'travellerHat', hand: 'scroll' } },
  wartime:  { a: { hat: 'sideCap', shoulder: 'sailorCollar', hand: 'signalPad' }, b: { hat: 'watchCap', shoulder: 'rollNeck', hand: 'codebook' },
              e: { hat: 'bowler', shoulder: 'collegeScarf', hand: 'teacup' }, n: { hat: 'leatherHelmet', hand: 'letter' } },
  medieval: { a: { hat: 'helm', shoulder: 'tabard', hand: 'banner' }, b: { hat: 'helm', shoulder: 'tabard', hand: 'banner' },
              e: { hat: 'bycocket', shoulder: 'cape', hand: 'lantern' }, n: { hat: 'travellerHat', hand: 'scroll' } },
};

export function person(kind, { disguise = 'today', hat, head, shoulder, body, hand, cloth, scale = 1, pose = 'bent', arms: armsOpt } = {}) {
  const K = CAST[kind] || CAST.i, c = TEAM[kind] ?? TEAM.i, d = DISGUISES[disguise]?.[kind] || {};
  const g = new THREE.Group(), clothC = cloth ?? K.cloth, clothM = mat(clothC), skin = mat(0xf0c8a0);
  const piece = name => { const p = new THREE.Group(); p.name = name; p.userData.piece = name; g.add(p); return p; };
  const pieces = { body: piece('body'), shoulder: piece('shoulder'), head: piece('head'), hat: piece('hat'), hand: null };
  // body: robe, arms, hands, the socket at the neck
  const B = pieces.body;
  B.add(mesh(new THREE.CylinderGeometry(coneR(TOP), coneR(0), TOP, 10), clothM, 0, TOP / 2));
  const mouth = mesh(new THREE.CylinderGeometry(PIN_R + .02, PIN_R + .02, .012, 14), dark, 0, TOP + .001); B.add(mouth);
  mouth.userData.hole = true;   // the socket's mouth, drawn, not printed: the head's pin cuts the socket (lib/fit.js)
  K.body?.(B, c);
  // arms (round 6): each its own piece, a straight peg out of the top of the arm into a hole in the robe (the peg cuts
  // it, lib/fit.js), the arm hanging beside the robe parallel to it, GAP clear, turning on its peg;
  // either arm is 'bent' (forearm forward, the fist upright with a hole down through it: a flag's pole goes
  // through, an item stands on a pin) or 'straight' (round 2's: it hangs, the hole runs along it)
  const arms = new THREE.Group(); arms.position.y = SHOULDER_Y; g.add(arms);
  const armX = coneR(SHOULDER_Y) + GAP + ARM_R;   // the arm's axis, its peg's outer end
  let grip; pieces.arms = []; const joints = [];   // each joint: one peg (male) in one hole (female), lib/fit.js checks them
  const shape = typeof armsOpt === 'string' ? [armsOpt, armsOpt] : armsOpt ?? [pose, pose];
  for (const s of [-1, 1]) {   // -1: the figure's right (it holds the item), 1: its left
    const part = new THREE.Group(); part.name = part.userData.piece = s < 0 ? 'arm right' : 'arm left'; part.position.x = s * armX; arms.add(part); pieces.arms.push(part);
    part.userData.swing = SWING; part.userData.shape = shape[s < 0 ? 0 : 1];
    const pinL = ARM_R + GAP + ARM_DEEP, pin = mesh(new THREE.CylinderGeometry(ARM_PIN, ARM_PIN, pinL, 12), clothM, -s * pinL / 2); pin.rotation.z = Math.PI / 2;
    pin.userData.pin = true; part.add(pin);
    joints.push({ name: part.name, male: part.name, female: 'body', r: ARM_PIN, deep: ARM_DEEP, kind: 'turn', gap: GAP });
    const arm = new THREE.Group(); part.add(arm);
    if (part.userData.shape === 'straight') {   // it hangs, a little forward; the hole runs along it (an item cannot go through the fist)
      arm.rotation.set(-.42, 0, s * Math.atan(SLOPE));
      arm.add(mesh(new THREE.CapsuleGeometry(ARM_R, .62, 4, 8), clothM, 0, -.4));
      arm.add(mesh(new THREE.SphereGeometry(FIST_R, 12, 8), skin, 0, -.82));
      const hole = mesh(new THREE.CylinderGeometry(HOLE_R, HOLE_R, 2 * FIST_R + .01, 10), dark, 0, -.82); hole.userData.hole = true; arm.add(hole);
      if (s < 0) { grip = new THREE.Group(); grip.position.set(0, -.82, 0); grip.quaternion.copy(arm.quaternion).invert(); arm.add(grip); }
      continue;
    }
    arm.rotation.set(-.1, 0, s * Math.atan(SLOPE));
    arm.add(mesh(new THREE.CapsuleGeometry(ARM_R, .36, 4, 8), clothM, 0, -.25));
    const E = new THREE.Vector3(0, -.5, 0), F = new THREE.Vector3(0, -.62, .42), dir = F.clone().sub(E), len = dir.length() - FIST_R;
    const fore = mesh(new THREE.CapsuleGeometry(.12, len, 4, 8), clothM); dir.normalize();
    fore.position.copy(E).addScaledVector(dir, len / 2); fore.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir); arm.add(fore);
    const fist = new THREE.Group(); fist.position.copy(F); fist.quaternion.copy(arm.quaternion).invert(); arm.add(fist);
    fist.add(mesh(new THREE.SphereGeometry(FIST_R, 14, 10), skin));
    const hole = mesh(new THREE.CylinderGeometry(HOLE_R, HOLE_R, 2 * FIST_R + .01, 12), dark); hole.userData.hole = true; fist.add(hole);
    if (s < 0) grip = fist;
  }
  // head: face, trait, the pin under it (the hat's peg cuts the socket on top)
  // round 7 (Simon 23 Oct: « the cylinder at the bottom of the head seem to be another piece, yet it should be part of the
  // head, the invert of a lego piece »): the neck peg is the head's own, its skin, sunk .25 into the ball, printed with it
  const arc = [], top = Math.asin(FLAT / HEAD_R);
  for (let i = 0; i <= 10; i++) { const a = -Math.PI / 2 + (top + Math.PI / 2) * i / 10; arc.push(new THREE.Vector2(HEAD_R * Math.cos(a) + 1e-4, HEAD_R * Math.sin(a))); }
  arc.push(new THREE.Vector2(0, FLAT));   // the flat top, closed on the axis
  const H = pieces.head, headM = mesh(new THREE.LatheGeometry(arc, 16), skin, 0, HEAD_Y); H.add(headM);
  const neck = mesh(new THREE.CylinderGeometry(PIN_R, PIN_R, .5, 12), skin, 0, TOP + .02); neck.userData.pin = true; H.add(neck);   // cuts its socket in the body (lib/fit.js)
  joints.push({ name: 'neck', male: 'head', female: 'body', r: PIN_R, deep: .23, kind: 'press' });
  pieces.hat.userData.seat = ['head'];   // a hat is hollowed by the head it sits on
  K.face?.(H, c);
  // the costume
  const o = { c, kind, cloth: clothC, felt: kind === 'e' ? BLACK : undefined, off: 0 };
  const want = { hat: hat ?? head ?? d.hat ?? K.hair, shoulder: shoulder ?? body ?? d.shoulder, hand: hand ?? d.hand };
  HAT[want.hat]?.(pieces.hat, o);
  if (pieces.hat.children.length) {   // the hat's peg: straight down into a hole in the top of the head (it cuts it, lib/fit.js)
    const peg = mesh(new THREE.CylinderGeometry(PEG_R, PEG_R, PEG_TOP - PEG_Y, 12), mat(0x9a7b5c), 0, HEAD_Y + (PEG_TOP + PEG_Y) / 2);
    peg.userData.pin = true; pieces.hat.add(peg);
    joints.push({ name: 'hat', male: 'hat', female: 'head', r: PEG_R, deep: FLAT - PEG_Y, kind: 'press' });
  }
  let y = TOP; const rings = [];   // rings stack up the pin: the costume's first, the kind's own on top
  for (const name of [want.shoulder, K.ring].filter(Boolean)) {
    const r = new THREE.Group(); r.name = name; r.userData.piece = `ring ${name}`; r.userData.seat = ['head']; pieces.shoulder.add(r); rings.push(r.userData.piece);
    joints.push({ name: `neck through ${name}`, male: 'head', female: r.userData.piece, r: PIN_R, bore: RING_BORE, kind: 'turn' }); SHOULDER[name]?.(r, { ...o, y, off: (K.proud ?? 0) + .15 * (rings.length - 1) });
    y += name === 'scarf' ? .14 : name === 'rollNeck' ? .26 : RING_H;   // off: what hangs from it lies over what hangs from the ring under it
  }
  // the head sits on the ring stack: a thick one lifts it (and the hat) a little
  const lift = Math.max(0, y - TOP - .12); pieces.head.position.y = pieces.hat.position.y = lift;
  if (want.hand && HAND[want.hand]) {
    const h = new THREE.Group(); h.name = 'hand'; h.userData.piece = 'hand'; HAND[want.hand](h, o);
    if (pieces.arms[0].userData.shape !== 'straight') mount(h, HOLD[want.hand] ?? 'on');
    grip.add(h); pieces.hand = h;
    joints.push({ name: 'item', male: 'hand', female: 'arm right', r: ITEM_R, bore: HOLE_R, kind: 'press' });
  }
  // side: put on sideways before the rings come down (lib/fit.js does not slide them from above)
  g.userData = { head: headM, arms, pieces, slots: pieces, kind, disguise, lift, assembly: ['body', ...rings, 'head', 'hat'], side: pieces.arms.map(a => a.name),
    joints: joints.map(j => ({ ...j, r: j.r * scale, bore: j.bore && j.bore * scale, deep: j.deep && j.deep * scale, gap: j.gap && j.gap * scale })) };
  if (scale === 1) return g;
  const outer = new THREE.Group(); g.scale.setScalar(scale); outer.add(g);
  outer.userData = g.userData;
  return outer;
}

// pull a figure's pieces apart (t 0 assembled, 1 apart) to show how it is built
export function explode(fig, t = 1) {
  const P = fig.userData.pieces, l = fig.userData.lift;
  P.shoulder.position.y = .55 * t; P.head.position.y = l + 1.15 * t; P.hat.position.y = l + 1.7 * t;
  P.arms?.forEach((a, i) => a.position.x = (i ? 1 : -1) * (Math.abs(a.userData.x0 ??= a.position.x) + .3 * t));
  if (P.hand) P.hand.position.set(-.3 * t, -.2 * t, .2 * t);
}
