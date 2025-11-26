// core/scene.js
import * as THREE from "/libs/three/three.module.js";

export const scene = new THREE.Scene();

// Nebel 
scene.fog = new THREE.FogExp2(0x87ceeb, 0.004);

// Ambient-Licht
//export const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
//scene.add(ambientLight);

// Sonne (Licht)
export const sunLight = new THREE.DirectionalLight(0xffffff, 1);
sunLight.position.set(0, 100, 0);
scene.add(sunLight);

// Sonne (Mesh)
export const sunGeometry = new THREE.SphereGeometry(100, 100, 100);
export const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffff66 });
export const sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);
sunMesh.position.set(0, 100, 0);
scene.add(sunMesh);

// Mond (Licht)
export const moonLight = new THREE.DirectionalLight(0x9999ff, 0.2);
moonLight.position.set(0, -100, 0);
scene.add(moonLight);

// Mond (Mesh)
export const moonGeometry = new THREE.SphereGeometry(3, 32, 32);
export const moonMaterial = new THREE.MeshBasicMaterial({ color: 0xddddff });
export const moonMesh = new THREE.Mesh(moonGeometry, moonMaterial);
moonMesh.position.set(0, -100, 0);
scene.add(moonMesh);

export default scene;