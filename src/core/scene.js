// core/scene.js

import * as THREE from "/libs/three/three.module.js";

export const scene = new THREE.Scene();

//Nebel 
scene.fog = new THREE.FogExp2(0x87ceeb, 0.004);

//Licht
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(100, 100, 50);
scene.add(directionalLight);

export default scene;

