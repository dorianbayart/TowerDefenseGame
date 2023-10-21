
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

        setInterval(() => {
            var elapsed = clock.elapsedTime;
            mobsManager.createMob(mobMesh, scene, elapsed);
          }, 5000
        );
    }

    updateGameInfos() {
      if(gameInfosToDisplay) {
        gameInfosToDisplay.text = `Money: ${this.game.money} | Score: ${this.game.score} | Lives: ${this.game.lives}`;
      }
    }
}
