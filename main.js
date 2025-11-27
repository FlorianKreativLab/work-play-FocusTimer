import * as THREE from "/libs/three/three.module.js";


import scene, {
  ambientLight,
  sunLight,
  moonLight,
  sunMesh,
  moonMesh,
  daySky,
  nightSky,
  // optional ambientLight ...
} from "./src/core/scene.js";
import { renderer } from "./src/core/renderer.js";
import { camera, setupCameraControls, updateCamera } from "./src/core/camera.js";
import { getDayNightProgress } from "./src/core/dayNight.js";
import { createTerrain, getHeightAt } from "./src/world/terrain.js";
import { loadHouse } from "./src/world/house.js";

import { Character } from "./src/player/character.js";
import { PlayerControls } from "./src/player/controls.js";

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
  requestAnimationFrame(animate);

  const delta = clock.getDelta();

  if (controls) controls.update(delta);
  if (character) character.update(delta);

  updateCamera(character, getHeightAt);



  // Weicher, kontrollierter Tag/Nacht-Faktor
  const p = getDayNightProgress();     // 0..1
  const angle = p * Math.PI * 2;

  // Fokus = Tag, Pause = Übergang zu Nacht
  let dayFactor;
  if (p < 0.5) {
    dayFactor = 1;                          // voller Tag
  } else {
    const t = (p - 0.5) / 0.5;              // 0..1
    dayFactor = 1 - t;                      // 1 -> 0
  }

  // unten ausklingen lassen -> richtige Nacht
  if (dayFactor < 0.2) dayFactor = 0;

  // Himmel
  if (character && character.model) {
    const playerPos = character.model.position;
    daySky.position.copy(playerPos);
    nightSky.position.copy(playerPos);
  }

  daySky.material.opacity = dayFactor;
  nightSky.material.opacity = 1 - dayFactor;

  // Licht
  ambientLight.intensity = 0.1 + 0.7 * dayFactor;
  sunLight.intensity      = dayFactor;
  moonLight.intensity     = 1 - dayFactor;

  // Sonne & Mond (wie gehabt)
  sunLight.position.set(
    Math.cos(angle) * 400,
    Math.sin(angle) * 400,
    0
  );
  moonLight.position.set(
    Math.cos(angle + Math.PI) * 400,
    Math.sin(angle + Math.PI) * 400,
    0
  );
  sunMesh.position.copy(sunLight.position);
  moonMesh.position.copy(moonLight.position);

  renderer.render(scene, camera);
  }


// Start
init();