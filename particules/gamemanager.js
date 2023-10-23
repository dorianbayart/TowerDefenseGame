
class Game {
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

class GameManager {
    constructor() {
        this.game = new Game(10, 10);
        this.timer = clock.elapsedTime;

        setInterval(() => {
            const elapsed = clock.elapsedTime; // in seconds
            if(elapsed - this.timer > 3 || mobsManager.mobArray.length === 0) {
              mobsManager.createMob(mobMesh, scene);
              this.timer = elapsed;
            }
          }, 250
        );
    }

    updateGameInfos() {
      if(gameInfosToDisplay) {
        gameInfosToDisplay.text = `Money: ${this.game.money} | Score: ${this.game.score} | Lives: ${this.game.lives}`;
      }
    }
}
