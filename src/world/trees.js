import * as THREE from "/libs/three/three.module.js";

// -------------------------------------------------
// Tree Types (für spätere Menü-Auswahl / Unlocks)
// -------------------------------------------------
export const TREE_TYPES = Object.freeze({
  MAPLE_RED: "maple_red",
  GINKGO_GOLD: "ginkgo_gold",
  PINE_DARK: "pine_dark",
  CHERRY_PINK: "cherry_pink",
  BAMBOO: "bamboo",
  DEAD_TREE: "dead_tree",
});

export function getAllTreeTypes() {
  return Object.values(TREE_TYPES);
}

// -------------------------------------------------
// Haupt-Factory: 6 unterschiedliche Baumtypen
// -------------------------------------------------
export function createTree(type = TREE_TYPES.MAPLE_RED, options = {}) {
  switch (type) {
    case TREE_TYPES.GINKGO_GOLD:
      return createGinkgoTree(options);
    case TREE_TYPES.PINE_DARK:
      return createPineTree(options);
    case TREE_TYPES.CHERRY_PINK:
      return createCherryTree(options);
    case TREE_TYPES.BAMBOO:
      return createBambooTree(options);
    case TREE_TYPES.DEAD_TREE:
      return createDeadTree(options);
    case TREE_TYPES.MAPLE_RED:
    default:
      return createMapleTree(options);
  }
}

// -------------------------------------------------
// (Optional) Backward-Style: MiniTree (Maple default)
// -------------------------------------------------
export function createMiniTree({
  trunkHeight = 1.6,
  trunkRadius = 0.12,
  crownSize = 0.8,
  scale = 1,
  colorVariant = TREE_TYPES.MAPLE_RED,
  seed = Math.random() * 10000,
} = {}) {
  const rng = mulberry32(Math.floor(seed));

  const group = new THREE.Group();
  group.userData.isTree = true;

  if (Number.isFinite(scale) && scale !== 1) {
    group.scale.setScalar(scale);
  }

  const palette = getPalette(colorVariant);

  const trunkMat = new THREE.MeshStandardMaterial({
    color: palette.trunk,
    roughness: 0.95,
    metalness: 0.0,
    flatShading: true,
  });

  const leavesMat = new THREE.MeshStandardMaterial({
    color: palette.leaves,
    roughness: 0.9,
    metalness: 0.0,
    flatShading: true,
  });

  // Stamm
  const trunkGeo = new THREE.CylinderGeometry(
    trunkRadius * (0.85 + rng() * 0.25),
    trunkRadius * (1.05 + rng() * 0.35),
    trunkHeight,
    7,
    1
  );

  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  trunk.position.y = trunkHeight / 2;
  trunk.rotation.y = rng() * Math.PI * 2;
  group.add(trunk);

  // Krone
  const blobGeo = new THREE.IcosahedronGeometry(crownSize, 0);
  const blobCount = 2 + Math.floor(rng() * 2);

  for (let i = 0; i < blobCount; i++) {
    const blob = new THREE.Mesh(blobGeo.clone(), leavesMat);
    blob.castShadow = true;

    const angle = rng() * Math.PI * 2;
    const radius = crownSize * (0.15 + rng() * 0.25);

    blob.position.set(
      Math.cos(angle) * radius,
      trunkHeight * (0.85 + rng() * 0.12) + i * 0.08,
      Math.sin(angle) * radius
    );

    const s = 0.85 + rng() * 0.35;
    blob.scale.setScalar(s);
    blob.rotation.set(rng() * 0.6, rng() * Math.PI * 2, rng() * 0.6);

    jitterVertices(blob.geometry, rng, 0.06);
    group.add(blob);
  }

  // Wurzel-Detail
  const rootGeo = new THREE.IcosahedronGeometry(trunkRadius * 1.4, 0);
  const root = new THREE.Mesh(rootGeo, trunkMat);
  root.position.y = trunkRadius * 0.6;
  root.scale.set(1.2, 0.55, 1.2);
  root.rotation.y = rng() * Math.PI * 2;
  root.castShadow = true;
  group.add(root);

  group.userData.windOffset = rng() * 1000;
  group.userData.windStrength = 0.015 + rng() * 0.02;

  return group;
}

// -------------------------------------------------
// Typen-Implementierungen
// -------------------------------------------------
function createMapleTree(opts) {
  return createMiniTree({ ...opts, colorVariant: TREE_TYPES.MAPLE_RED });
}

function createGinkgoTree({ scale = 1, seed = Math.random() * 10000 } = {}) {
  const rng = mulberry32(Math.floor(seed));
  const palette = getPalette(TREE_TYPES.GINKGO_GOLD);

  const group = new THREE.Group();
  group.userData.isTree = true;
  if (Number.isFinite(scale) && scale !== 1) group.scale.setScalar(scale);

  const trunkMat = new THREE.MeshStandardMaterial({
    color: palette.trunk,
    roughness: 0.95,
    metalness: 0,
    flatShading: true,
  });
  const leavesMat = new THREE.MeshStandardMaterial({
    color: palette.leaves,
    roughness: 0.9,
    metalness: 0,
    flatShading: true,
  });

  const trunkH = 1.35;
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.22, trunkH, 7, 1),
    trunkMat
  );
  trunk.position.y = trunkH / 2;
  trunk.rotation.y = rng() * Math.PI * 2;
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  group.add(trunk);

  const blobBase = new THREE.IcosahedronGeometry(0.65, 0);
  const count = 3 + Math.floor(rng() * 3);

  for (let i = 0; i < count; i++) {
    const b = new THREE.Mesh(blobBase.clone(), leavesMat);
    const ang = rng() * Math.PI * 2;
    const rad = 0.15 + rng() * 0.35;
    b.position.set(Math.cos(ang) * rad, trunkH * 0.85 + rng() * 0.45, Math.sin(ang) * rad);
    b.scale.setScalar(0.85 + rng() * 0.45);
    b.rotation.set(rng() * 0.6, rng() * Math.PI * 2, rng() * 0.6);
    jitterVertices(b.geometry, rng, 0.05);
    b.castShadow = true;
    group.add(b);
  }

  group.userData.windOffset = rng() * 1000;
  group.userData.windStrength = 0.012 + rng() * 0.02;
  return group;
}

function createPineTree({ scale = 1, seed = Math.random() * 10000 } = {}) {
  const rng = mulberry32(Math.floor(seed));
  const palette = getPalette(TREE_TYPES.PINE_DARK);

  const group = new THREE.Group();
  group.userData.isTree = true;
  if (Number.isFinite(scale) && scale !== 1) group.scale.setScalar(scale);

  const trunkMat = new THREE.MeshStandardMaterial({
    color: palette.trunk,
    roughness: 0.95,
    metalness: 0,
    flatShading: true,
  });
  const leavesMat = new THREE.MeshStandardMaterial({
    color: palette.leaves,
    roughness: 0.9,
    metalness: 0,
    flatShading: true,
  });

  const trunkH = 2.2;
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.10, 0.14, trunkH, 7, 1),
    trunkMat
  );
  trunk.position.y = trunkH / 2;
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  group.add(trunk);

  const layers = 3;
  for (let i = 0; i < layers; i++) {
    const t = i / (layers - 1);
    const h = 0.75;
    const r = 0.95 - t * 0.45;

    const cone = new THREE.Mesh(new THREE.ConeGeometry(r, h, 8, 1), leavesMat);
    cone.position.y = trunkH * 0.55 + i * 0.55;
    cone.rotation.y = rng() * Math.PI * 2;
    cone.castShadow = true;
    jitterVertices(cone.geometry, rng, 0.03);
    group.add(cone);
  }

  const top = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.65, 8, 1), leavesMat);
  top.position.y = trunkH * 0.55 + layers * 0.55;
  top.castShadow = true;
  jitterVertices(top.geometry, rng, 0.03);
  group.add(top);

  group.userData.windOffset = rng() * 1000;
  group.userData.windStrength = 0.008 + rng() * 0.012;
  return group;
}

function createCherryTree({ scale = 1, seed = Math.random() * 10000 } = {}) {
  const rng = mulberry32(Math.floor(seed));
  const palette = getPalette(TREE_TYPES.CHERRY_PINK);

  const group = new THREE.Group();
  group.userData.isTree = true;
  if (Number.isFinite(scale) && scale !== 1) group.scale.setScalar(scale);

  const trunkMat = new THREE.MeshStandardMaterial({
    color: palette.trunk,
    roughness: 0.95,
    metalness: 0,
    flatShading: true,
  });
  const leavesMat = new THREE.MeshStandardMaterial({
    color: palette.leaves,
    roughness: 0.9,
    metalness: 0,
    flatShading: true,
  });

  const trunkH = 1.8;
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.18, trunkH, 7, 1),
    trunkMat
  );
  trunk.position.y = trunkH / 2;
  trunk.rotation.z = (rng() - 0.5) * 0.25;
  trunk.rotation.y = rng() * Math.PI * 2;
  trunk.castShadow = true;
  group.add(trunk);

  const blobGeo = new THREE.IcosahedronGeometry(0.55, 0);
  const count = 4 + Math.floor(rng() * 4);

  for (let i = 0; i < count; i++) {
    const b = new THREE.Mesh(blobGeo.clone(), leavesMat);
    const ang = rng() * Math.PI * 2;
    const rad = 0.15 + rng() * 0.45;
    b.position.set(Math.cos(ang) * rad, trunkH * 0.85 + rng() * 0.55, Math.sin(ang) * rad);
    b.scale.setScalar(0.6 + rng() * 0.55);
    b.rotation.set(rng() * 0.8, rng() * Math.PI * 2, rng() * 0.8);
    jitterVertices(b.geometry, rng, 0.06);
    b.castShadow = true;
    group.add(b);
  }

  group.userData.windOffset = rng() * 1000;
  group.userData.windStrength = 0.016 + rng() * 0.025;
  return group;
}

function createBambooTree({ scale = 1, seed = Math.random() * 10000 } = {}) {
  const rng = mulberry32(Math.floor(seed));
  const palette = getPalette(TREE_TYPES.BAMBOO);

  const group = new THREE.Group();
  group.userData.isTree = true;
  if (Number.isFinite(scale) && scale !== 1) group.scale.setScalar(scale);

  const stalkMat = new THREE.MeshStandardMaterial({
    color: palette.trunk,
    roughness: 0.9,
    metalness: 0,
    flatShading: true,
  });
  const leavesMat = new THREE.MeshStandardMaterial({
    color: palette.leaves,
    roughness: 0.9,
    metalness: 0,
    flatShading: true,
  });

  const stalks = 2 + Math.floor(rng() * 3);

  for (let s = 0; s < stalks; s++) {
    const stalk = new THREE.Group();

    const segCount = 4 + Math.floor(rng() * 3);
    const segH = 0.55;
    const rTop = 0.07;
    const rBot = 0.09;

    for (let i = 0; i < segCount; i++) {
      const seg = new THREE.Mesh(
        new THREE.CylinderGeometry(rTop, rBot, segH, 7, 1),
        stalkMat
      );
      seg.position.y = segH / 2 + i * segH;
      seg.castShadow = true;
      stalk.add(seg);

      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(rBot * 0.85, 0.015, 6, 10),
        stalkMat
      );
      ring.position.y = i * segH + 0.02;
      ring.rotation.x = Math.PI / 2;
      ring.castShadow = true;
      stalk.add(ring);
    }

    stalk.rotation.z = (rng() - 0.5) * 0.12;
    stalk.rotation.y = rng() * Math.PI * 2;

    const leafCount = 6 + Math.floor(rng() * 6);
    for (let i = 0; i < leafCount; i++) {
      const leaf = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.55), leavesMat);
      leaf.position.y = segCount * segH - 0.2 + rng() * 0.25;
      leaf.rotation.y = rng() * Math.PI * 2;
      leaf.rotation.z = (rng() - 0.5) * 0.8;
      leaf.rotation.x = -0.25 + rng() * 0.5;
      leaf.castShadow = true;
      stalk.add(leaf);
    }

    stalk.position.x = (rng() - 0.5) * 0.55;
    stalk.position.z = (rng() - 0.5) * 0.55;

    group.add(stalk);
  }

  group.userData.windOffset = rng() * 1000;
  group.userData.windStrength = 0.02 + rng() * 0.03;
  return group;
}

function createDeadTree({ scale = 1, seed = Math.random() * 10000 } = {}) {
  const rng = mulberry32(Math.floor(seed));
  const palette = getPalette(TREE_TYPES.DEAD_TREE);

  const group = new THREE.Group();
  group.userData.isTree = true;
  if (Number.isFinite(scale) && scale !== 1) group.scale.setScalar(scale);

  const woodMat = new THREE.MeshStandardMaterial({
    color: palette.trunk,
    roughness: 0.98,
    metalness: 0,
    flatShading: true,
  });

  const trunkH = 2.0;
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.22, trunkH, 7, 1),
    woodMat
  );
  trunk.position.y = trunkH / 2;
  trunk.rotation.y = rng() * Math.PI * 2;
  trunk.castShadow = true;
  group.add(trunk);

  const branches = 3 + Math.floor(rng() * 4);
  for (let i = 0; i < branches; i++) {
    const bh = 0.9 + rng() * 0.8;
    const br = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.05, bh, 6, 1),
      woodMat
    );

    const by = trunkH * (0.55 + rng() * 0.35);
    br.position.set(0, by, 0);

    br.rotation.z = (rng() * 0.9 + 0.35) * (rng() > 0.5 ? 1 : -1);
    br.rotation.y = rng() * Math.PI * 2;

    br.position.x += Math.cos(br.rotation.y) * 0.25;
    br.position.z += Math.sin(br.rotation.y) * 0.25;

    br.castShadow = true;
    group.add(br);
  }

  group.userData.windOffset = rng() * 1000;
  group.userData.windStrength = 0.004 + rng() * 0.006;
  return group;
}

// -------------------------------------------------
// Helpers
// -------------------------------------------------
function getPalette(type) {
  switch (type) {
    case TREE_TYPES.GINKGO_GOLD:
      return { trunk: 0x4b3621, leaves: 0xf2c84b };
    case TREE_TYPES.PINE_DARK:
      return { trunk: 0x2f241a, leaves: 0x1f5a35 };
    case TREE_TYPES.CHERRY_PINK:
      return { trunk: 0x4a3322, leaves: 0xf0a6c8 };
    case TREE_TYPES.BAMBOO:
      return { trunk: 0x2c4b2c, leaves: 0x4e8b3a };
    case TREE_TYPES.DEAD_TREE:
      return { trunk: 0x3a2f28, leaves: 0x6d6a62 };
    case TREE_TYPES.MAPLE_RED:
    default:
      return { trunk: 0x4a3322, leaves: 0xc84a2a };
  }
}

function jitterVertices(geometry, rng, amount = 0.05) {
  const pos = geometry.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    pos.setXYZ(
      i,
      pos.getX(i) + (rng() - 0.5) * amount,
      pos.getY(i) + (rng() - 0.5) * amount,
      pos.getZ(i) + (rng() - 0.5) * amount
    );
  }
  pos.needsUpdate = true;
  geometry.computeVertexNormals();
}

function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}