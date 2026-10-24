// Entry point of episode 1.2 « Eve lit tout »: renderer, bloom, the loop, the riders, and the three
// modes (story, sandbox, quiz). Same valley, castles and cast as episode 1.1 (deux-generaux/).
// Deep links: #story=5, #sandbox, #quiz. ?lang=en. ?instant=1 skips camera flights and rides fast
// (used by the headless screenshots in tools/shoot.py).
import * as THREE from 'three';
import { qualityComposer, addBloom } from '../../ficelle/lib/episode.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { buildWorld, CASTLE_B } from '../../ficelle/lib/saga/world.js';
import { CameraRig } from '../../ficelle/lib/saga/camera.js';
import { initFx, updateFx, fireworks } from '../../ficelle/lib/fx.js';
import { Messenger } from '../../ficelle/lib/messenger.js';
import { Bubbles } from '../../ficelle/lib/bubbles.js';
import { Inside } from '../../ficelle/lib/room.js';
import { ROOM } from './inside.js';
import { Story, STEPS } from './story.js';
import { initSandbox } from './sandbox.js';
import { Quiz } from '../../ficelle/lib/quiz.js';
import { QUIZ } from './quiz-data.js';
import * as i18n from './i18n.js';
import { renderCard } from './card.js';
import { sfx } from '../../ficelle/lib/sound.js';
import { t, setLang, applyStatic } from './i18n.js';

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
const world = buildWorld(scene);   // 1.1's Middle-earth castles; the room goes in by door 'a' (r426, r425)
const tickers = new Set(); world.tickers = tickers;
initFx(scene);
const rig = new CameraRig(camera, canvas);
if (instant) { const fly = rig.fly.bind(rig); rig.fly = shot => fly(shot, .001); }

const composer = qualityComposer(renderer);
const renderPass = new RenderPass(scene, camera); composer.addPass(renderPass);
addBloom(composer, .75, .55, .82);   // r548: the bloom and the output pass, lib/bloom.js

function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false); composer.setSize(w, h);
  camera.aspect = w / h; camera.fov = w < h ? 65 : 45; camera.updateProjectionMatrix();
  inside?.resize(camera.aspect, camera.fov);
}
let inside;
addEventListener('resize', resize); resize();

// ---------- the pieces ----------
const bubbles = new Bubbles(camera, { raw: i18n.raw }); bubbles.instant = instant;
// a step that explains a mechanism can zoom into the castle, where a room shows it at work (r103)
inside = new Inside({ renderer, renderPass, camera, rig, bubbles, instant, castles: { a: world.castleA, b: world.castleB }, ...ROOM }); resize();
const toastEl = document.getElementById('toast');
let toastTimer;
function toast(text, ms = 3200) { toastEl.textContent = text; toastEl.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toastEl.classList.remove('show'), ms); }
const wait = ms => new Promise(r => setTimeout(r, instant ? Math.min(ms, 60) : ms));
const bobTop = new THREE.Vector3(CASTLE_B.x, CASTLE_B.y + 22, 0);

// Alice's riders. Eve's guards stop each one under her walls (stopAt .5, where the road passes her
// gate); Eve reads the scroll aloud (eve, then eve2 if she recognises it), lets him go, and Bob
// reads it at his gate. Resolves 'delivered', or 'cancelled' when the world is reset under it.
const riders = new Set(), said = [];   // said: what Eve and Bob read aloud, for tests/eve_story.py
async function ride({ eve, eve2, bob, live = () => true, onRead }) {
  const m = new Messenger(world, { from: 'a', fate: 'deliver', stopAt: .5, speed: instant ? 400 : 30 });
  riders.add(m); sfx.send(); rig.chase(m.obj);
  const held = await Promise.race([m.stopped, m.done]);
  if (held !== m || !live()) return 'cancelled';
  sfx.reject(); rig.fly('gate', 1.2);
  const above = () => m.position.clone().add(new THREE.Vector3(0, 7, 0)), scroll = m.obj.userData.scroll;
  scroll.scale.set(2.2, 2.2, 2.2); scroll.position.y = 5.2;   // the scroll comes out, held up to read
  bubbles.show('eve-read', 'e', eve, above); said.push(['e', eve]);
  onRead?.();
  await wait(3200);
  if (eve2 && live()) { bubbles.show('eve-read', 'e', eve2, above); said.push(['e', eve2]); await wait(3000); }
  if (!live()) return 'cancelled';
  bubbles.hide('eve-read'); scroll.scale.set(1, 1, 1); scroll.position.y = 3.3;
  m.release(); rig.chase(m.obj);
  const r = await m.done; riders.delete(m);
  if (r !== 'delivered' || !live()) return r;
  sfx.arrive(); bubbles.show('bob-read', 'b', bob, bobTop, { ttl: 7000 }); said.push(['b', bob]);
  await wait(1600);
  return r;
}
function resetWorld() {
  for (const m of riders) m.finish('cancelled');
  riders.clear(); bubbles.clear(); rig.stopFollow();
}

const ctx = { world, rig, bubbles, inside, toast, instant, ride, resetWorld, renderCard, mode: () => mode, setMode: m => setMode(m),
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
  rig.setOrbit(0); story.token++; sandbox.token++; resetWorld();   // leaving a mode cancels its running ride
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
  if (composer.idle()) return requestAnimationFrame(loop);   // r546: a still scene at 30 fps (lib/still.js)
  const dt = Math.min(clock.getDelta(), .05), time = clock.elapsedTime;
  world.update(dt, time);
  for (const m of riders) m.update(dt, time);
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
window.demo = { THREE, renderer, composer, scene, camera, world, rig, inside, story, sandbox, quiz, setMode, riders, said, ready: true };
