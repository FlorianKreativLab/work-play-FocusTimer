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

  // ===== Third-Person Kamera (frei per Maus, Cyberpunk-Style) =====
  // Regler
  const camDistance = 14;   // Abstand hinter dem Spieler
  const camHeight = 7;      // Höhe über dem Spieler
  const camShoulder = 2.0;  // seitlicher Versatz (rechts). Negativ = links
  const lookAtHeight = 5;   // wohin die Kamera schaut (über dem Boden)

  // Blickrichtung der Kamera aus Yaw/Pitch (wohin du "zielst")
  const forward = new THREE.Vector3(0, 0, -1);
  forward.applyAxisAngle(new THREE.Vector3(1, 0, 0), cameraPitch);
  forward.applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraYaw);
  forward.normalize();

  // Rechts-Vektor für Schulterversatz
  const up = new THREE.Vector3(0, 1, 0);
  const right = new THREE.Vector3().crossVectors(forward, up).normalize();

  // Wunsch-Position: hinter dem Spieler (entgegen forward), etwas hoch, etwas zur Seite
  const desiredPos = new THREE.Vector3().copy(targetPos)
    .addScaledVector(forward, -camDistance)
    .addScaledVector(up, camHeight)
    .addScaledVector(right, camShoulder);

  // Smooth Follow (damit es nicht "klebt")
  // 0.0 = keine Bewegung, 1.0 = sofort. 0.12–0.2 ist meist gut.
  camera.position.lerp(desiredPos, 0.15);

  // Kamera schaut auf den Spieler (leicht erhöht)
  const lookAtPos = new THREE.Vector3(targetPos.x, targetPos.y + lookAtHeight, targetPos.z);
  camera.lookAt(lookAtPos);

  // Spieler dreht sich mit der Kamera (damit Bewegung + Animationsrichtung stimmen)
  // model.rotation.y = cameraYaw;
}

// Für Movement: aktuelle Blickrichtung (Yaw) abfragen
export function getCameraYaw() {
  return cameraYaw;
}