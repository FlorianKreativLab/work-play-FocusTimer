// core/camera.js
import * as THREE from "/libs/three/three.module.js";

// Zentrale Kamera-Instanz
export const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

// Grundposition (wird später von der Kamera-Steuerung überschrieben)
camera.position.set(0, 10, 20);
camera.lookAt(0, 0, 0);

// --- Interner Kamera-Status für Third-Person-Steuerung ---
let cameraYaw = 0;                 // horizontale Drehung
let cameraPitch = -0.5;            // vertikale Neigung (leicht nach unten)
const minPitch = -1.4;             // nicht zu weit nach unten
const maxPitch = -0.2;             // nicht zu weit nach oben

let cameraDistance = 40;           // Start-Abstand
const minDistance = 10;            // nah am Spieler
const maxDistance = 50;            // weit weg

const cameraSensitivity = 0.003;   // Maus-Sensitivität

let isRightMouseDown = false;

// Initialisiert Maus- und Scroll-Events für die Kamera
export function setupCameraControls(domElement) {
  const canvas = domElement;

  // Pointer Lock aktivieren, damit der Mauszeiger nicht am Rand stoppt
  canvas.addEventListener("click", () => {
    if (document.pointerLockElement !== canvas) {
      canvas.requestPointerLock();
    }
  });

  // Rechte Maustaste gedrückt halten = freies Umsehen
  window.addEventListener("mousedown", (e) => {
    if (e.button === 2) {
      isRightMouseDown = true;
    }
  });

  window.addEventListener("mouseup", (e) => {
    if (e.button === 2) {
      isRightMouseDown = false;
    }
  });

  // Kontextmenü unterdrücken, damit Rechtsklick nicht das Menü öffnet
  window.addEventListener("contextmenu", (e) => e.preventDefault());

  // Mausbewegung: freie Kamerarotation (nur wenn rechte Maustaste gehalten wird)
  window.addEventListener("mousemove", (event) => {
    if (!isRightMouseDown) return;

    const dx = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
    const dy = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

    cameraYaw   -= dx * cameraSensitivity;
    cameraPitch -= dy * cameraSensitivity;

    // Pitch begrenzen, damit die Kamera nicht überschlägt
    cameraPitch = Math.max(minPitch, Math.min(maxPitch, cameraPitch));
  });

  // Zoom per Mausrad
  window.addEventListener("wheel", (event) => {
    cameraDistance += event.deltaY * 0.05;

    // Grenzen
    cameraDistance = Math.max(minDistance, Math.min(maxDistance, cameraDistance));
  });
}

// Wird in jedem Frame von main.js aufgerufen
export function updateCamera(character, getHeightAt) {
  if (!character || !character.model) return;

  const model = character.model;
  const targetPos = model.position;

  // Wenn wir nicht frei umsehen (rechte Maustaste nicht gedrückt),
  // soll die Kamera der Blickrichtung des Spielers folgen
  if (!isRightMouseDown) {
    cameraYaw = model.rotation.y;
  }

  // Ausgangs-Offset entlang der Z-Achse in der aktuellen Distanz (Zoom)
  const offset = new THREE.Vector3(0, 0, cameraDistance);

  // Erst Pitch (hoch/runter) um X-Achse
  offset.applyAxisAngle(new THREE.Vector3(1, 0, 0), cameraPitch);

  // Dann Yaw (links/rechts) um Y-Achse
  offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraYaw);

  // Kamera-Position = Spieler-Position + Offset
  // +4 als Grundhöhe, damit wir etwas von oben schauen
  camera.position.set(
    targetPos.x + offset.x,
    targetPos.y + offset.y + 4,
    targetPos.z + offset.z
  );

  // sicherstellen, dass die Kamera nicht unter dem Gelände ist
  if (typeof getHeightAt === "function") {
    const groundY = getHeightAt(camera.position.x, camera.position.z);
    if (camera.position.y < groundY + 2) {
      camera.position.y = groundY + 2;
    }
  }

  // Kamera schaut leicht über den Spieler
  const lookAtPos = new THREE.Vector3(
    targetPos.x,
    targetPos.y + 2,
    targetPos.z
  );
  camera.lookAt(lookAtPos);
}