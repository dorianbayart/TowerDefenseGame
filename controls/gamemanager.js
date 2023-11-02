import * as THREE from 'three';
import g from './global.js';

export class Game {
    constructor(initialMoney, lives) {
        this.money = initialMoney;
        this.score = 0;
        this.lives = lives;
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
}

export class GameManager {
    constructor() {
        this.game = new Game(10, 10);
        this.clock = new THREE.Clock();
        this.timer = this.clock.elapsed;

        setInterval(() => {
            const elapsed = this.clock.elapsedTime; // in seconds
            if(elapsed - this.timer > 3 || g.mobsManager?.mobArray.length === 0) {
              g.mobsManager.createMob(g.meshes.mobMesh, g.scene);
              this.timer = elapsed;
            }
          }, 250
        );
    }

    updateGameInfos() {
      if(g.gui.gameInfosToDisplay) {
        g.gui.gameInfosToDisplay.text = `Money: ${this.game.money} | Score: ${this.game.score} | Lives: ${this.game.lives}`;
      }
    }
}
