// core/scene.js
import * as THREE from "/libs/three/three.module.js";

export const scene = new THREE.Scene();

// Nebel 
//scene.fog = new THREE.FogExp2(0xff0000, 0.003);

// Ambient-Licht
export const ambientLight = new THREE.AmbientLight(0xa98307, 0.6);
scene.add(ambientLight);

// Sonne (Licht)
export const sunLight = new THREE.DirectionalLight(0xffffff, 1);
sunLight.position.set(0, 100, 0);
scene.add(sunLight);

// Sonne (Mesh)
export const sunGeometry = new THREE.SphereGeometry(100, 16, 8);
export const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffff66 });
export const sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);
sunMesh.position.set(0, 100, 0);
scene.add(sunMesh);

// Mond (Licht)
export const moonLight = new THREE.DirectionalLight(0x9999ff, 0.3);
moonLight.position.set(0, -100, 0);
scene.add(moonLight);

// Mond (Mesh)
export const moonGeometry = new THREE.SphereGeometry(100, 16, 8);
export const moonMaterial = new THREE.MeshBasicMaterial({ color: 0xddddff });
export const moonMesh = new THREE.Mesh(moonGeometry, moonMaterial);
moonMesh.position.set(0, -100, 0);
scene.add(moonMesh);

// Himmelskuppel Tag

const daySkyGeometry = new THREE.SphereGeometry(5000, 60, 40);
const daySkyMaterial = new THREE.MeshBasicMaterial({
    color: 0x87ceeb,
    side: THREE.BackSide,
    transparent: true,
    opacity: 1,
    depthWrite: false,
    depthTest: true
});

// Himmelskuppel Nacht

const nightSkyGeometry = new THREE.SphereGeometry(5000, 60, 40);
const nightSkyMaterial = new THREE.MeshBasicMaterial({
    color: 0x000000,
    side: THREE.BackSide,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    depthTest: true
});

export const daySky = new THREE.Mesh(daySkyGeometry, daySkyMaterial);
export const nightSky = new THREE.Mesh(nightSkyGeometry, nightSkyMaterial);

scene.add(daySky);
scene.add(nightSky);

// Sky immer zuerst rendern (sonst kann bei transparenten Materialien die Sortierung alles überdecken)
daySky.renderOrder = -10;
nightSky.renderOrder = -10;


// ===== Sternenhimmel =====

const STAR_RADIUS = 800;
const STAR_COUNT = 2000;

let starField; // wird ein THREE.Points Objekt

function createStarField(scene) {

  // Positionen (x,y,z) + Farben für jeden Stern
  const positions = [];
  const colors = [];

  for (let i = 0; i < STAR_COUNT; i++) {

    // 1. Zufälliger Richtungsvektor
    let x = Math.random() * 2 - 1;
    let y = Math.random() * 2 - 1;
    let z = Math.random() * 2 - 1;

    // 2. Normalisieren (Länge = 1)
    const length = Math.sqrt(x * x + y * y + z * z);
    x /= length;
    y /= length;
    z /= length;

    // 3. Auf Kugeloberfläche setzen
    x *= STAR_RADIUS;
    y *= STAR_RADIUS;
    z *= STAR_RADIUS;

    positions.push(x, y, z);

    // 4. Farben (meist weiß, selten leicht blau/gelb)
    const r = Math.random();
    if (r < 0.02) {
      // leicht gelblich
      colors.push(1.0, 0.95, 0.8);
    } else if (r < 0.05) {
      // leicht bläulich
      colors.push(0.8, 0.9, 1.0);
    } else {
      // weiß
      colors.push(1.0, 1.0, 1.0);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(positions, 3)
  );
  geometry.setAttribute(
    'color',
    new THREE.Float32BufferAttribute(colors, 3)
  );

  const material = new THREE.PointsMaterial({
    size: 3.0,             // kleine Sterne
    vertexColors: true,
    transparent: true,
    opacity: 0,             // starten unsichtbar (Tag)
    depthWrite: false
  });

  starField = new THREE.Points(geometry, material);
  starField.renderOrder = 1;
  scene.add(starField);

  return starField;
}

export { createStarField, starField };

// Sternenhimmel direkt beim Scene-Setup erzeugen
// (sonst bleibt `starField` undefined und es werden keine Sterne gerendert)
createStarField(scene);


// ===== Wolken (Low Poly) =====
// 2 Layer: nah (schneller) + fern (langsamer) => Parallax

const cloudMaterial = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  roughness: 1.0,
  metalness: 0.0,
  flatShading: true,
  transparent: true,
  opacity: 1
});

function createLowPolyCloud() {
  const group = new THREE.Group();

  // 3–5 „Klumpen“ (Icosahedron detail 0 = low poly)
  const parts = 2 + Math.floor(Math.random() * 3);
  for (let i = 0; i < parts; i++) {
    const radius = 18 + Math.random() * 18;
    const geo = new THREE.IcosahedronGeometry(radius, 0);
    const mesh = new THREE.Mesh(geo, cloudMaterial);

    mesh.position.set(
      (Math.random() - 0.5) * 90,
      (Math.random() - 0.5) * 25,
      (Math.random() - 0.5) * 60
    );

    // leicht strecken für „Wolkenform“
    mesh.scale.set(1.9, 1.0, 1.0);

    group.add(mesh);
  }

  // Ganze Wolke minimal variieren
  const s = 0.9 + Math.random() * 0.6;
  group.scale.set(s, s, s);

  return group;
}

function createCloudLayer({
  count,
  y,
  range,
  speed,
  driftZ
}) {
  const layer = new THREE.Group();
  layer.userData = {
    y,
    range,
    speed,
    driftZ
  };

  for (let i = 0; i < count; i++) {
    const cloud = createLowPolyCloud();
    cloud.position.set(
      (Math.random() - 0.5) * range,
      y + (Math.random() - 0.5) * 35,
      (Math.random() - 0.5) * range
    );

    // Minimale Rotation für Varianz
    cloud.rotation.y = Math.random() * Math.PI * 2;

    layer.add(cloud);
  }

  // Wolken sollen vor dem Himmel, aber i.d.R. „im Welt-Raum“ sein
  layer.renderOrder = 0;

  scene.add(layer);
  return layer;
}

// Zwei Schichten: nah/unterer Layer + fern/oberer Layer
export const cloudLayerNear = createCloudLayer({
  count: 18,
  y: 240,
  range: 1400,
  speed: 14,   // schneller
  driftZ: 4
});

export const cloudLayerFar = createCloudLayer({
  count: 14,
  y: 320,
  range: 2200,
  speed: 6,    // langsamer (Parallax)
  driftZ: 2
});

// Export für Update (Bewegung + Day/Night)
export const cloudLayers = [cloudLayerNear, cloudLayerFar];
export { cloudMaterial };

export default scene;