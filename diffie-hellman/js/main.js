// Entry point: renderer, bloom, the loop, and the three modes (story, sandbox, quiz).
// Deep links: #story=5, #sandbox, #quiz. ?lang=en. ?instant=1 skips camera flights and
// plays the props' animations at once (used by the headless screenshots in tools/shoot.py).
import * as THREE from 'three';
import { qualityComposer, addBloom } from '../../ficelle/lib/episode.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { buildWorld } from './world.js';
import { Stage } from './stage.js';
import { CameraRig } from './camera.js';
import { initFx, updateFx, fireworks } from '../../ficelle/lib/fx.js';
import { Bubbles } from '../../ficelle/lib/bubbles.js';
import { colorOf } from './paint.js';
import { Story, STEPS } from './story.js';
import { initSandbox } from './sandbox.js';
import { Quiz } from '../../ficelle/lib/quiz.js';
import { QUIZ } from './quiz-data.js';
import * as i18n from './i18n.js';
import { sfx } from '../../ficelle/lib/sound.js';
import { setLang, applyStatic, t, raw } from './i18n.js';

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
const camera = new THREE.PerspectiveCamera(45, 1, .3, 1500);
const world = buildWorld(scene);
const tickers = new Set();
initFx(scene);
const stage = new Stage(world, tickers);
if (instant) stage.speed = 50;
// a pot's tag: its colour's name, « (secret) » on a secret pot, and in the numbers step the slide's value
const NUMBERS = { J: 'g = 5, p = 23', R: 'a = 6', JR: 'A = 8', B: 'b = 15', BJ: 'B = 19', BJR: '2' };
stage.labelText = p => {
  const r = p.userData.recipe;
  let s = raw('paint')[r] ?? t('paint.mix');
  if (p.userData.secret) s += ' ' + t('paint.secret');
  if (stage.st.numbers && NUMBERS[r]) s += ' · ' + NUMBERS[r];
  return s;
};
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
const bubbles = new Bubbles(camera, { raw: i18n.raw, colorOf }); bubbles.instant = instant;
const toastEl = document.getElementById('toast');
let toastTimer;
function toast(text, ms = 3200) { toastEl.textContent = text; toastEl.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toastEl.classList.remove('show'), ms); }

const celebrate = () => { sfx.win(); fireworks(new THREE.Vector3(0, -10, -4), [0x7a4626, 0xff8a1c, 0x3e9e3a, 0xffcc1a], 8); };
const ctx = { world, stage, rig, bubbles, toast, instant, celebrate, setMode: m => setMode(m),
  onAnswer: right => { right ? sfx.win() : sfx.lose(); },
  onEnd: () => fireworks(new THREE.Vector3(0, -10, -4), [0xffcc1a, 0xd8262e, 0x2a62d6, 0xff8a1c, 0x3e9e3a], 14) };
const story = new Story(ctx);
const sandbox = initSandbox(ctx);
const quiz = new Quiz(ctx, QUIZ, i18n);

// ---------- modes ----------
const panels = { story: document.getElementById('story'), sandbox: document.getElementById('sandbox'), quiz: document.getElementById('quiz') };
let mode = null;
function setMode(m, opts = {}) {
  mode = m;
  for (const [k, el] of Object.entries(panels)) el.classList.toggle('hidden', k !== m);
  document.querySelectorAll('#modes button').forEach(b => b.classList.toggle('active', b.dataset.mode === m));
  rig.setOrbit(0); story.token++; bubbles.clear();   // leaving the story cancels its running action
  sandbox.leave();
  if (m === 'story') story.go(opts.step ?? story.i);
  if (m === 'sandbox') { location.hash = 'sandbox'; sandbox.enter(); }
  if (m === 'quiz') {
    location.hash = 'quiz'; stage.apply(STEPS[STEPS.length - 1].state);
    rig.fly('overview').then(() => mode === 'quiz' && rig.setOrbit(.04));
    quiz.render();
  }
}
document.querySelectorAll('#modes button').forEach(b => b.onclick = () => { sfx.click(); setMode(b.dataset.mode); });
document.querySelectorAll('#lang button').forEach(b => b.onclick = () => { setLang(b.dataset.lang); stage.relabel(); });

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
  for (const f of [...tickers]) f(dt, time);
  updateFx(dt);
  rig.update(dt);
  bubbles.update(dt);
  composer.render();
  requestAnimationFrame(loop);
}

applyStatic();
const h = location.hash.slice(1);
if (h.startsWith('shot=')) { stage.apply(STEPS[STEPS.length - 1].state); rig.jump(h.slice(5)); mode = 'shot'; }
else if (h === 'sandbox' || h === 'quiz') setMode(h);
else setMode('story', { step: Math.max(0, Math.min(STEPS.length - 1, (parseInt(h.split('=')[1]) || 1) - 1)) });
loop();
document.getElementById('loading').classList.add('done');
window.demo = { THREE, renderer, composer, scene, camera, world, stage, rig, story, sandbox, quiz, setMode, ready: true };
