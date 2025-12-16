import * as THREE from "/libs/three/three.module.js";
import { isGameLocked } from "../core/gameState.js";
import { getCameraYaw } from "../core/camera.js";

export class PlayerControls {
  constructor(character, getHeightAt) {
    this.character = character;
    this.getHeightAt = getHeightAt;
    this.speed = 100;

    this.keys = { w: false, a: false, s: false, d: false };

    document.addEventListener("keydown", (e) => {
      this.keys[e.key.toLowerCase()] = true;
    });

    document.addEventListener("keyup", (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });
  }

  update(delta) {
    if (!this.character.model) return;

    let moving = false;
    const model = this.character.model;

    // Bewegung relativ zur Kamera (FPS-Style)
    const yaw = getCameraYaw();

    const forward = new THREE.Vector3(0, 0, -1);
    forward.applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
    forward.y = 0;
    forward.normalize();

    const right = new THREE.Vector3(1, 0, 0);
    right.applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
    right.y = 0;
    right.normalize();

    // Bewegung nur erlauben, wenn das Spiel nicht gesperrt ist
    if (!isGameLocked()) {
      if (this.keys.w) {
        model.position.addScaledVector(forward, this.speed * delta);
        moving = true;
      }

      if (this.keys.s) {
        model.position.addScaledVector(forward, -this.speed * delta);
        moving = true;
      }

      if (this.keys.a) {
        model.position.addScaledVector(right, -this.speed * delta);
        moving = true;
      }

      if (this.keys.d) {
        model.position.addScaledVector(right, this.speed * delta);
        moving = true;
      }
    }

    // Figur auf Terrain-Höhe setzen
    if (this.getHeightAt) {
      const x = model.position.x;
      const z = model.position.z;
      const y = this.getHeightAt(x, z);
      model.position.y = y;
    }

    // Animation wählen
    if (moving) {
      this.character.play("walk");
    } else {
      this.character.play("idle");
    }
  }
}