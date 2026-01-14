// world/terrain.js
import * as THREE from "/libs/three/three.module.js";

const hills = [];
let ground = null;

const hillCount = 25;
const maxRadius = 120;
const maxHeight = 40;

// --------- Deterministic RNG helpers ----------
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash2(seed, i) {
  // deterministischer Hash pro Index
  let x = (seed ^ (i + 0x9e3779b9)) >>> 0;
  x = Math.imul(x ^ (x >>> 16), 0x7feb352d);
  x = Math.imul(x ^ (x >>> 15), 0x846ca68b);
  x = (x ^ (x >>> 16)) >>> 0;
  return x;
}

// Hilfsfunktion: Höhe an beliebiger Position berechnen
export function getHeightAt(x, z) {
  let y = 0;
  for (const hill of hills) {
    const dx = x - hill.hx;
    const dz = z - hill.hz;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < hill.radius) {
      const t = 1 - dist / hill.radius; // 1 im Zentrum, 0 am Rand
      y += hill.height * t * t;
    }
  }
  return y;
}

export function createTerrain(scene, seed = 1337) {
  const groundGeometry = new THREE.PlaneGeometry(1000, 1000, 200, 200);
  groundGeometry.rotateX(-Math.PI / 2);

  // deterministisch: Hills neu aufbauen
  hills.length = 0;
  const rng = mulberry32(Math.floor(seed) || 0);

  // Hügelzentren anlegen
  for (let h = 0; h < hillCount; h++) {
    const hx = (rng() - 0.5) * 800;
    const hz = (rng() - 0.5) * 800;
    const radius = maxRadius * (0.5 + rng());
    const height = maxHeight * (0.5 + rng());
    hills.push({ hx, hz, radius, height });
  }

  const positions = groundGeometry.attributes.position;
  const count = positions.count;

  for (let i = 0; i < count; i++) {
    const x = positions.getX(i);
    const z = positions.getZ(i);

    let y = getHeightAt(x, z);

    // deterministisches per-vertex noise
    const n = mulberry32(hash2(Math.floor(seed) || 0, i))();
    y += (n - 0.5) * 0.8;

    positions.setY(i, y);
  }

  positions.needsUpdate = true;
  groundGeometry.computeVertexNormals();

  const groundMaterial = new THREE.MeshLambertMaterial({
    color: 0x15d17c, // dein aktuelles „Grün“
    flatShading: true,
  });

  ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.receiveShadow = true;
  scene.add(ground);
}

// Für Raycasting / Placement
export function getGroundMesh() {
  return ground;
}