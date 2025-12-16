// core/camera.js
import * as THREE from "/libs/three/three.module.js";

// Zentrale Kamera-Instanz
export const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  10000
);

// Grundposition
camera.position.set(0, 10, 20);
camera.lookAt(0, 0, 0);

// --- Interner Kamera-Status für FPS-Steuerung ---
let cameraYaw = 0;                 // horizontale Drehung
let cameraPitch = -0.5;            // vertikale Neigung (leicht nach unten)
const minPitch = -1.4;             // nicht zu weit nach unten
const maxPitch = 1.4;              // nicht zu weit nach oben

const cameraSensitivity = 0.003;   // Maus-Sensitivität
let isPointerLocked = false;

// Initialisiert Mouse-Look via Pointer Lock (klassisch Ego-Shooter)
export function setupCameraControls(domElement) {
  const canvas = domElement;

  // Pointer Lock aktivieren (Browser erfordert User-Geste, daher Click)
  canvas.addEventListener("click", () => {
    if (document.pointerLockElement !== canvas) {
      canvas.requestPointerLock();
    }
  });

  document.addEventListener("pointerlockchange", () => {
    isPointerLocked = (document.pointerLockElement === canvas);
  });

  // Mausbewegung: Blickrichtung immer via Maus, sobald Pointer Lock aktiv
  window.addEventListener("mousemove", (event) => {
    if (!isPointerLocked) return;

    const dx = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
    const dy = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

    cameraYaw   -= dx * cameraSensitivity;
    cameraPitch -= dy * cameraSensitivity;

    // Pitch begrenzen
    cameraPitch = Math.max(minPitch, Math.min(maxPitch, cameraPitch));
  });

  // Wheel ist im FPS-Modus nicht nötig (kein Zoom).
  // Falls du später ADS/Zoom willst, machen wir das separat.
}

// Wird in jedem Frame von main.js aufgerufen
export function updateCamera(character, getHeightAt) {
  if (!character || !character.model) return;

  const model = character.model;
  const targetPos = model.position;

  // ===== FPS-Kamera =====
  // Augenhöhe über dem Spieler (ggf. an dein Modell anpassen)
  const eyeHeight = 6;

  // Kamera sitzt auf dem Spieler
  camera.position.set(
    targetPos.x,
    targetPos.y + eyeHeight,
    targetPos.z
  );

  // Blickrichtung aus Yaw/Pitch
  const forward = new THREE.Vector3(0, 0, -1);
  forward.applyAxisAngle(new THREE.Vector3(1, 0, 0), cameraPitch);
  forward.applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraYaw);

  const lookAtPos = camera.position.clone().add(forward);
  camera.lookAt(lookAtPos);

  // Spieler dreht sich mit der Kamera (damit Bewegung + Animationsrichtung stimmen)
  model.rotation.y = cameraYaw;
}

// Für Movement: aktuelle Blickrichtung (Yaw) abfragen
export function getCameraYaw() {
  return cameraYaw;
}