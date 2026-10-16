// Entry point: renderer, bloom, the loop, and the three modes (story, sandbox, quiz).
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { buildWorld } from './world.js';
import { CameraRig } from './camera.js';

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
const rig = new CameraRig(camera, canvas);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), .75, .55, .82);
composer.addPass(bloom);
composer.addPass(new OutputPass());

function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false); composer.setSize(w, h);
  camera.aspect = w / h; camera.updateProjectionMatrix();
}
addEventListener('resize', resize); resize();

const clock = new THREE.Clock();
const tickers = new Set();
function loop() {
  const dt = Math.min(clock.getDelta(), .05), t = clock.elapsedTime;
  world.update(dt, t);
  for (const f of tickers) f(dt, t);
  rig.update(dt);
  composer.render();
  requestAnimationFrame(loop);
}
loop();

window.demo = { THREE, scene, camera, world, rig, tickers, ready: true };
document.getElementById('loading').classList.add('done');
if (location.hash.includes('shot=')) rig.jump(location.hash.split('shot=')[1]); else rig.fly('intro', 3);
