// world/terrain.js
import * as THREE from "/libs/three/three.module.js";

const hills = [];
let ground = null;

const hillCount = 25;
const maxRadius = 120;
const maxHeight = 40;

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

export function createTerrain(scene) {
  const groundGeometry = new THREE.PlaneGeometry(1000, 1000, 200, 200);
  groundGeometry.rotateX(-Math.PI / 2);

  // Hügelzentren anlegen
  for (let h = 0; h < hillCount; h++) {
    const hx = (Math.random() - 0.5) * 800;
    const hz = (Math.random() - 0.5) * 800;
    const radius = maxRadius * (0.5 + Math.random());
    const height = maxHeight * (0.5 + Math.random());
    hills.push({ hx, hz, radius, height });
  }

  const positions = groundGeometry.attributes.position;
  const count = positions.count;

  for (let i = 0; i < count; i++) {
    const x = positions.getX(i);
    const z = positions.getZ(i);

    let y = getHeightAt(x, z);

    // kleines Rauschen für organischere Oberfläche
    y += (Math.random() - 0.5) * 0.8;

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