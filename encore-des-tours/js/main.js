// Entry point of episode 1.6 « Eve a encore des tours »: renderer, bloom, the loop, the riders (Alice's,
// and Eve's out of her city), the packet standing by a castle or before Eve's gate, and the three
// modes (story, sandbox, quiz). Same valley, castles and cast as episodes 1.1 to 1.5.
// Deep links: #story=5, #sandbox, #quiz. ?lang=en. ?instant=1 skips camera flights and rides fast
// (used by the headless screenshots in tools/shoot.py).
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { buildWorld, CASTLE_A, CASTLE_B, CITY, heightAt } from './world.js';
import { cargo as buildCargo, packet as buildPacket } from './props.js';
import { CameraRig } from './camera.js';
import { initFx, updateFx, fireworks } from '../../lib/fx.js';
import { Messenger } from './messenger.js';
import { Bubbles } from './bubbles.js';
import { Inside } from './inside.js';
import { Story, STEPS } from './story.js';
import { initSandbox } from './sandbox.js';
import { Quiz } from '../../lib/quiz.js';
import { QUIZ } from './quiz-data.js';
import * as i18n from './i18n.js';
import { renderCard } from './card.js';
import { sfx } from '../../lib/sound.js';
import { t, setLang, applyStatic } from './i18n.js';

const params = new URLSearchParams(location.search);
const instant = params.has('instant');

// ---------- renderer ----------
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.3;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, 1, .5, 1500);
const world = buildWorld(scene);
const tickers = new Set(); world.tickers = tickers;
initFx(scene);
const rig = new CameraRig(camera, canvas);
if (instant) { const fly = rig.fly.bind(rig); rig.fly = shot => fly(shot, .001); }

const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera); composer.addPass(renderPass);
composer.addPass(new UnrealBloomPass(new THREE.Vector2(1, 1), .75, .55, .82));
composer.addPass(new OutputPass());

function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false); composer.setSize(w, h);
  camera.aspect = w / h; camera.fov = w < h ? 65 : 45; camera.updateProjectionMatrix();
  inside?.resize(camera.aspect, camera.fov);
}
let inside;
addEventListener('resize', resize); resize();

// ---------- the pieces ----------
const bubbles = new Bubbles(camera); bubbles.instant = instant;
// steps 5-6 (Alice signs, Bob checks) and 11-12 (AES-GCM, Eve's byte) happen inside the keeps, in rooms
// where the machines run on the real bytes (r103, r162)
inside = new Inside({ renderer, renderPass, camera, rig, bubbles, instant }); resize();
const toastEl = document.getElementById('toast');
let toastTimer;
function toast(text, ms = 3200) { toastEl.textContent = text; toastEl.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toastEl.classList.remove('show'), ms); }
const wait = ms => new Promise(r => setTimeout(r, instant ? Math.min(ms, 60) : ms));
const tops = { a: new THREE.Vector3(CASTLE_A.x, CASTLE_A.y + 22, 0), b: new THREE.Vector3(CASTLE_B.x, CASTLE_B.y + 22, 0), e: new THREE.Vector3(CITY.x, 27, CITY.z) };

// The packet, large, standing by a castle and turning slowly: Alice builds it there, Bob opens it
// there, Eve forges hers before her gate. showcase(at, bricks, mark): at 'a', 'b' or 'e' (nothing
// hides it), the bricks it has, and those that are Eve's, in red.
const stand = buildPacket(); stand.scale.setScalar(3.4); stand.visible = false; scene.add(stand);
// beside the castle on a wide screen, where neither the card nor the panel covers it; in front of it
// on a tall one, where the sides are out of frame
const STANDS = { a: [CASTLE_A.x - 18, 14], b: [CASTLE_B.x - 18, -12], e: [CITY.x - 16, 30] }, TALL = { a: [CASTLE_A.x + 15, 20], b: [CASTLE_B.x - 15, 20], e: [CITY.x, 34] };
tickers.add((dt, time) => { if (stand.visible) { stand.rotation.y = Math.sin(time * .5) * .45; stand.position.y = stand.userData.y + Math.sin(time * 1.3) * .4; } });
function showcase(at, bricks = [], mark = null) {
  stand.visible = !!at;
  if (!at) return;
  const tall = innerWidth < innerHeight, [x, z] = (tall ? TALL : STANDS)[at];
  stand.userData.y = Math.max(heightAt(x, z), 0) + (tall ? 31 : 18); stand.position.set(x, stand.userData.y, z);
  stand.scale.setScalar(tall ? 2.3 : 3.4);   // six bricks are wider than a phone at full size
  stand.userData.show(bricks); stand.userData.mark(mark);
}

// The riders. Alice's (from 'a') or Bob's (from 'b'): Eve's guards stop each one under her walls
// (stopAt .5, where the road passes her gate); the rider holds up what he carries (cargo: 'packet',
// with the bricks it has, or the scroll), Eve says what she makes of it (eve) and, with mark, the
// bricks she changed turn red; she lets him go. Eve's own rider (from 'city', in Alice's colours on
// a dark horse) leaves her gate with her forgery or her copy, Eve saying what it is. The castle at
// the far end says what it got (bob). With reject, he is turned away at the gate. Resolves
// 'delivered' or 'rejected', or 'cancelled' when the world is reset.
const riders = new Set(), said = [];   // said: what Eve and the far castle say aloud, for tests/tours_story.py
async function ride({ eve, bob, from = 'a', cargo, bricks, mark, reject = false, live = () => true, onRead }) {
  const city = from === 'city';
  const m = new Messenger(world, { from, forged: city, fate: reject ? 'reject' : 'deliver', stopAt: city ? null : .5, speed: instant ? 400 : 30 });
  const scroll = m.obj.userData.scroll, load = cargo ? buildCargo(cargo) : null;
  if (load) { load.position.set(.2, 4.6, .6); load.scale.setScalar(.9); m.obj.userData.body.add(load); if (bricks) load.userData.show?.(bricks); }
  riders.add(m); sfx.send();
  const big = () => { if (load) { load.scale.setScalar(2.2); load.position.y = 6.4; } else { scroll.scale.set(2.2, 2.2, 2.2); scroll.position.y = 5.2; } };
  const small = () => { if (load) { load.scale.setScalar(.9); load.position.y = 4.6; } else { scroll.scale.set(1, 1, 1); scroll.position.y = 3.3; } };
  if (city) {
    // Eve sends her own rider: she says what he carries as he leaves her gate
    m.paused = true; rig.fly('gate', instant ? .001 : 1.2); big();
    if (mark) load?.userData.mark?.(mark);
    bubbles.show('eve-read', 'e', eve, tops.e); said.push(['e', eve]);
    onRead?.();
    await wait(3000);
    if (!live()) return 'cancelled';
    bubbles.hide('eve-read'); small(); m.paused = false; rig.chase(m.obj);
  } else {
    rig.chase(m.obj);
    const held = await Promise.race([m.stopped, m.done]);
    if (held !== m || !live()) return 'cancelled';
    sfx.reject(); rig.fly('gate', 1.2);
    const above = () => m.position.clone().add(new THREE.Vector3(0, 8, 0));
    big();
    bubbles.show('eve-read', 'e', eve, above); said.push(['e', eve]);
    if (mark) load?.userData.mark?.(mark);
    onRead?.();
    await wait(3600);
    if (!live()) return 'cancelled';
    bubbles.hide('eve-read'); small();
    m.release(); rig.chase(m.obj);
  }
  const r = await m.done; riders.delete(m);
  if (r === 'cancelled' || !live()) return r;
  r === 'rejected' ? sfx.reject() : sfx.arrive();
  const to = from === 'b' ? 'a' : 'b';
  bubbles.show('far-read', to, bob, tops[to], { ttl: 7000 }); said.push([to, bob]);
  await wait(1600);
  return r;
}
function resetWorld() {
  for (const m of riders) m.finish('cancelled');
  riders.clear(); bubbles.clear(); rig.stopFollow();
}

const ctx = { world, rig, bubbles, inside, toast, instant, ride, wait, showcase, resetWorld, renderCard, mode: () => mode, setMode: m => setMode(m),
  onAnswer: right => { right ? sfx.win() : sfx.lose(); if (right) fireworks(new THREE.Vector3(0, 0, 0), [0xffd27a, 0x5fe39a], 3); },
  onEnd: () => fireworks(new THREE.Vector3(0, 0, 0), [0xffd27a, 0x4da3ff, 0xffc24d, 0xffffff], 16) };
const story = new Story(ctx);
const sandbox = initSandbox(ctx);
const quiz = new Quiz(ctx, QUIZ, i18n);

// ---------- modes ----------
const panels = { story: document.getElementById('story'), sandbox: document.getElementById('sandbox'), quiz: document.getElementById('quiz') };
const card = document.getElementById('card');
// On a phone the card folds to its title line, so the scene and the bubbles keep their room (r84, r85);
// a tap on the title opens or folds it, and it stays as the reader left it from step to step.
card.classList.add('folded');
card.addEventListener('click', e => { if (e.target.closest('h3')) card.classList.toggle('folded'); });
let mode = null;
// On a phone the corner card sits just above whichever bottom panel is open, however tall that
// panel grows with the step, and never climbs under the top bar (r83). See #card in style.css.
function dock() {
  const open = Object.values(panels).find(p => !p.classList.contains('hidden') && p.offsetHeight);
  const top = Math.max(...['topbar', 'modes', 'lang'].map(id => document.getElementById(id)?.getBoundingClientRect().bottom ?? 0));
  const root = document.documentElement.style;
  root.setProperty('--dock', `${open ? innerHeight - open.getBoundingClientRect().top : 14}px`);
  root.setProperty('--top', `${top}px`);
}
const docker = new ResizeObserver(dock);
for (const el of [...Object.values(panels), document.getElementById('topbar')]) docker.observe(el);
addEventListener('resize', dock);
function setMode(m, opts = {}) {
  mode = m; card.classList.toggle('hidden', m === 'quiz');
  for (const [k, el] of Object.entries(panels)) el.classList.toggle('hidden', k !== m);
  document.querySelectorAll('#modes button').forEach(b => b.classList.toggle('active', b.dataset.mode === m));
  rig.setOrbit(0); story.token++; sandbox.token++; resetWorld();
  showcase();   // leaving a mode cancels its running ride
  if (m !== 'story') inside.leave();
  if (m === 'story') story.go(opts.step ?? story.i);
  if (m === 'sandbox') { location.hash = 'sandbox'; sandbox.enter(); }
  if (m === 'quiz') {
    location.hash = 'quiz';
    rig.fly('overview').then(() => mode === 'quiz' && rig.setOrbit(.05));
    quiz.render();
  }
  dock();
}
document.querySelectorAll('#modes button').forEach(b => b.onclick = () => { sfx.click(); setMode(b.dataset.mode); });
document.querySelectorAll('#lang button').forEach(b => b.onclick = () => setLang(b.dataset.lang));

// presenter remotes send arrows / page keys
addEventListener('keydown', e => {
  if (mode !== 'story' || e.target.closest('input, select')) return;
  if (['ArrowRight', 'PageDown'].includes(e.key)) { e.preventDefault(); story.go(story.i + 1); }
  if (['ArrowLeft', 'PageUp'].includes(e.key)) { e.preventDefault(); story.go(story.i - 1); }
});

// ---------- loop ----------
const clock = new THREE.Clock();
function loop() {
  const dt = Math.min(clock.getDelta(), .05), time = clock.elapsedTime;
  world.update(dt, time);
  for (const m of riders) if (!m.paused) m.update(dt, time);
  for (const f of tickers) f(dt, time);
  updateFx(dt);
  inside.update(dt);
  if (!inside.active) rig.update(dt);
  bubbles.update(dt);
  composer.render();
  requestAnimationFrame(loop);
}

applyStatic();
const h = location.hash.slice(1);
if (h.startsWith('shot=')) { rig.jump(h.slice(5)); mode = 'shot'; }
else if (h === 'sandbox' || h === 'quiz') setMode(h);
else setMode('story', { step: Math.max(0, Math.min(STEPS.length - 1, (parseInt(h.split('=')[1]) || 1) - 1)) });
loop();
document.getElementById('loading').classList.add('done');
window.demo = { THREE, scene, camera, world, rig, inside, story, sandbox, quiz, setMode, riders, said, ready: true };
