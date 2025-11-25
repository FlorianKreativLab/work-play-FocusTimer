import * as THREE from "/libs/three/three.module.js";
import { isGameLocked } from "../core/gameState.js";

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
    

    // Vorwärts-/Rückwärtsbewegung in Blickrichtung
    const forward = new THREE.Vector3();
    model.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    // Vorwärtsrichtung umdrehen, damit W nach vorne läuft
    forward.negate();

    const right = new THREE.Vector3();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

    //Bewegung nur erlauben, wenn das Spiel nicht gesperrt ist
    
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
        model.rotation.y += 2 * delta;
        moving = true;
      }

      if (this.keys.d) {
        model.rotation.y -= 2 * delta;
        moving = true;
      }
    }

    // ✅ Figur auf Terrain-Höhe setzen
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