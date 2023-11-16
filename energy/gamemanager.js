import * as THREE from 'three';
import g from './global.js';
import { MISSILE_TYPES } from './types.js';

export class Game {
    constructor(initialMoney, lives) {
        this.money = initialMoney;
        this.score = 0;
        this.lives = lives;
        this.energyPerSec = 0;
        this.energy = 1;
        this.capacity = 0;
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
      
      /* Building towers */
      let towers = g.towerManager.towerArray.filter(tower => tower.isBuilding);
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
        this.lastCreatedMobTime = -2;
    }

    updateGame(delta) {
      this.game.updateEnergy(delta);

      const elapsed = this.clock.elapsedTime; // in seconds

      /* Update Game Infos */
      if(elapsed - this.timer > 1) {
        this.updateGameInfos();
        this.lastGameInfosTime = elapsed;
      }

      /* Create a new Mob */
      if(elapsed - this.lastCreatedMobTime > 3/* || g.mobsManager?.mobArray.length === 0*/) {
        g.mobsManager.createMob(g.meshes.mobMesh, g.scene);
        this.lastCreatedMobTime = elapsed;
      }
    }

    updateGameInfos() {
      if(g.gui.gameInfosToDisplay) {
        g.gui.gameInfosToDisplay.text = `Money: ${this.game.money} | Score: ${this.game.score} | Lives: ${this.game.lives}`;
        g.gui.gameInfosToDisplay.text += `\nEnergy: ${this.game.energy.toFixed((this.game.energy > 10 || this.game.energy === this.game.capacity) ? 0 : 1)}/${this.game.capacity.toFixed(0)} | Production: ${this.game.energyPerSec >= 0 ? '+' : ''}${this.game.energyPerSec.toFixed(this.game.energyPerSec > 10 ? 0 : 2)}/s`;
      }
    }
}
