// Entry point: renderer, bloom, the loop, and the three modes (story, sandbox, quiz).
// Enigma, the real setting (episode 5.2 of « Crypto en visuel »). Deep links: #story=5, #sandbox, #quiz. ?lang=en. ?instant=1 skips camera flights and
// plays the props' animations at once (used by the headless screenshots in tools/shoot.py).
import * as THREE from 'three';
import { qualityComposer, addBloom } from '../../ficelle/lib/episode.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { buildWorld } from '../../ficelle/lib/enigma/world.js';
import { Stage } from './stage.js';
import { CameraRig } from './camera.js';
import { initFx, updateFx, fireworks } from '../../ficelle/lib/fx.js';
import { Bubbles } from '../../ficelle/lib/bubbles.js';
import { Story, STEPS } from './story.js';
import { initSandbox } from './sandbox.js';
import { Quiz } from '../../ficelle/lib/quiz.js';
import { QUIZ } from './quiz-data.js';
import * as i18n from './i18n.js';
import { sfx } from '../../ficelle/lib/sound.js';
import { renderCard } from './card.js';
import { setLang, applyStatic } from './i18n.js';

const params = new URLSearchParams(location.search);
const instant = params.has('instant');

// ---------- renderer ----------
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas });   // r254: the antialiasing is the composer's MSAA, lib/quality.js
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, 1, .1, 4000);
const world = buildWorld(scene);
const tickers = new Set();
initFx(scene);
const stage = new Stage(world, tickers);
if (instant) stage.speed = 50;
stage.onChange = () => renderCard(stage);
const rig = new CameraRig(camera, canvas);
if (instant) { const fly = rig.fly.bind(rig); rig.fly = shot => fly(shot, .001); }

const composer = qualityComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
addBloom(composer, .45, .5, .9);   // r548: the bloom and the output pass, lib/bloom.js

function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false); composer.setSize(w, h);
  camera.aspect = w / h; camera.fov = w < h ? 65 : 45; camera.updateProjectionMatrix();
}
addEventListener('resize', resize); resize();

// ---------- the pieces ----------
const bubbles = new Bubbles(camera, { raw: i18n.raw }); bubbles.instant = instant;
bubbles.avoid = () => [...Object.values(stage.names.a), ...Object.values(stage.names.b), ...Object.values(stage.rackTags), stage.rackSum, ...stage.faces];
const toastEl = document.getElementById('toast');
let toastTimer;
function toast(text, ms = 3200) { toastEl.textContent = text; toastEl.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toastEl.classList.remove('show'), ms); }

const celebrate = () => { sfx.win(); fireworks(new THREE.Vector3(70, 6, -12), [0xffd66b, 0xff8a5c, 0x5fd1ff, 0x9be37a], 8, 16); };
const ctx = { world, stage, rig, bubbles, toast, instant, celebrate, setMode: m => setMode(m),
  onAnswer: right => { right ? sfx.win() : sfx.lose(); },
  onEnd: () => fireworks(new THREE.Vector3(0, 40, -30), [0xffd66b, 0xff8a5c, 0x5fd1ff, 0xffd84d, 0x9be37a], 14, 120) };
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
  rig.setOrbit(0); story.token++; bubbles.clear();   // leaving the story cancels its running action
  sandbox.leave();
  if (m === 'story') story.go(opts.step ?? story.i);
  if (m === 'sandbox') { location.hash = 'sandbox'; sandbox.enter(); }
  if (m === 'quiz') {
    location.hash = 'quiz'; stage.apply(story.state(STEPS.length - 1));
    rig.fly('overview').then(() => mode === 'quiz' && rig.setOrbit(.04));
    quiz.render();
  }
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
// demo.freeze() stops the clock and demo.step(dt) advances it by hand
const clock = new THREE.Clock();
let frozen = false, time = 0;
function tick(dt) {
  time += dt;
  world.update(dt, time);
  for (const f of [...tickers]) f(dt, time);
  updateFx(dt);
  rig.update(dt);
  bubbles.update(dt);
  composer.render();
}
function loop() {
  if (composer.idle()) return requestAnimationFrame(loop);   // r546: a still scene at 30 fps (lib/still.js)
  const dt = Math.min(clock.getDelta(), .05);
  if (!frozen) tick(dt);
  requestAnimationFrame(loop);
}

applyStatic();
const h = location.hash.slice(1);
if (h.startsWith('shot=')) { stage.apply(story.state(STEPS.length - 1)); rig.jump(h.slice(5)); mode = 'shot'; }
else if (h === 'sandbox' || h === 'quiz') setMode(h);
else setMode('story', { step: Math.max(0, Math.min(STEPS.length - 1, (parseInt(h.split('=')[1]) || 1) - 1)) });
loop();
document.getElementById('loading').classList.add('done');
window.demo = { THREE, renderer, composer, scene, camera, world, stage, rig, bubbles, story, sandbox, quiz, setMode, ready: true,
  freeze: () => { frozen = true; }, step: dt => tick(dt) };
