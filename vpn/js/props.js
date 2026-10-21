// The objects of the story, built from primitives: the envelopes that ride the cables (the address
// written on the outside), the case the tunnel seals them in, the keys, the café's Wi-Fi box, its
// bar tables, the buildings, the open-top server halls, the floating tags, and the characters. The servers and the
// laptops are Shadow's (assets/shapes, through lib/shapes.js), placed by world.js.
// One unit is one metre: a person is 1.8 m, a table 75 cm high.
import * as THREE from 'three';

export const COLORS = { a: 0x4da3ff, b: 0xffc24d, e: 0xff3347, v: 0x5fd18f, i: 0xb9c3d6 };
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: .6, flatShading: true, ...o });
const dark = mat(0x15110c, { roughness: 1 });
export const box = (w, h, d, m, x = 0, y = 0, z = 0) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = true; b.receiveShadow = true; return b; };

// ---------- envelopes ----------
// An envelope, 0.9 × 0.6, the address on a tag above it. kind: 'plain' (paper), 'locked' (the site's
// own lock on it: HTTPS), 'key' (a public key going out), 'sealed' (the tunnel's gold case, larger, an
// inner envelope inside). Its face always turns to the camera, it flutters a little as it rides, and
// seen from far it grows so it never shrinks under about the size it has at 16 m (r360: seen whole,
// the map's packets were a few pixels). userData.size scales it on top of that.
const _p = new THREE.Vector3(), _q = new THREE.Quaternion();
export function envelope(kind = 'plain') {
  const g = new THREE.Group(), card = new THREE.Group(), big = kind === 'sealed' ? 1.35 : 1;
  const paper = kind === 'sealed' ? mat(0xf2c24f, { metalness: .5, roughness: .35, emissive: 0x5a3c00, emissiveIntensity: .5 })
    : kind === 'key' ? mat(0x9fd0ff, { emissive: 0x1a3a66, emissiveIntensity: .6 }) : mat(0xf6f0e2, { emissive: 0x2a2a2a, emissiveIntensity: .4 });
  const body = box(.9 * big, .6 * big, .06, paper); card.add(body);
  // the flap: a triangle on the face
  const flap = new THREE.Mesh(new THREE.CylinderGeometry(.33 * big, .33 * big, .02, 3), kind === 'sealed' ? mat(0xc79a2a, { metalness: .5 }) : mat(0xd9d0bc));
  flap.rotation.set(Math.PI / 2, 0, Math.PI); flap.scale.set(1.36, 1, .55); flap.position.set(0, .14 * big, .04); card.add(flap);
  if (kind === 'locked' || kind === 'sealed') {
    const lock = new THREE.Group(), m = mat(kind === 'sealed' ? 0x6b4a10 : 0xc9a227, { metalness: .6, roughness: .3 });
    lock.add(box(.2, .17, .06, m));
    const arch = new THREE.Mesh(new THREE.TorusGeometry(.065, .02, 6, 12, Math.PI), mat(0xb8bcc4, { metalness: .7 })); arch.position.y = .085; lock.add(arch);
    lock.position.set(0, -.1 * big, .06); card.add(lock);
  }
  g.add(card);
  g.userData.tag = tag(); g.userData.tag.position.y = .62 * big; g.add(g.userData.tag);
  g.userData.kind = kind; g.userData.size = 1;
  // drawn first among its parts, the body sets the card's turn and size for this frame
  body.onBeforeRender = (r, sc, cam) => {
    const k = Math.min(4.5, Math.max(1, cam.position.distanceTo(g.getWorldPosition(_p)) / 16)) * g.userData.size;
    card.scale.setScalar(k); g.userData.tag.position.y = .62 * big * k;
    g.parent?.getWorldQuaternion(_q).invert().multiply(cam.quaternion); card.quaternion.copy(_q);
    card.rotateZ(Math.sin(performance.now() / 260 + g.id) * .09);
    card.updateMatrixWorld(true); g.userData.tag.updateMatrixWorld(true);
  };
  return g;
}

// ---------- tags ----------
// A floating tag: a sprite with lines of text drawn on a canvas, on a dark rounded card. lines: an
// array of strings, or of [text, colour]. It keeps its size on screen however far the camera stands
// (sizeAttenuation off): h is one line's height as a share of the view, about 0.83 a screen on a desktop.
export function tag() {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthTest: false, sizeAttenuation: false, fog: false }));   // no fog: a tag reads crisp however far
  s.renderOrder = 20; s.visible = false; s.userData.key = '';
  return s;
}
export function setTag(s, lines, color = '#ffd66b', h = .02) {
  lines = lines.map(l => typeof l === 'string' ? [l, '#fff'] : l);
  const key = JSON.stringify([lines, color, h]);
  s.visible = lines.length > 0;
  if (s.userData.key === key || !lines.length) return;
  const c = document.createElement('canvas'), x = c.getContext('2d'), font = '700 40px Georgia, "Times New Roman", serif';
  x.font = font; const w = Math.ceil(Math.max(...lines.map(([t]) => x.measureText(t).width))) + 56, H = 22 + lines.length * 50;
  c.width = w; c.height = H;
  x.font = font; x.fillStyle = 'rgba(16,18,28,.88)'; x.strokeStyle = color; x.lineWidth = 5;
  x.beginPath(); x.roundRect(3, 3, w - 6, H - 6, 30); x.fill(); x.stroke();
  x.textAlign = 'center'; x.textBaseline = 'middle';
  lines.forEach(([t, col], i) => { x.fillStyle = col; x.fillText(t, w / 2, 36 + i * 50); });
  s.material.map?.dispose(); s.material.map = new THREE.CanvasTexture(c); s.material.map.colorSpace = THREE.SRGBColorSpace; s.material.needsUpdate = true;
  s.scale.set(w / 50 * h, H / 50 * h, 1); s.userData.key = key;
}

// ---------- keys ----------
// A key about 0.6 long along +x; color: gold for the shared key, red for a secret, blue for a public one.
export function key(color) {
  const m = mat(color, { metalness: .55, roughness: .3, emissive: color, emissiveIntensity: .35 });
  const g = new THREE.Group();
  const bow = new THREE.Mesh(new THREE.TorusGeometry(.1, .035, 8, 18), m); bow.position.x = -.2; g.add(bow);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, .4, 8), m); shaft.rotation.z = Math.PI / 2; shaft.position.x = .1; g.add(shaft);
  for (const [x, h] of [[.21, .09], [.27, .06], [.15, .05]]) g.add(box(.035, h, .03, m, x, -h / 2 - .015, 0));
  g.userData.tag = tag(); g.userData.tag.position.y = .2; g.add(g.userData.tag);
  return g;
}

// ---------- the café ----------
// The café's Wi-Fi box: a small white box with two antennas and a blinking light, on the wall.
export function router() {
  const g = new THREE.Group();
  g.add(box(.5, .12, .32, mat(0xeeeeea)));
  for (const x of [-.18, .18]) { const a = box(.03, .34, .03, mat(0x222222), x, .2, -.12); a.rotation.z = x * .6; g.add(a); }
  const led = box(.05, .03, .02, new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0x5fe39a, emissiveIntensity: 2.5 }), .14, .02, .165);
  g.add(led); g.userData.led = led;
  return g;
}
// A café bar table, a round top on one leg, 1.05 m high: Alice and Eve stand at theirs.
export const TABLE_Y = 1.05;
export function table() {
  const g = new THREE.Group(), wood = mat(0x8a5a32), iron = mat(0x2a2a30, { metalness: .5 });
  const top = new THREE.Mesh(new THREE.CylinderGeometry(.42, .42, .04, 20), wood); top.position.y = TABLE_Y - .02; top.castShadow = top.receiveShadow = true; g.add(top);
  const leg = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, TABLE_Y - .04, 8), iron); leg.position.y = (TABLE_Y - .04) / 2; g.add(leg);
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(.24, .26, .04, 14), iron); foot.position.y = .02; g.add(foot);
  return g;
}
// A cup of coffee.
export function cup() {
  const g = new THREE.Group();
  const c = new THREE.Mesh(new THREE.CylinderGeometry(.05, .04, .08, 12), mat(0xf4f1ea)); c.position.y = .04; g.add(c);
  const coffee = new THREE.Mesh(new THREE.CircleGeometry(.045, 12), mat(0x3b2112)); coffee.rotation.x = -Math.PI / 2; coffee.position.y = .079; g.add(coffee);
  return g;
}

// ---------- buildings ----------
// A flat-roofed building, w × h × d, its front toward +z, with windows and a door; sign: an optional
// colour band over the door, where world.js hangs the place's name.
export function building(w, h, d, wall, { roof = 0x4a4f57, sign = null, windows = true } = {}) {
  const g = new THREE.Group(), lit = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xffc070, emissiveIntensity: 1.1 });
  g.add(box(w, h, d, mat(wall), 0, h / 2, 0));
  g.add(box(w + .3, .3, d + .3, mat(roof), 0, h + .15, 0));
  g.add(box(1.2, 2.2, .1, mat(0x3a2414), 0, 1.1, d / 2 + .02));
  if (windows) for (let y = 1.6; y < h - .8; y += 2.6) for (let x = -w / 2 + 1.3; x <= w / 2 - 1.3; x += 2.2) {
    if (Math.abs(x) < 1 && y < 3) continue;     // the door
    g.add(box(1.1, 1.1, .08, lit, x, y + .3, d / 2 + .02));
  }
  if (sign !== null) g.add(box(Math.min(w - 1, 6), .7, .12, mat(sign, { emissive: sign, emissiveIntensity: .25 }), 0, 2.75, d / 2 + .06));
  return g;
}
// A server hall with no roof (r360): a floor, four low walls, a door in the front wall (+z) and a sign
// over it, so that from above every rack inside shows. w × d, walls h high; racks are world.js's.
export function hall(w, d, h, wall, sign) {
  const g = new THREE.Group(), m = mat(wall), T = .25, door = 1.6;
  g.add(box(w, .06, d, mat(0x8d9096, { roughness: .9 }), 0, .03, 0));
  g.add(box(w, h, T, m, 0, h / 2, -d / 2 + T / 2));                                   // the back wall
  for (const sx of [-1, 1]) g.add(box(T, h, d, m, sx * (w / 2 - T / 2), h / 2, 0));   // the sides
  const half = (w - door) / 2;                                                        // the front, either side of the door
  for (const sx of [-1, 1]) g.add(box(half, h, T, m, sx * (door + half) / 2, h / 2, d / 2 - T / 2));
  g.add(box(door, .35, T, m, 0, h - .175, d / 2 - T / 2));                            // over the door
  // a coping along the top of the walls: the cut edge reads as a wall, not a sheet
  const cap = mat(0x5a5f68);
  g.add(box(w + .1, .1, T + .1, cap, 0, h + .05, -d / 2 + T / 2), box(w + .1, .1, T + .1, cap, 0, h + .05, d / 2 - T / 2));
  for (const sx of [-1, 1]) g.add(box(T + .1, .1, d, cap, sx * (w / 2 - T / 2), h + .05, 0));
  g.add(box(Math.min(w / 2 - 2, 3.4), .5, .08, mat(sign, { emissive: sign, emissiveIntensity: .35 }), -(w / 4 + .4), h - .55, d / 2 + .04));   // a plate on the front wall
  return g;
}
// A café awning over the terrace, striped.
export function awning(w) {
  const g = new THREE.Group();
  for (let i = 0; i < 8; i++) {
    const s = box(w / 8, .05, 2.2, mat(i % 2 ? 0xf3ead6 : 0xb03a2e), -w / 2 + (i + .5) * w / 8, 0, 0);
    s.rotation.x = .25; g.add(s);
  }
  return g;
}
// A utility pole with its cross-arm; the cable rides at height h.
export function pole(h = 4) {
  const g = new THREE.Group(), wood = mat(0x5d4630);
  g.add(box(.16, h + .3, .16, wood, 0, (h + .3) / 2, 0), box(.9, .1, .1, wood, 0, h, 0));
  return g;
}
// A small house for the towns' backdrop.
export function house(w, d, h, wall, roof) {
  const g = new THREE.Group();
  g.add(box(w, h, d, mat(wall), 0, h / 2, 0));
  const shape = new THREE.Shape([new THREE.Vector2(-w / 2 - .3, 0), new THREE.Vector2(w / 2 + .3, 0), new THREE.Vector2(0, h * .6)]);
  const r = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: d + .6, bevelEnabled: false }), mat(roof)); r.position.set(0, h, -d / 2 - .3); r.castShadow = true; g.add(r);
  g.add(box(.9, 1.8, .08, mat(0x3a2414), 0, .9, d / 2 + .02));
  return g;
}

// ---------- the characters ----------
// A character, built 3.2 tall (scaled to 1.8 m by the stage), facing +z. kind: 'a' Alice, 'b' Bob,
// 'e' Eve, 'v' Victor, who runs the VPN server.
export function person(kind) {
  const g = new THREE.Group(), c = COLORS[kind];
  const cloth = mat({ a: 0x2a5ea8, b: 0x6b4a2b, e: 0x7a1424, v: 0x1f5a3c }[kind]), skin = mat(0xf0c8a0);
  const robe = new THREE.Mesh(new THREE.CylinderGeometry(.45, .85, 2.1, 10), cloth); robe.position.y = 1.05; robe.castShadow = true; g.add(robe);
  const head = new THREE.Mesh(new THREE.SphereGeometry(.42, 16, 12), skin); head.position.y = 2.55; head.castShadow = true; g.add(head);
  for (const x of [-.14, .14]) { const eye = new THREE.Mesh(new THREE.SphereGeometry(.05, 8, 6), dark); eye.position.set(x, 2.6, .38); g.add(eye); }
  const arms = new THREE.Group(); arms.position.y = 1.8; g.add(arms);
  for (const s of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(.13, .8, 4, 8), cloth);
    arm.position.set(s * .55, -.3, .15); arm.rotation.z = s * .35; arm.rotation.x = -.5; arms.add(arm);
  }
  if (kind === 'a') {          // Alice: blue scarf and a bun
    const hair = mat(0x6b3d1f);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(.45, 16, 10, 0, Math.PI * 2, 0, Math.PI * .55), hair); cap.position.y = 2.6; cap.rotation.x = -.35; g.add(cap);
    const bun = new THREE.Mesh(new THREE.SphereGeometry(.2, 10, 8), hair); bun.position.set(0, 2.95, -.3); g.add(bun);
    const scarf = new THREE.Mesh(new THREE.TorusGeometry(.4, .1, 8, 16), mat(c)); scarf.rotation.x = Math.PI / 2; scarf.position.y = 2.12; g.add(scarf);
  } else if (kind === 'b') {   // Bob: flat cap, a gold belt
    const capM = mat(0x3d2c1c);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(.46, .46, .16, 16), capM); cap.position.y = 2.88; g.add(cap);
    const brim = new THREE.Mesh(new THREE.BoxGeometry(.5, .05, .35), capM); brim.position.set(0, 2.82, .4); g.add(brim);
    const belt = new THREE.Mesh(new THREE.TorusGeometry(.62, .06, 6, 20), mat(c, { metalness: .5 })); belt.rotation.x = Math.PI / 2; belt.position.y = 1.55; g.add(belt);
  } else if (kind === 'v') {   // Victor: a green hoodie and a headset, the server room's operator
    const hood = new THREE.Mesh(new THREE.TorusGeometry(.42, .14, 8, 18), cloth); hood.rotation.x = Math.PI / 2; hood.position.y = 2.15; g.add(hood);
    const band = new THREE.Mesh(new THREE.TorusGeometry(.46, .045, 6, 20, Math.PI), mat(0x222428)); band.position.y = 2.6; g.add(band);
    for (const x of [-.46, .46]) { const ear = new THREE.Mesh(new THREE.CylinderGeometry(.13, .13, .1, 12), mat(c)); ear.rotation.z = Math.PI / 2; ear.position.set(x, 2.58, 0); g.add(ear); }
    const hair = new THREE.Mesh(new THREE.SphereGeometry(.44, 14, 8, 0, Math.PI * 2, 0, Math.PI * .4), mat(0x2b2118)); hair.position.y = 2.6; g.add(hair);
  } else {                     // Eve: a spy's dark fedora with a red band, a black eye mask
    const felt = mat(0x2a2a30), hat = new THREE.Group(); hat.position.y = 2.86; hat.rotation.x = .12; g.add(hat);
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(.74, .74, .05, 24), felt); brim.castShadow = true; hat.add(brim);
    const crown = new THREE.Mesh(new THREE.CylinderGeometry(.31, .41, .36, 16), felt); crown.position.y = .19; crown.castShadow = true; hat.add(crown);
    const hatband = new THREE.Mesh(new THREE.CylinderGeometry(.415, .42, .1, 16), mat(0x9e1b2e)); hatband.position.y = .08; hat.add(hatband);
    const mask = new THREE.Mesh(new THREE.TorusGeometry(.42, .075, 6, 20, Math.PI), dark); mask.rotation.x = Math.PI / 2; mask.position.y = 2.6; g.add(mask);
    for (const x of [-.14, .14]) { const white = new THREE.Mesh(new THREE.SphereGeometry(.07, 10, 8), mat(0xfaf6ee)); white.position.set(x, 2.6, .45); g.add(white);
      const pupil = new THREE.Mesh(new THREE.SphereGeometry(.04, 8, 6), dark); pupil.position.set(x, 2.6, .51); g.add(pupil); }
  }
  g.userData.head = head; g.userData.arms = arms;
  return g;
}
