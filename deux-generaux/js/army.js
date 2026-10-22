// Dawn: the armies that attack march down the road towards Eve's city.
// Together they take it and stay camped under the walls until the world is reset;
// alone, the army is crushed under the walls.
import * as THREE from 'three';
import { COLORS, CITY } from '../../lib/saga/world.js';
import * as fx from '../../lib/fx.js';

const N = 48;

function troop(world, team) {
  const mat = new THREE.MeshStandardMaterial({ color: COLORS[team], emissive: COLORS[team], emissiveIntensity: .35, flatShading: true, transparent: true });
  const im = new THREE.InstancedMesh(new THREE.ConeGeometry(.6, 2, 6), mat, N);
  im.castShadow = true; world.scene.add(im);
  const offs = Array.from({ length: N }, (_, i) => ({ lane: ((i % 6) - 2.5) * 1.3, back: Math.floor(i / 6) * 1.8, bob: Math.random() * 6 }));
  return { im, mat, offs, team };
}

const live = new Set();   // marches still on the map: { tick, troops }

const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(1, 1, 1);

// Returns a promise that resolves when the march (and its outcome) is over.
export function march(world, teams, win, { duration = 3.2, onHit } = {}) {
  clearArmies(world);
  const path = world.road.path, troops = teams.map(t => troop(world, t));
  const len = path.getLength();
  return new Promise(res => {
    let t = 0, done = false;
    const tick = (dt, time) => {
      t += dt; const k = Math.min(1, t / duration);
      for (const tr of troops) {
        const start = tr.team === 'a' ? 0 : 1, stop = tr.team === 'a' ? .42 : .58, dir = tr.team === 'a' ? 1 : -1;
        tr.offs.forEach((o, i) => {
          let u = start + (stop - start) * easeOut(k) - dir * o.back / len;
          u = Math.min(1, Math.max(0, u));
          const p = path.getPointAt(u), tan = path.getTangentAt(u), n = new THREE.Vector3(-tan.z, 0, tan.x);
          p.addScaledVector(n, o.lane); p.y += 1 + Math.abs(Math.sin(time * 10 + o.bob)) * .3;
          if (t > duration && !win) p.y -= Math.min(3, (t - duration) * 3);
          m4.compose(p, q, s); tr.im.setMatrixAt(i, m4);
        });
        tr.im.instanceMatrix.needsUpdate = true;
        if (t > duration && !win) tr.mat.opacity = Math.max(0, 1 - (t - duration));
      }
      if (t > duration && !tick.hit) {
        tick.hit = true; onHit?.();
        if (win) {
          fx.fireworks(new THREE.Vector3(CITY.x, 0, CITY.z), [0xffd27a, 0x4da3ff, 0xffffff, 0xffc24d], 14);
          const f = world.city.userData.flag; tick.flag = f; tick.fall = true;
        } else {
          for (const tr of troops) {   // the lone army is crushed where it stands
            const front = path.getPointAt(tr.team === 'a' ? .42 : .58);
            fx.ring(front, COLORS.e, { radius: 14, life: 1.6 });
            fx.burst(front.setY(front.y + 2), COLORS.e, { count: 160, speed: 14, life: 1.8, size: .8 });
          }
        }
      }
      if (tick.flag) {   // Eve's flag topples off its tower and drops out of sight
        const f = tick.flag, s = t - duration, y0 = f.userData.y0 ??= f.position.y;
        f.rotation.z = Math.min(2, s * 1.6); f.position.y = Math.max(0, y0 - Math.max(0, s - .3) ** 2 * 7); f.visible = s < 2.2;
      }
      if (tick.fall) crumble(world, tick, t - duration);
      if (t > duration + (win ? FALL + 1 : 2.6) && !done) {
        done = true; res();
        if (!win) clearArmies(world);   // the winners keep standing (and bobbing) at the walls
      }
    };
    world.tickers.add(tick); live.add({ tick, troops });
  });
}
const easeOut = k => 1 - Math.pow(1 - k, 2);

// Victory: Eve's spire crumbles into her city over FALL seconds, in clouds of dust, and once
// it is down a second round of fireworks goes up (r71). s: seconds since the armies hit the walls.
const FALL = 2.6;
function crumble(world, tick, s) {
  const k = Math.min(1, Math.max(0, (s - .3) / FALL));
  world.setFall(k);
  const base = new THREE.Vector3(CITY.x, CITY.y + 1, CITY.z), puffs = Math.floor(k * 6);
  for (tick.puffs ??= 0; tick.puffs < puffs; tick.puffs++) {   // a puff of dust as each floor goes down
    const y = 26 * (1 - k * k) + 2;
    fx.burst(base.clone().setY(base.y + y * Math.random()), 0x9d9081, { count: 140, speed: 6, up: 3, size: 2.2, life: 2.2, gravity: 2, glow: false });
    fx.burst(base.clone(), 0x7d7064, { count: 160, speed: 10, up: 1, size: 2.6, life: 2.6, gravity: 1.5, glow: false });
  }
  if (k >= 1 && !tick.cheered) {
    tick.cheered = true;
    fx.ring(base.clone(), 0xffd27a, { radius: 22, life: 1.6 });
    fx.fireworks(new THREE.Vector3(CITY.x, 0, CITY.z), [0xffd27a, 0x4da3ff, 0xffffff, 0xffc24d], 18);
  }
}

export function clearArmies(world) {
  for (const m of live) { world.tickers.delete(m.tick); for (const tr of m.troops) world.scene.remove(tr.im); }
  live.clear();
}

// the armies on the map, faded to opacity k (1 = as they marched); the dusk after a sunrise uses it
export function fadeArmies(k) { for (const m of live) for (const tr of m.troops) tr.mat.opacity = k; }
// stops the marches where they stand (no more steps, outcome or falling flag), troops left on the map
export function haltArmies(world) { for (const m of live) world.tickers.delete(m.tick); }
export const hasArmies = () => live.size > 0;

export function resetCityFlag(world) {
  const f = world.city.userData.flag;
  f.rotation.z = 0; if (f.userData.y0 !== undefined) f.position.y = f.userData.y0; f.visible = true; world.setFall(0);
}
