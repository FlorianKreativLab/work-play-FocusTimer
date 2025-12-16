import * as THREE from "/libs/three/three.module.js";
import { GLTFLoader } from "/libs/three/examples/jsm/loaders/GLTFLoader.js";

export class Character {
  constructor(scene, getHeightAt, spawnPos = { x: 0, z: 0 }) {
    this.scene = scene;
    this.getHeightAt = getHeightAt;
    this.spawnPos = spawnPos;

    this.mixer = null;
    this.model = null;
    this.actions = {};
    this.currentAction = null;

    this.loader = new GLTFLoader();
    this.loadModel();
  }

  loadModel() {
    this.loader.load(
      "/assets/character/idle.glb",
      (gltf) => {
        this.model = gltf.scene;
        this.model.scale.set(2, 2, 2);

        const x = this.spawnPos.x;
        const z = this.spawnPos.z;
        let y = 0;
        if (this.getHeightAt) y = this.getHeightAt(x, z);

        this.model.position.set(x, y, z);
        this.scene.add(this.model);

        this.mixer = new THREE.AnimationMixer(this.model);

        if (gltf.animations && gltf.animations.length > 0) {
          const idleAction = this.mixer.clipAction(gltf.animations[0]);
          this.actions["idle"] = idleAction;
          idleAction.play();
        }

        this.loadAdditionalAnimations();
      },
      undefined,
      (error) => {
        console.error("Fehler beim Laden von idle.glb:", error);
      }
    );
  }

  loadAdditionalAnimations() {
    const animations = [
      { name: "walk", file: "walk.glb" },
      { name: "run", file: "run.glb" },
      { name: "jump", file: "jump.glb" },
    ];

    animations.forEach((anim) => {
      const path = `/assets/character/${anim.file}`;

      this.loader.load(
        path,
        (gltf) => {
          if (!this.mixer) return;
          if (!gltf.animations || gltf.animations.length === 0) {
            console.warn(`${anim.file} hat keine Animationen!`);
            return;
          }
          this.actions[anim.name] = this.mixer.clipAction(gltf.animations[0]);
        },
        undefined,
        (error) => {
          console.error(`Fehler beim Laden von ${path}:`, error);
        }
      );
    });
  }

  play(actionName) {
    if (this.currentAction === actionName) return;
    if (!this.actions[actionName]) return;

    if (this.currentAction) {
      this.actions[this.currentAction].fadeOut(0.2);
    }

    this.actions[actionName].reset().fadeIn(0.2).play();
    this.currentAction = actionName;
  }

  update(delta) {
    if (this.mixer) this.mixer.update(delta);
  }
}