// world/house.js

import * as THREE from "/libs/three/three.module.js";
import { GLTFLoader } from "/libs/three/examples/jsm/loaders/GLTFLoader.js";
import * as BufferGeometryUtils from "/libs/three/examples/jsm/utils/BufferGeometryUtils.js"; // falls du direkt benutzt

export function loadHouse(scene, getHeightAt) {
  const loader = new GLTFLoader();

  loader.load(
    "/assets/house.glb",
    (gltf) => {
      const house = gltf.scene;
      const basePos = { x: 0, z: 0 };

      house.scale.set(6, 6, 6);

      const hx = basePos.x;
      const hz = basePos.z;
      const terrainY = getHeightAt(hx, hz);

      house.position.set(hx, terrainY, hz);

      scene.add(house);
      console.log("Haus geladen");

      return house;
    },
    undefined,
    (error) => {
      console.error("Fehler beim Laden des Hauses:", error);
    }
  );
}