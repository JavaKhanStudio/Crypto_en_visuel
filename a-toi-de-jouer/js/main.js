// Entry point of episode 1.7 « À toi de jouer » (r420, r505): renderer, bloom, the loop, Alice's
// rider on the road under Eve's walls, and the story of choices (story.js, lib/choices.js). Same
// valley, castles and cast as episodes 1.1 to 1.6, through lib/saga/.
// Deep links: #story=2. ?lang=en. ?instant=1 skips camera flights and rides fast
// (used by the headless screenshots in tools/shoot.py and by tests/jouer_story.py).
import * as THREE from 'three';
import { qualityComposer, addBloom } from '../../ficelle/lib/episode.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { buildWorld, CASTLE_A, CASTLE_B, CITY } from '../../ficelle/lib/saga/world.js';
import { CameraRig } from '../../ficelle/lib/saga/camera.js';
import { initFx, updateFx, fireworks } from '../../ficelle/lib/fx.js';
import { Messenger } from '../../ficelle/lib/messenger.js';
import { Bubbles } from '../../ficelle/lib/bubbles.js';
import { Story, STEPS } from './story.js';
import * as i18n from './i18n.js';
import { sfx } from '../../ficelle/lib/sound.js';
import { setLang, applyStatic } from './i18n.js';

const params = new URLSearchParams(location.search);
const instant = params.has('instant');

// ---------- renderer ----------
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas });   // r254: the antialiasing is the composer's MSAA, lib/quality.js
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.3;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, 1, .5, 1500);
const world = buildWorld(scene);   // the Middle-earth castles: 1.7 enters no keep
const tickers = new Set(); world.tickers = tickers;
initFx(scene);
const rig = new CameraRig(camera, canvas);
if (instant) { const fly = rig.fly.bind(rig); rig.fly = shot => fly(shot, .001); }

const composer = qualityComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
addBloom(composer, .75, .55, .82);   // r548: the bloom and the output pass, lib/bloom.js

function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false); composer.setSize(w, h);
  camera.aspect = w / h; camera.fov = w < h ? 65 : 45; camera.updateProjectionMatrix();
}
addEventListener('resize', resize); resize();

// ---------- the pieces ----------
const bubbles = new Bubbles(camera, { raw: i18n.raw }); bubbles.instant = instant;
const wait = ms => new Promise(r => setTimeout(r, instant ? Math.min(ms, 60) : ms));
const tops = { a: new THREE.Vector3(CASTLE_A.x, CASTLE_A.y + 22, 0), b: new THREE.Vector3(CASTLE_B.x, CASTLE_B.y + 22, 0),
  e: new THREE.Vector3(CITY.x, 24, CITY.z) };

// The ride of a choice: Alice's rider leaves her castle, Eve's guards stop him under her walls (stopAt
// .5, where the road passes her gate), he holds up his scroll and Eve says what she makes of it (eve);
// she lets him go, and Bob at his gate says what he got (bob), or, with reject, turns him away.
// Eve's own rider (from: 'city', in Alice's colours on a dark horse, as in 1.6) leaves her gate with
// her forgery or her copy, Eve saying what it is. Resolves 'delivered' or 'rejected', or 'cancelled'
// when the reader leaves the step.
const riders = new Set(), said = [];   // said: what Eve and Bob say aloud, for tests/jouer_story.py
async function ride({ eve, bob, from = 'a', reject = false, live = () => true }) {
  const city = from === 'city';
  const m = new Messenger(world, { from, forged: city, fate: reject ? 'reject' : 'deliver', stopAt: city ? null : .5, speed: instant ? 400 : 30 });
  const scroll = m.obj.userData.scroll;
  riders.add(m); sfx.send();
  const big = () => { scroll.scale.set(2.2, 2.2, 2.2); scroll.position.y = 5.2; }, small = () => { scroll.scale.set(1, 1, 1); scroll.position.y = 3.3; };
  if (city) {
    m.paused = true; rig.fly('gate', instant ? .001 : 1.2); big();
    bubbles.show('eve-read', 'e', eve, tops.e); said.push(['e', eve]);
    await wait(3000);
    if (!live()) return 'cancelled';
    bubbles.hide('eve-read'); small(); m.paused = false; rig.chase(m.obj);
  } else {
    rig.chase(m.obj);
    const held = await Promise.race([m.stopped, m.done]);
    if (held !== m || !live()) return 'cancelled';
    sfx.reject(); rig.fly('gate', 1.2); big();
    bubbles.show('eve-read', 'e', eve, () => m.position.clone().add(new THREE.Vector3(0, 8, 0))); said.push(['e', eve]);
    await wait(3600);
    if (!live()) return 'cancelled';
    bubbles.hide('eve-read'); small();
    m.release(); rig.chase(m.obj);
  }
  const r = await m.done; riders.delete(m);
  if (r === 'cancelled' || !live()) return r;
  r === 'rejected' ? sfx.reject() : sfx.arrive();
  bubbles.show('far-read', 'b', bob, tops.b, { ttl: 7000 }); said.push(['b', bob]);
  await wait(1600);
  return r;
}
function resetWorld() {
  for (const m of riders) m.finish('cancelled');
  riders.clear(); bubbles.clear(); rig.stopFollow();
}

const ctx = { world, rig, bubbles, instant, ride, wait, resetWorld,
  onRight: () => { sfx.win(); fireworks(new THREE.Vector3(0, 0, 0), [0xffd27a, 0x5fe39a], 3); } };
const story = new Story(ctx);

document.querySelectorAll('#lang button').forEach(b => b.onclick = () => setLang(b.dataset.lang));

// presenter remotes send arrows / page keys; Suivant stays shut until the step's right choice is found
addEventListener('keydown', e => {
  if (['ArrowRight', 'PageDown'].includes(e.key) && !document.getElementById('next').disabled) { e.preventDefault(); story.go(story.i + 1); }
  if (['ArrowLeft', 'PageUp'].includes(e.key)) { e.preventDefault(); story.go(story.i - 1); }
});

// ---------- loop ----------
const clock = new THREE.Clock();
function loop() {
  if (composer.idle()) return requestAnimationFrame(loop);   // r546: a still scene at 30 fps (lib/still.js)
  const dt = Math.min(clock.getDelta(), .05), time = clock.elapsedTime;
  world.update(dt, time);
  for (const m of riders) if (!m.paused) m.update(dt, time);
  for (const f of tickers) f(dt, time);
  updateFx(dt);
  rig.update(dt);
  bubbles.update(dt);
  composer.render();
  requestAnimationFrame(loop);
}

applyStatic();
const h = location.hash.slice(1);
if (h.startsWith('shot=')) rig.jump(h.slice(5));
else story.go(Math.max(0, Math.min(STEPS.length - 1, (parseInt(h.split('=')[1]) || 1) - 1)));
loop();
document.getElementById('loading').classList.add('done');
window.demo = { THREE, renderer, composer, scene, camera, world, rig, story, riders, said, ready: true };
