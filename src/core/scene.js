// core/scene.js
import * as THREE from "/libs/three/three.module.js";

export const scene = new THREE.Scene();

// Nebel 
scene.fog = new THREE.FogExp2(0x87ceeb, 0.003);

// Ambient-Licht
export const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
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
export const moonLight = new THREE.DirectionalLight(0x9999ff, 0.2);
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
    opacity: 1
});

// Himmelskuppel Nacht

const nightSkyGeometry = new THREE.SphereGeometry(5000, 60, 40);
const nightSkyMaterial = new THREE.MeshBasicMaterial({
    color: 0x000011,
    side: THREE.BackSide,
    transparent: true,
    opacity: 0
});

export const daySky = new THREE.Mesh(daySkyGeometry, daySkyMaterial);
export const nightSky = new THREE.Mesh(nightSkyGeometry, nightSkyMaterial);

scene.add(daySky);
scene.add(nightSky);




export default scene;