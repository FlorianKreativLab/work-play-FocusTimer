import * as THREE from "/libs/three/three.module.js";


import scene, {
  ambientLight,
  sunLight,
  moonLight,
  sunMesh,
  moonMesh,
  daySky,
  nightSky,
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


function animate() {
  // immer
  requestAnimationFrame(animate);

  const delta = clock.getDelta();

  if (controls) controls.update(delta);
  if (character) character.update(delta);

  updateCamera(character, getHeightAt);

  // Himmel an Spielerposition kleben
  if (character && character.model) {
    const playerPos = character.model.position;
    daySky.position.copy(playerPos);
    nightSky.position.copy(playerPos);
  }

  const isTimerActive = isGameLocked();

  if (isTimerActive) {
    // ZYKLUSMODUS (Timer läuft)

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
    const sunYmax = 600; // maximale Höhe auf der Kreisbahn

    // Basis: 1 oben, 0 am/bis unter dem Horizont
    let dayFactor = sunY / sunYmax;

    // clamp auf 0..1
    if (dayFactor > 1) dayFactor = 1;
    if (dayFactor < 0) dayFactor = 0;

    // Licht: Ambient + Sonne + Mond
    // bei Tag: dayFactor ~1 → hell
    // bei Nacht: dayFactor ~0 → nur Mond / sehr wenig Ambient
    ambientLight.intensity  = 0;
    sunLight.intensity      = dayFactor;             // 1 Tag, 0 Nacht
    moonLight.intensity     = 1 - dayFactor;         // 0 Tag, 1 Nacht

    // Himmel: Tag langsam dunkel, Nacht langsam hell
    daySky.material.opacity   = dayFactor;           // 1 Tag, 0 Nacht
    nightSky.material.opacity = 1 - dayFactor;       // 0 Tag, 1 Nacht

  } else {
    // SPIELMODUS (Timer aus)

    // Feste, angenehme Tageslicht-Situation
    ambientLight.intensity = 0.2;   // schön hell
    sunLight.intensity     = 1;
    moonLight.intensity    = 0;     // Mond spielt hier keine Rolle

    // Sonne fest an einen Punkt setzen
    sunLight.position.set(300, 400, 100);
    sunMesh.position.copy(sunLight.position);

    // Mond weit unter den Horizont „parken“
    moonLight.position.set(0, -1000, 0);
    moonMesh.position.copy(moonLight.position);

    // Himmel immer Tag
    daySky.material.opacity   = 1;
    nightSky.material.opacity = 0;
  }

  renderer.render(scene, camera);
}


// Start
init();