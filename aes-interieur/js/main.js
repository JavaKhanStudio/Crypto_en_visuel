// Entry point of episode 11 « AES de l'intérieur » (r335): renderer, bloom, the loop, the room, and the
// three modes (story, sandbox, quiz). It all happens in Alice's keep, the AES room of episode 1.2.
// Deep links: #story=5, #sandbox, #quiz. ?lang=en. ?instant=1 plays every beat to its end at once
// (used by the headless screenshots in tools/shoot.py); for a mid-animation shot, load ?instant=1,
// then set demo.room.instant = false, demo.room.speed = 1 and call demo.room.play().
import * as THREE from 'three';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { qualityComposer } from '../../lib/quality.js';
import { addBloom } from '../../lib/bloom.js';
import { initFx, updateFx, fireworks } from '../../lib/fx.js';
import { Quiz } from '../../lib/quiz.js';
import { sfx } from '../../lib/sound.js';
import { Room } from './room.js';
import { Bubbles } from '../../lib/bubbles.js';
import { Story, STEPS } from './story.js';
import { initSandbox } from './sandbox.js';
import { QUIZ } from './quiz-data.js';
import * as i18n from './i18n.js';
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
renderer.toneMappingExposure = 1.3;

const camera = new THREE.PerspectiveCamera(45, 1, .3, 300);
const room = new Room({ camera, instant });
const composer = qualityComposer(renderer);
const renderPass = new RenderPass(room.scene, camera); composer.addPass(renderPass);
addBloom(composer, .6, .55, .85);   // r548: the bloom and the output pass, lib/bloom.js

function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false); composer.setSize(w, h);
  camera.aspect = w / h; camera.fov = w < h ? 65 : 45; camera.updateProjectionMatrix();
  room.resize();
}
addEventListener('resize', resize); resize();

// ---------- the pieces ----------
const bubbles = new Bubbles(camera, { raw: i18n.raw }); bubbles.instant = instant;
addEventListener('resize', () => { if (room.quiet) bubbles.clear(); });   // turned to a short phone band: the cubes take it (r442)
const toastEl = document.getElementById('toast');
let toastTimer;
function toast(text, ms = 3200) { toastEl.textContent = text; toastEl.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toastEl.classList.remove('show'), ms); }
room.onBuild = scene => initFx(scene);

const ctx = { room, bubbles, toast, instant, renderCard, mode: () => mode, setMode: m => setMode(m),
  onAnswer: right => { right ? sfx.win() : sfx.lose(); if (right) fireworks(room.m.G.clone(), [0xffd27a, 0x5fe39a], 3); },
  onEnd: () => fireworks(room.m.G.clone(), [0xffd27a, 0xb77ff0, 0xffc24d, 0xffffff], 16) };
const story = new Story(ctx);
const sandbox = initSandbox(ctx);
const quiz = new Quiz(ctx, QUIZ, i18n);

// ---------- modes ----------
const panels = { story: document.getElementById('story'), sandbox: document.getElementById('sandbox'), quiz: document.getElementById('quiz') };
const card = document.getElementById('card');
// On a phone the card folds to its title line, so the room and the bubbles keep their space (r84, r85);
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
  // a phone whose panel leaves less than the folded card's line under the controls (360x640, the last step) has no
  // card: hung from the panel it would climb over the modes row (r481)
  const room = open ? open.getBoundingClientRect().top - top : innerHeight;
  card.classList.toggle('cramped', innerWidth <= 900 && card.classList.contains('folded') && room < 56);
}
const docker = new ResizeObserver(dock);
for (const el of [...Object.values(panels), document.getElementById('topbar')]) docker.observe(el);
addEventListener('resize', dock);
function setMode(m, opts = {}) {
  mode = m; card.classList.toggle('hidden', m === 'quiz');
  for (const [k, el] of Object.entries(panels)) el.classList.toggle('hidden', k !== m);
  document.querySelectorAll('#modes button').forEach(b => b.classList.toggle('active', b.dataset.mode === m));
  story.token++; bubbles.clear();
  if (m === 'story') story.go(opts.step ?? story.i);
  if (m === 'sandbox') { location.hash = 'sandbox'; sandbox.enter(); }
  if (m === 'quiz') {
    location.hash = 'quiz';
    story.load({});   // Alice's run, behind the quiz
    room.beat('end');
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
  const dt = Math.min(clock.getDelta(), .05);
  updateFx(dt);
  room.update(dt);
  bubbles.update(dt);
  composer.render();
  requestAnimationFrame(loop);
}

applyStatic();
const h = location.hash.slice(1);
if (h === 'sandbox' || h === 'quiz') setMode(h);
else setMode('story', { step: Math.max(0, Math.min(STEPS.length - 1, (parseInt(h.split('=')[1]) || 1) - 1)) });
loop();
document.getElementById('loading').classList.add('done');
window.demo = { THREE, renderer, composer, camera, room, story, sandbox, quiz, setMode, bubbles, ready: true };
