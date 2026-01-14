// world/house.js

import * as THREE from "/libs/three/three.module.js";
import { GLTFLoader } from "/libs/three/examples/jsm/loaders/GLTFLoader.js";
import * as BufferGeometryUtils from "/libs/three/examples/jsm/utils/BufferGeometryUtils.js"; // falls du direkt benutzt

export function loadHouse(scene, getHeightAt, opts = {}) {
  const loader = new GLTFLoader();

  const basePos = opts.basePos || { x: 0, z: 0 };
  const scale = Number(opts.scale) || 6;
  const rotY = Number(opts.rotY) || 0;

  return new Promise((resolve, reject) => {
    loader.load(
      "/assets/house.glb",
      (gltf) => {
        const house = gltf.scene;
        house.scale.set(scale, scale, scale);

        const hx = Number(basePos.x) || 0;
        const hz = Number(basePos.z) || 0;
        const terrainY = getHeightAt ? getHeightAt(hx, hz) : 0;

        house.position.set(hx, terrainY, hz);
        house.rotation.y = rotY;

        scene.add(house);
        console.log("Haus geladen");
        resolve(house);
      },
      undefined,
      (error) => {
        console.error("Fehler beim Laden des Hauses:", error);
        reject(error);
      }
    );
  });
}