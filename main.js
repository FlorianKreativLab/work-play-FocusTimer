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
loadHouse(scene, getHeightAt); // Haus an seiner Standardposition

// -------------------------------------------------
// Spieler-Figur + Steuerung
// -------------------------------------------------

let character;
let controls;
const clock = new THREE.Clock();

function init() {
  // Spieler neben dem Haus spawnen (z.B. bei x=10,z=0)
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

// Initiale Größenanpassung beim Start
handleResize();

// -------------------------------------------------
// Render-Loop
// -------------------------------------------------


// Fade Funktion für die Sterne (basierend auf dayFactor: 1=Tag, 0=Nacht)
function getStarVisibilityFromDayFactor(dayFactor) {
  // Sterne sollen erst in der Dämmerung kommen und nachts voll da sein.
  // dayFactor: 1 = Tag, 0 = Nacht
  const FADE_IN_START = 0.45;  // ab hier beginnen Sterne sichtbar zu werden
  const FADE_IN_END   = 0.12;  // ab hier sind Sterne voll sichtbar

  // clamp
  let d = dayFactor;
  if (d < 0) d = 0;
  if (d > 1) d = 1;

  // Tag
  if (d >= FADE_IN_START) return 0;

  // Nacht
  if (d <= FADE_IN_END) return 1;

  // Dämmerung: mappe d von [FADE_IN_START .. FADE_IN_END] auf [0..1]
  // und glätte mit smoothstep
  const t = (FADE_IN_START - d) / (FADE_IN_START - FADE_IN_END); // 0..1
  return t * t * (3 - 2 * t); // smoothstep
}

// ===== Wolken Update (2 Layer + Parallax) =====
function updateCloudLayers(playerPos, delta) {
  if (!cloudLayers || !playerPos) return;

  for (const layer of cloudLayers) {
    const { y, range, speed, driftZ } = layer.userData;

    // „Cloud-Bubble“ um den Spieler: Layer folgt grob dem Spieler, Wolken bewegen sich relativ darin
    layer.position.set(playerPos.x, 0, playerPos.z);

    // Wolken bewegen (Parallax durch unterschiedliche speed)
    for (const cloud of layer.children) {
      cloud.position.x += speed * delta;
      cloud.position.z += driftZ * delta;

      // Wrap: wenn raus, auf der anderen Seite wieder rein
      const half = range * 0.5;
      if (cloud.position.x > half) cloud.position.x = -half;
      if (cloud.position.x < -half) cloud.position.x = half;

      if (cloud.position.z > half) cloud.position.z = -half;
      if (cloud.position.z < -half) cloud.position.z = half;

      // Höhe leicht stabilisieren (falls mal verschoben)
      // (Layer selbst hängt am Spieler, Wolken bleiben relativ)
      // y ist bereits in cloud.position.y gesetzt; kein dauerndes Zurücksetzen nötig.
    }
  }
}

function updateCloudDayNight(dayFactor) {
  if (!cloudMaterial) return;

  // dayFactor: 1=Tag, 0=Nacht
  // Wir interpolieren zwischen hell (Tag) und dunkel (Nacht)
  const d = Math.max(0, Math.min(1, dayFactor));

  // Ziel-Farben (subtil, low-poly)
  const dayColor = new THREE.Color(0xffffff);
  const nightColor = new THREE.Color(0x2b3640); // blau-grau

  // mix: night -> day
  const c = nightColor.clone().lerp(dayColor, d);
  cloudMaterial.color.copy(c);

  // nachts etwas transparenter, damit Sterne durchscheinen
  // (nicht komplett weg)
  cloudMaterial.opacity = 0.55 + 0.45 * d; // Nacht ~0.55, Tag ~1.0
}

function animate() {
  // immer
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

    if (starField) {
      starField.position.copy(playerPos);
    }

    // Wolken-„Bubble“ + Parallax
    updateCloudLayers(playerPos, delta);
  }

  const isTimerActive = isGameLocked();

  if (isTimerActive) {
    // ===============================
    // ZYKLUSMODUS (Timer läuft)
    // ===============================

    const p = getDayNightProgress();     // 0..1
    const angle = p * Math.PI * 2;       // 0..2π

    // Sonne & Mond bewegen (Kreisbahn)
    sunLight.position.set(
      Math.cos(angle) * 600,
      Math.sin(angle) * 600,
      0
    );
    moonLight.position.set(
      Math.cos(angle + Math.PI) * 600,
      Math.sin(angle + Math.PI) * 600,
      0
    );
    sunMesh.position.copy(sunLight.position);
    moonMesh.position.copy(moonLight.position);

    // Helligkeit abhängig von Sonnenhöhe
    const sunY = sunLight.position.y;
    const sunYmax = 600;

    let dayFactor = sunY / sunYmax;
    if (dayFactor > 1) dayFactor = 1;
    if (dayFactor < 0) dayFactor = 0;

    // Wolken an Tag/Nacht anpassen
    updateCloudDayNight(dayFactor);

    // Licht
    ambientLight.intensity = 0;
    sunLight.intensity     = dayFactor;
    moonLight.intensity    = 1 - dayFactor;

    // Himmel
    daySky.material.opacity   = dayFactor;
    nightSky.material.opacity = 1 - dayFactor;

    // ⭐ Sterne (Fade abhängig von der tatsächlichen Sonnenhöhe via dayFactor)
    if (starField) {
      const starVisibility = getStarVisibilityFromDayFactor(dayFactor);
      starField.material.opacity = starVisibility;
    }

  } else {
    // ===============================
    // SPIELMODUS (Timer aus)
    // ===============================

    ambientLight.intensity = 0.2;
    sunLight.intensity     = 1;
    moonLight.intensity    = 0;

    sunLight.position.set(300, 400, 100);
    sunMesh.position.copy(sunLight.position);

    moonLight.position.set(0, -1000, 0);
    moonMesh.position.copy(moonLight.position);

    // Himmel immer Tag
    daySky.material.opacity   = 1;
    nightSky.material.opacity = 0;

    // Wolken im Spielmodus immer Tag
    updateCloudDayNight(1);

    // ⭐ Sterne im Spielmodus aus
    if (starField) {
      starField.material.opacity = 0;
    }
  }

  renderer.render(scene, camera);
}


// Start
init();