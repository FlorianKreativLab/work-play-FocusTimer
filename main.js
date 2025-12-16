import * as THREE from "/libs/three/three.module.js";

import scene, {
  ambientLight,
  sunLight,
  moonLight,
  sunMesh,
  moonMesh,
  daySky,
  nightSky,
  starField,
  cloudLayers,
  cloudMaterial,
} from "./src/core/scene.js";
import { renderer } from "./src/core/renderer.js";
import { camera, setupCameraControls, updateCamera } from "./src/core/camera.js";
import { getDayNightProgress } from "./src/core/dayNight.js";
import { createTerrain, getHeightAt } from "./src/world/terrain.js";
import { loadHouse } from "./src/world/house.js";

import { Character } from "./src/player/character.js";
import { PlayerControls } from "./src/player/controls.js";
import { isGameLocked } from "./src/core/gameState.js";

// -------------------------------------------------
// Welt aufbauen
// -------------------------------------------------
createTerrain(scene);
loadHouse(scene, getHeightAt);

// -------------------------------------------------
// Spieler-Figur + Steuerung
// -------------------------------------------------
let character;
let controls;
const clock = new THREE.Clock();

function init() {
  const playerSpawn = { x: 20, z: 10 };
  character = new Character(scene, getHeightAt, playerSpawn);
  controls = new PlayerControls(character, getHeightAt);

  handleResize();
  setupCameraControls(renderer.domElement);

  animate();
}

// -------------------------------------------------
// Resize Handling
// -------------------------------------------------
function handleResize() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

window.addEventListener("resize", handleResize);
handleResize();

// -------------------------------------------------
// Sterne Fade
// -------------------------------------------------
function getStarVisibilityFromDayFactor(dayFactor) {
  const FADE_IN_START = 0.45;
  const FADE_IN_END = 0.12;

  let d = dayFactor;
  if (d < 0) d = 0;
  if (d > 1) d = 1;

  if (d >= FADE_IN_START) return 0;
  if (d <= FADE_IN_END) return 1;

  const t = (FADE_IN_START - d) / (FADE_IN_START - FADE_IN_END);
  return t * t * (3 - 2 * t); // smoothstep
}

// -------------------------------------------------
// Wolken Update (2 Layer + Parallax)
// -------------------------------------------------
function updateCloudLayers(playerPos, delta) {
  if (!cloudLayers || !playerPos) return;

  for (const layer of cloudLayers) {
    const { range, speed, driftZ } = layer.userData;

    // Layer folgt dem Spieler (Cloud-Bubble)
    layer.position.set(playerPos.x, 0, playerPos.z);

    for (const cloud of layer.children) {
      cloud.position.x += speed * delta;
      cloud.position.z += driftZ * delta;

      const half = range * 0.5;
      if (cloud.position.x > half) cloud.position.x = -half;
      if (cloud.position.x < -half) cloud.position.x = half;
      if (cloud.position.z > half) cloud.position.z = -half;
      if (cloud.position.z < -half) cloud.position.z = half;
    }
  }
}

function updateCloudDayNight(dayFactor) {
  if (!cloudMaterial) return;

  const d = Math.max(0, Math.min(1, dayFactor));
  const dayColor = new THREE.Color(0xffffff);
  const nightColor = new THREE.Color(0x2b3640);

  //cloudMaterial.color.copy(nightColor.clone().lerp(dayColor, d));
  cloudMaterial.opacity = 0.55 + 0.45 * d;
}

// -------------------------------------------------
// Render-Loop
// -------------------------------------------------
function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();

  if (controls) controls.update(delta);
  if (character) character.update(delta);

  updateCamera(character, getHeightAt);

  // Himmel + Sterne an Spielerposition kleben
  if (character && character.model) {
    const playerPos = character.model.position;
    daySky.position.copy(playerPos);
    nightSky.position.copy(playerPos);
    if (starField) starField.position.copy(playerPos);

    updateCloudLayers(playerPos, delta);
  }

  const isTimerActive = isGameLocked();

  if (isTimerActive) {
    const p = getDayNightProgress();
    const angle = p * Math.PI * 2;

    // Sonne & Mond bewegen (Kreisbahn)
    sunLight.position.set(Math.cos(angle) * 600, Math.sin(angle) * 600, 0);
    moonLight.position.set(
      Math.cos(angle + Math.PI) * 600,
      Math.sin(angle + Math.PI) * 600,
      0
    );
    sunMesh.position.copy(sunLight.position);
    moonMesh.position.copy(moonLight.position);

    // dayFactor aus Sonnenhöhe
    const sunY = sunLight.position.y;
    const sunYmax = 600;
    let dayFactor = sunY / sunYmax;
    if (dayFactor > 1) dayFactor = 1;
    if (dayFactor < 0) dayFactor = 0;

    //updateCloudDayNight(dayFactor);

    ambientLight.intensity = 0;
    sunLight.intensity = dayFactor;
    moonLight.intensity = 1 - dayFactor;

    daySky.material.opacity = dayFactor;
    nightSky.material.opacity = 1 - dayFactor;

    if (starField) {
      starField.material.opacity = getStarVisibilityFromDayFactor(dayFactor);
    }
  } else {
    // Spielmodus: immer Tag
    ambientLight.intensity = 0.2;
    sunLight.intensity = 1;
    moonLight.intensity = 0;

    sunLight.position.set(300, 400, 100);
    sunMesh.position.copy(sunLight.position);

    moonLight.position.set(0, -1000, 0);
    moonMesh.position.copy(moonLight.position);

    daySky.material.opacity = 1;
    nightSky.material.opacity = 0;

    //updateCloudDayNight(1);

    if (starField) starField.material.opacity = 0;
  }

  renderer.render(scene, camera);
}

init();