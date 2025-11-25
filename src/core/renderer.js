// core/renderer.js

import * as THREE from "/libs/three/three.module.js";

const canvas = document.getElementById("three-canvas");

export const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setClearColor(0x87ceeb); // Himmelblau

export default renderer;