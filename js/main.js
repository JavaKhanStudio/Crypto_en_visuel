// Entry point: renderer, bloom, the loop, and the three modes (story, sandbox, quiz).
// Deep links: #story=5, #sandbox, #quiz. ?lang=en. ?instant=1 skips camera flights
// (used by the headless screenshots in tools/shoot.py).
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { buildWorld, CASTLE_A, CASTLE_B, CITY } from './world.js';
import { CameraRig } from './camera.js';
import { initFx, updateFx, fireworks } from './fx.js';
import { Sim, wait } from './sim.js';
import { Bubbles } from './bubbles.js';
import { renderLadder, ladder3d } from './ladder.js';
import { Story, STEPS } from './story.js';
import { initSandbox } from './sandbox.js';
import { Quiz } from './quiz.js';
import { march, resetCityFlag, clearArmies } from './army.js';
import { sfx } from './sound.js';
import { t, setLang, applyStatic, onLang } from './i18n.js';

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
initFx(scene); ladder3d.init(scene);
const rig = new CameraRig(camera, canvas);
if (instant) { const fly = rig.fly.bind(rig); rig.fly = shot => fly(shot, .001); }

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new UnrealBloomPass(new THREE.Vector2(1, 1), .75, .55, .82));
composer.addPass(new OutputPass());

function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false); composer.setSize(w, h);
  camera.aspect = w / h; camera.fov = w < h ? 65 : 45; camera.updateProjectionMatrix();
}
addEventListener('resize', resize); resize();

// ---------- the pieces ----------
const bubbles = new Bubbles(camera); bubbles.instant = instant;
const toastEl = document.getElementById('toast');
let toastTimer;
function toast(text, ms = 3200) { toastEl.textContent = text; toastEl.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toastEl.classList.remove('show'), ms); }

const castleTop = { a: new THREE.Vector3(CASTLE_A.x, CASTLE_A.y + 22, 0), b: new THREE.Vector3(CASTLE_B.x, CASTLE_B.y + 22, 0) };
let sandbox = null;

const sim = new Sim(world, {
  onChange: s => { renderLadder(s); sandbox?.render(); },
  onFlag: () => sandbox?.clearFlag(),
  onFollow: m => rig.chase(m.obj),
  onMessenger: (m, ev) => {
    const to = m.from === 'a' || m.from === 'city' ? 'b' : 'a';
    if (ev === 'sent') {
      sfx.send();
      if (m.forged) bubbles.show('eve-forge', 'e', t('m.forgedE'), new THREE.Vector3(CITY.x, 26, CITY.z), { ttl: 3500 });
    } else if (ev === 'captured') {
      sfx.capture();
      bubbles.show('caught', 'e', t('m.capturedE'), m.position.clone().add(new THREE.Vector3(0, 7, 0)), { ttl: 3500 });
    } else if (ev === 'delivered') {
      sfx.arrive();
      const text = m.forged ? t('m.forgedAccepted') : m.seq <= sim.L[to] ? t('m.duplicate', { n: m.seq })
        : m.seq === 1 ? t('m.deliveredPlan') : t('m.deliveredAck', { n: m.seq });
      bubbles.show('recv-' + to, to, text, castleTop[to], { ttl: 3800 });
    } else if (ev === 'rejected') {
      sfx.reject();
      bubbles.show('recv-b', 'b', t('m.forgedRejected'), castleTop.b, { ttl: 4000 });
    }
  },
});

function resetWorld() { world.setDawn(0); resetCityFlag(world); clearArmies(world); world.setBeam(true); bubbles.clear(); }

// Sunrise (or, after a forged order, midnight) and the armies that act on it.
async function dawn(k) {
  const outcome = sim.dawn(k);
  bubbles.clear(); rig.setOrbit(0);
  rig.fly('both', 2);
  if (outcome !== 'forged') {
    await new Promise(res => { let v = 0; const tick = dt => { v = Math.min(1, v + dt / 2.4); world.setDawn(v); if (v >= 1) { tickers.delete(tick); res(); } }; tickers.add(tick); });
  } else await wait(800);
  const teams = { both: ['a', 'b'], a: ['a'], b: ['b'], forged: ['b'], none: [] }[outcome];
  const verdict = () => { toast(t('dawn.' + outcome), 5000); (outcome === 'both' ? sfx.win : outcome === 'none' ? () => {} : sfx.lose)(); };
  if (teams.length) await march(world, teams, outcome === 'both', { onHit: verdict }); else verdict();
  return outcome;
}

const ctx = { world, sim, rig, bubbles, toast, resetWorld, dawn, instant, setMode: m => setMode(m),
  onAnswer: right => { right ? sfx.win() : sfx.lose(); if (right) fireworks(new THREE.Vector3(0, 0, 0), [0xffd27a, 0x5fe39a], 3); },
  onEnd: () => fireworks(new THREE.Vector3(0, 0, 0), [0xffd27a, 0x4da3ff, 0xffc24d, 0xffffff], 16) };
const story = new Story(ctx);
sandbox = initSandbox(ctx);
const quiz = new Quiz(ctx);

// ---------- modes ----------
const panels = { story: document.getElementById('story'), sandbox: document.getElementById('sandbox'), quiz: document.getElementById('quiz') };
const ladderEl = document.getElementById('ladder');
let mode = null;
function setMode(m, opts = {}) {
  mode = m;
  for (const [k, el] of Object.entries(panels)) el.classList.toggle('hidden', k !== m);
  ladderEl.classList.toggle('hidden', m === 'quiz');
  ladder3d.setVisible(m !== 'quiz');
  document.querySelectorAll('#modes button').forEach(b => b.classList.toggle('active', b.dataset.mode === m));
  rig.setOrbit(0); story.token++;   // leaving the story cancels its running action
  if (m === 'story') story.go(opts.step ?? story.i);
  if (m === 'sandbox') { location.hash = 'sandbox'; sandbox.enter(); }
  if (m === 'quiz') {
    location.hash = 'quiz'; resetWorld(); sim.reset();
    rig.fly('overview').then(() => mode === 'quiz' && rig.setOrbit(.05));
    quiz.render();
  }
}
document.querySelectorAll('#modes button').forEach(b => b.onclick = () => { sfx.click(); setMode(b.dataset.mode); });
document.querySelectorAll('#lang button').forEach(b => b.onclick = () => setLang(b.dataset.lang));
onLang(() => { renderLadder(sim); sandbox.render(); });

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
  sim.update(dt, time);
  for (const f of tickers) f(dt, time);
  updateFx(dt);
  ladder3d.update(dt, time);
  rig.update(dt);
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
window.demo = { THREE, scene, camera, world, rig, sim, story, quiz, setMode, dawn, ready: true };
