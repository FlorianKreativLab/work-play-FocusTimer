import * as THREE from "/libs/three/three.module.js";

import { scene } from "./src/core/scene.js";
import { renderer } from "./src/core/renderer.js";
import { camera, setupCameraControls, updateCamera } from "./src/core/camera.js";

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

  renderer.render(scene, camera);
}

// Start
init();