import * as THREE from 'three';
import g from './global.js';
import { DIFFICULTY } from './constants.js';
import { MISSILE_TYPES, TOWER_TYPES } from './types.js';
import { displayHomeMenu } from './events.js';

export class Game {
    constructor(initialMoney, lives) {
        this.money = initialMoney;
        this.score = 0;
        this.lives = lives;
        this.energyPerSec = 0;
        this.energy = 1;
        this.capacity = 0;
        this.towerTypes = Object.keys(TOWER_TYPES);
        this.difficulty = DIFFICULTY.NORMAL;
    }

    isGameOver() {
      return !(this.lives > 0);
    }

    updateMoney(money) {
      this.money += money;
    }

    updateScore(points) {
      this.score += points;
    }

    updateLives(lives) {
      this.lives -= lives;
    }

    updateEnergy(delta) {
      this.energyPerSec = 0;
      this.capacity = 0;

      /* Building or upgrading towers */
      let towers = g.towerManager.towerArray.filter(tower => tower.isBuilding || tower.isUpgrading);
      for (var tower of towers) {
        this.energyPerSec -= tower.energyPerSec;
      }

      /* Attacking towers */
      towers = g.towerManager.towerArray.filter(tower => tower.target);
      for (var tower of towers) {
        this.energyPerSec -= tower.energyPerSecDuringAttack;
      }

      this.energyPerSec += g.builderManager.builder.energyPerSec;
      this.capacity += g.builderManager.builder.capacity;

      this.energy += this.energyPerSec * delta;
      if(this.energy < 0) {
        this.energy = 0;
      }
      if(this.energy > this.capacity) {
        this.energy = this.capacity;
      }
    }
}

export class GameManager {
    constructor() {
        this.game = new Game(10, 10);
        this.clock = new THREE.Clock();
        this.timer = this.clock.elapsedTime;
        this.lastGameInfosTime = 0;
        this.lastCreatedMobTime = 2;
        this.gameOverDisplayed = false;
    }

    updateGame(delta) {
      this.game.updateEnergy(delta);

      const elapsed = this.clock.elapsedTime; // in seconds

      /* Create a new Mob */
      if(elapsed - this.lastCreatedMobTime > 5 || g.mobsManager?.mobArray.length === 0 && this.clock.elapsedTime > 5) {
        g.mobsManager.createMob(g.meshes.mobMesh, g.scene);
        this.lastCreatedMobTime = elapsed;
      }

      if(this.game.isGameOver()) {
        if(!this.gameOverDisplayed) {
          this.gameOverDisplayed = true;
          g.gui.gameOverDisplay();
          setTimeout(destroyCanvas, 3000);
        }
      } else {
        g.builderManager.updateBuilder(delta, g.scene);
        g.missilesManager.updateMissilesPosition(delta, g.scene);
        g.mobsManager.updateMobsPosition(delta, g.scene);
        g.towerManager.updateTowers(delta, g.scene);
      }

      g.particulesManager.updateParticules(delta, g.scene);
      g.universeManager.updatePhysicsUniverse(delta);
    }
}

const destroyCanvas = () => {
  g.universeManager.destroy();

  g.renderer = null;
  g.rendererPixi = null;
  g.scene = null;
  g.scenePixi = null;
  g.gui = null;
  g.meshes = {};
  g.clickableObjs = new Array();
  g.gameManager = null;

  // Remove Canvas from DOM + Display Menu
  document.getElementById('canvasGame').remove();
  displayHomeMenu();
}
