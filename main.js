import * as THREE from "/libs/three/three.module.js";


import scene, { sunLight, moonLight, sunMesh, moonMesh } 
  from "./src/core/scene.js";
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

  // Tag-Nacht-Zyklus: Sonne und Mond Position
 const p = getDayNightProgress();
 const angle = p * Math.PI * 2;

  //const time = performance.now() * 0.00015;
  //const angle = (time % (Math.PI * 2));  // Zeit in Sekunden

  sunLight.position.set(
    Math.cos(angle) * 200,
    Math.sin(angle) * 200,
    50
  );

  moonLight.position.set(
    Math.cos(angle + Math.PI) * 200,
    Math.sin(angle + Math.PI) * 200,
    -50
  );

  sunMesh.position.copy(sunLight.position);
  moonMesh.position.copy(moonLight.position);

  renderer.render(scene, camera);
}


// Start
init();