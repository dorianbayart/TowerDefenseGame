'use strict';

class TowerManager {
    constructor() {
        // ---- Tower List ----
        this.towerArray = new Array();

        // ---- Temporary variables ----
        this.newTowerMeshToCreate = undefined;
        this.selectedTower = undefined;
        this.rangeTowerToDisplay = undefined;
    }

    addTower(newTowerMesh) {
        var newTower = new Tower();
        newTower.mesh = newTowerMesh;
        this.towerArray.push(newTower);
        return newTower.cost;
    }

    deleteTower(towerObj) {
        const index = this.towerArray.indexOf(towerObj);
        if (index > -1) {
            this.towerArray.splice(index, 1);
        }
    }

    getTowerAtPosition(x, z) {
        for (var i = 0; i < this.towerArray.length; i++) {
            if (this.towerArray[i].mesh.position.x == x && this.towerArray[i].mesh.position.z == z) {
                return this.towerArray[i];
            }
        }
        return null;
    }

    updateTowers(delta, scene) {
      for (var i = 0; i < this.towerArray.length; i++) {
        for (var j = 0; j < mobsManager.mobArray.length; j++) {
          const x = mobsManager.mobArray[j].mesh.position.x - this.towerArray[i].mesh.position.x;
          const z = mobsManager.mobArray[j].mesh.position.z - this.towerArray[i].mesh.position.z;
          const distance = Math.sqrt(x*x + z*z);
          if((!this.towerArray[i].target || distance < this.towerArray[i].getTargetDistance) && distance < this.towerArray[i].range) {
            this.towerArray[i].target = mobsManager.mobArray[j];
          }
        }

        this.towerArray[i].updateAttack(delta, scene);
      }
    }
}

class Tower {
  static DEFAULT_POWER = 1;
  static DEFAULT_SPEED = 1;
  static DEFAULT_RANGE = 2.5;
  static DEFAULT_COST = 5;

    constructor(power, speed, range, cost) {
        this.mesh = undefined;

        this.power = power ?? Tower.DEFAULT_POWER;
        this.speed = speed ?? Tower.DEFAULT_SPEED;
        this.range = range ?? Tower.DEFAULT_RANGE;
        this.cost = cost ?? Tower.DEFAULT_COST;

        this.target = undefined; // instance of Mob
        this.elapsedTimeSinceLastAttack = 0;
    }

    getTargetDistance() {
      const x = this.target.mesh.position.x - this.mesh.position.x;
      const z = this.target.mesh.position.z - this.mesh.position.z;
      const distance = Math.sqrt(x*x + z*z);
      return distance;
    }

    updateAttack(delta, scene) {
      this.elapsedTimeSinceLastAttack += delta;

      if(!this.target || !this.target.isAlive() || this.getTargetDistance() > this.range) {
        this.target = undefined;
        return;
      }

      if(this.elapsedTimeSinceLastAttack >= this.speed) {
        // TODO: launch a missile
        this.target.isUnderAttack(this.power, 0, scene);
        this.elapsedTimeSinceLastAttack = 0;
      }
    }
}
