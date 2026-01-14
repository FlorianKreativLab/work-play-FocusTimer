import * as THREE from "/libs/three/three.module.js";

import scene, {
  ambientLight,
  sunLight,
  moonLight,
  sunMesh,
  moonMesh,
  daySky,
  nightSky,
  starField,
  cloudLayers,
  cloudMaterial,
} from "./src/core/scene.js";
import { renderer } from "./src/core/renderer.js";
import { camera, setupCameraControls, updateCamera } from "./src/core/camera.js";
import { getDayNightProgress } from "./src/core/dayNight.js";
import { createTerrain, getHeightAt, getGroundMesh } from "./src/world/terrain.js";
import { loadHouse } from "./src/world/house.js";
import { createTree, TREE_TYPES } from "./src/world/trees.js";


import { Character } from "./src/player/character.js";
import { PlayerControls } from "./src/player/controls.js";
import { isGameLocked } from "./src/core/gameState.js";

// -------------------------------------------------
// SAVE / LOAD
// -------------------------------------------------
const SAVE_KEY = "savegame_v1";

function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (data && typeof data === "object") return data;
    }
  } catch {}

  // Default Save
  const seed = Math.floor(Math.random() * 1e9);
  const fresh = {
    version: 1,
    worldSeed: seed,
    house: { x: 0, z: 0, rotY: 0, scale: 6 },
    player: { x: 20, z: 10 },
    trees: [], // placed trees
  };
  localStorage.setItem(SAVE_KEY, JSON.stringify(fresh));
  return fresh;
}

function writeSave(save) {
  localStorage.setItem(SAVE_KEY, JSON.stringify(save));
}

function getSave() {
  return loadSave();
}

// Debug helper: in console call `resetWorld()`
window.resetWorld = function resetWorld() {
  localStorage.removeItem(SAVE_KEY);
  localStorage.removeItem("focus_tree_inventory_v1");
  localStorage.removeItem("focus_gems_v1");
  location.reload();
};

// -------------------------------------------------
// Welt aufbauen (deterministisch + Save/Load)
// -------------------------------------------------
const SAVE = getSave();
createTerrain(scene, SAVE.worldSeed);

let houseRef = null;
loadHouse(scene, getHeightAt, {
  basePos: { x: SAVE.house?.x ?? 0, z: SAVE.house?.z ?? 0 },
  rotY: SAVE.house?.rotY ?? 0,
  scale: SAVE.house?.scale ?? 6,
}).then((house) => {
  houseRef = house;
});

// Placed Trees aus Save laden
function spawnTreesFromSave() {
  if (!Array.isArray(SAVE.trees)) return;
  for (const t of SAVE.trees) {
    if (!t || !t.type) continue;
    const tree = createTree(t.type, {
      seed: Number(t.seed) || 1337,
      scale: Number(t.scale) || 22,
    });
    tree.position.set(Number(t.x) || 0, Number(t.y) || 0, Number(t.z) || 0);
    tree.rotation.y = Number(t.rotY) || 0;
    scene.add(tree);
  }
}
spawnTreesFromSave();



// -------------------------------------------------
// Spieler-Figur + Steuerung
// -------------------------------------------------
let character;
let controls;
const clock = new THREE.Clock();

function init() {
  const playerSpawn = {
    x: Number(SAVE.player?.x) || 20,
    z: Number(SAVE.player?.z) || 10,
  };
  character = new Character(scene, getHeightAt, playerSpawn);
  controls = new PlayerControls(character, getHeightAt);

  handleResize();
  setupCameraControls(renderer.domElement);

  animate();
}
function autosave() {
  try {
    const save = getSave();

    // Player
    const p = character?.getPosition?.();
    if (p) {
      save.player = { x: p.x, z: p.z };
    }

    // House (falls geladen)
    if (houseRef) {
      save.house = {
        x: houseRef.position.x,
        z: houseRef.position.z,
        rotY: houseRef.rotation.y,
        scale: houseRef.scale.x,
      };
    }

    // Trees sind schon in save.trees (werden beim Platzieren ergänzt)
    writeSave(save);
  } catch (e) {
    console.warn("Autosave failed", e);
  }
}

setInterval(autosave, 5000);
window.addEventListener("beforeunload", autosave);

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
handleResize();

// -------------------------------------------------
// Sterne Fade
// -------------------------------------------------
function getStarVisibilityFromDayFactor(dayFactor) {
  const FADE_IN_START = 0.45;
  const FADE_IN_END = 0.12;

  let d = dayFactor;
  if (d < 0) d = 0;
  if (d > 1) d = 1;

  if (d >= FADE_IN_START) return 0;
  if (d <= FADE_IN_END) return 1;

  const t = (FADE_IN_START - d) / (FADE_IN_START - FADE_IN_END);
  return t * t * (3 - 2 * t); // smoothstep
}

// -------------------------------------------------
// Wolken Update (2 Layer + Parallax)
// -------------------------------------------------
function updateCloudLayers(playerPos, delta) {
  if (!cloudLayers || !playerPos) return;

  for (const layer of cloudLayers) {
    const { range, speed, driftZ } = layer.userData;

    // Layer folgt dem Spieler (Cloud-Bubble)
    layer.position.set(playerPos.x, 0, playerPos.z);

    for (const cloud of layer.children) {
      cloud.position.x += speed * delta;
      cloud.position.z += driftZ * delta;

      const half = range * 0.5;
      if (cloud.position.x > half) cloud.position.x = -half;
      if (cloud.position.x < -half) cloud.position.x = half;
      if (cloud.position.z > half) cloud.position.z = -half;
      if (cloud.position.z < -half) cloud.position.z = half;
    }
  }
}

function updateCloudDayNight(dayFactor) {
  if (!cloudMaterial) return;

  const d = Math.max(0, Math.min(1, dayFactor));
  const dayColor = new THREE.Color(0xffffff);
  const nightColor = new THREE.Color(0x2b3640);

  //cloudMaterial.color.copy(nightColor.clone().lerp(dayColor, d));
  cloudMaterial.opacity = 0.55 + 0.45 * d;
}

// -------------------------------------------------
// Render-Loop
// -------------------------------------------------
function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();

  if (controls) controls.update(delta);
  if (character) character.update(delta);

  updateCamera(character, getHeightAt);

  // Himmel + Sterne an Spielerposition kleben
  if (character && character.model) {
    const playerPos = character.model.position;
    daySky.position.copy(playerPos);
    nightSky.position.copy(playerPos);
    if (starField) starField.position.copy(playerPos);

    updateCloudLayers(playerPos, delta);
  }

  const isTimerActive = isGameLocked();

  if (isTimerActive) {
    const p = getDayNightProgress();
    const angle = p * Math.PI * 2;

    // Sonne & Mond bewegen (Kreisbahn)
    sunLight.position.set(Math.cos(angle) * 600, Math.sin(angle) * 600, 0);
    moonLight.position.set(
      Math.cos(angle + Math.PI) * 600,
      Math.sin(angle + Math.PI) * 600,
      0
    );
    sunMesh.position.copy(sunLight.position);
    moonMesh.position.copy(moonLight.position);

    // dayFactor aus Sonnenhöhe
    const sunY = sunLight.position.y;
    const sunYmax = 600;
    let dayFactor = sunY / sunYmax;
    if (dayFactor > 1) dayFactor = 1;
    if (dayFactor < 0) dayFactor = 0;

    //updateCloudDayNight(dayFactor);

    ambientLight.intensity = 0;
    sunLight.intensity = dayFactor;
    moonLight.intensity = 1 - dayFactor;

    daySky.material.opacity = dayFactor;
    nightSky.material.opacity = 1 - dayFactor;

    if (starField) {
      starField.material.opacity = getStarVisibilityFromDayFactor(dayFactor);
    }
  } else {
    // Spielmodus: immer Tag
    ambientLight.intensity = 0.2;
    sunLight.intensity = 1;
    moonLight.intensity = 0;

    sunLight.position.set(300, 400, 100);
    sunMesh.position.copy(sunLight.position);

    moonLight.position.set(0, -1000, 0);
    moonMesh.position.copy(moonLight.position);

    daySky.material.opacity = 1;
    nightSky.material.opacity = 0;

    //updateCloudDayNight(1);

    if (starField) starField.material.opacity = 0;
  }

  renderer.render(scene, camera);
}

init();

// -------------------------------------------------
// UI + LOGIK: Inventar (Diamanten -> Bäume) + Placement
// Alles direkt in main.js
// -------------------------------------------------
window.addEventListener("DOMContentLoaded", () => {
  const GEMS_KEY = "focus_gems_v1";
  const INV_KEY = "focus_tree_inventory_v1";

  // DOM
  const openBtn = document.getElementById("open-tree-shop");
  const modal = document.getElementById("tree-shop");
  const closeBtn = document.getElementById("tree-shop-close");
  const backdrop = modal?.querySelector(".modal-backdrop");
  const gemsFooterEl = document.getElementById("gem-count");
  const gemsInModal = document.getElementById("tree-shop-gems");
  const grid = document.getElementById("tree-shop-grid");

  if (!openBtn || !modal || !closeBtn || !gemsInModal || !grid) {
    console.warn("Inventar UI: fehlende DOM-Elemente");
    return;
  }

  // Shop Daten
  const SHOP = [
    { type: TREE_TYPES.MAPLE_RED, name: "Ahorn (Rot)", price: 1 },
    { type: TREE_TYPES.GINKGO_GOLD, name: "Ginkgo (Gold)", price: 2 },
    { type: TREE_TYPES.PINE_DARK, name: "Kiefer (Dunkel)", price: 2 },
    { type: TREE_TYPES.CHERRY_PINK, name: "Kirschblüte", price: 3 },
    { type: TREE_TYPES.BAMBOO, name: "Bambus", price: 3 },
    { type: TREE_TYPES.DEAD_TREE, name: "Toter Baum", price: 1 },
  ];

  // ---------- Gems / Inventory (localStorage) ----------
  function getGems() {
    const n = Number(localStorage.getItem(GEMS_KEY) || 0);
    return Number.isFinite(n) ? n : 0;
  }

  function setGems(v) {
    const gems = Math.max(0, Math.floor(Number(v) || 0));
    localStorage.setItem(GEMS_KEY, String(gems));

    // ui.js kann (wenn angepasst) darauf hören
    window.dispatchEvent(new CustomEvent("gems:changed", { detail: { gems } }));

    // Fallback: Footer direkt setzen
    if (gemsFooterEl) {
      gemsFooterEl.textContent = `${gems} ${gems === 1 ? "Diamant" : "Diamanten"}`;
    }
  }

  function getInv() {
    try {
      const raw = localStorage.getItem(INV_KEY);
      const obj = raw ? JSON.parse(raw) : {};
      return obj && typeof obj === "object" ? obj : {};
    } catch {
      return {};
    }
  }

  function setInv(inv) {
    localStorage.setItem(INV_KEY, JSON.stringify(inv || {}));
  }

  function getOwned(type) {
    const inv = getInv();
    return Number(inv[type] || 0) || 0;
  }

  function addOwned(type, delta) {
    const inv = getInv();
    const next = (Number(inv[type] || 0) || 0) + delta;
    inv[type] = Math.max(0, next);
    setInv(inv);
  }

  // ---------- Modal open/close ----------
  function open() {
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    render();
  }

  function close() {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
  }

  openBtn.addEventListener("click", open);
  closeBtn.addEventListener("click", close);
  backdrop?.addEventListener("click", close);

  // ESC: close modal or cancel placing
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("open")) close();
  });

  // ---------- Placement Mode ----------
  let placing = false;
  let placingType = null;
  let preview = null;

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  function setPreviewMaterial(obj, makePreview) {
    obj.traverse((o) => {
      if (o.isMesh && o.material) {
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        for (const m of mats) {
          if (!m) continue;
          if (makePreview) {
            m.transparent = true;
            m.opacity = 0.45;
            m.depthWrite = false;
          } else {
            m.opacity = 1;
            m.depthWrite = true;
          }
        }
      }
    });
  }

  function getGroundIntersection(clientX, clientY) {
    const ground = getGroundMesh();
    if (!ground) return null;

    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -(((clientY - rect.top) / rect.height) * 2 - 1);

    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObject(ground, true);
    if (!hits || hits.length === 0) return null;
    return hits[0].point;
  }

  function startPlacing(type) {
    if (placing) cancelPlacing();

    if (getOwned(type) <= 0) {
      console.warn("Kein Baum im Inventar:", type);
      return;
    }

    placing = true;
    placingType = type;

    const treeSeed = Math.floor(Math.random() * 1e9);
    preview = createTree(type, { seed: treeSeed, scale: 22 });
    preview.userData.seed = treeSeed;
    setPreviewMaterial(preview, true);
    scene.add(preview);

    // initial guess
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    const pos = camera.position.clone().add(forward.multiplyScalar(25));
    const y = getHeightAt(pos.x, pos.z);
    preview.position.set(pos.x, (Number.isFinite(y) ? y : 0) + 0.6, pos.z);

    close();
  }

  function cancelPlacing() {
    placing = false;
    placingType = null;
    if (preview) {
      scene.remove(preview);
      preview = null;
    }
  }

  function confirmPlacing() {
    if (!placing || !placingType || !preview) return;

    // Consume 1 tree
    addOwned(placingType, -1);

    // Create final tree (mit stabilem Seed)
    const treeSeed = preview?.userData?.seed ?? Math.floor(Math.random() * 1e9);
    const treeScale = 22;

    const finalTree = createTree(placingType, { seed: treeSeed, scale: treeScale });
    finalTree.position.copy(preview.position);
    finalTree.rotation.copy(preview.rotation);
    scene.add(finalTree);

    // In Save schreiben
    const save = getSave();
    if (!Array.isArray(save.trees)) save.trees = [];
    save.trees.push({
      type: placingType,
      x: finalTree.position.x,
      y: finalTree.position.y,
      z: finalTree.position.z,
      rotY: finalTree.rotation.y,
      scale: treeScale,
      seed: treeSeed,
    });
    writeSave(save);

    scene.remove(preview);
    preview = null;

    placing = false;
    placingType = null;

    if (modal.classList.contains("open")) render();
  }

  // Mouse move: follow ground
  renderer.domElement.addEventListener("mousemove", (e) => {
    if (!placing || !preview) return;
    const p = getGroundIntersection(e.clientX, e.clientY);
    if (!p) return;
    preview.position.set(p.x, p.y + 0.6, p.z);
  });

  // Click to confirm/cancel
  renderer.domElement.addEventListener("mousedown", (e) => {
    if (!placing) return;
    if (e.button === 0) confirmPlacing();
    if (e.button === 2) cancelPlacing();
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && placing) cancelPlacing();
  });

  renderer.domElement.addEventListener("contextmenu", (e) => {
    if (placing) e.preventDefault();
  });

  // ---------- Render Shop ----------
  function render() {
    const gems = getGems();
    gemsInModal.textContent = String(gems);

    grid.innerHTML = "";

    for (const it of SHOP) {
      const owned = getOwned(it.type);
      const canBuy = gems >= it.price;
      const canPlace = owned > 0;

      const card = document.createElement("div");
      card.className = "tree-card";
      card.innerHTML = `
        <div class="tree-card-title"><span>${it.name}</span><span>💎 ${it.price}</span></div>
        <div class="tree-card-meta"><span>Besitz</span><span><strong>${owned}</strong></span></div>
        <div class="tree-card-actions">
          <button class="tree-btn" data-action="buy">Kaufen</button>
          <button class="tree-btn secondary" data-action="place">Platzieren</button>
        </div>
      `;

      const buyBtn = card.querySelector('[data-action="buy"]');
      const placeBtn = card.querySelector('[data-action="place"]');

      buyBtn.disabled = !canBuy;
      placeBtn.disabled = !canPlace;

      buyBtn.addEventListener("click", () => {
        const current = getGems();
        if (current < it.price) return;
        setGems(current - it.price);
        addOwned(it.type, +1);
        render();
      });

      placeBtn.addEventListener("click", () => {
        if (getOwned(it.type) <= 0) return;
        startPlacing(it.type);
      });

      grid.appendChild(card);
    }
  }

  // Wenn ui.js später Gems erhöht, live refresh
  window.addEventListener("gems:changed", () => {
    if (modal.classList.contains("open")) render();
  });
});