import g from './global.js';
import { TOWER_TYPES } from './types.js';

export class TowerManager {
    constructor() {
        // ---- Tower List ----
        this.towerArray = new Array();

        // ---- Temporary variables ----
        this.newTowerToCreate = undefined;
        this.selectedTower = undefined;
        this.rangeTowerToDisplay = undefined;
    }

    addTower() {
        const tower = g.towerManager.newTowerToCreate;
        g.scene.add(tower.mesh);

        this.towerArray.push(tower);
        g.gameManager.game.updateMoney(-tower.cost);
        g.towerManager.newTowerToCreate = undefined;
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

    updateTowers(delta) {
      for (var i = 0; i < this.towerArray.length; i++) {
        if(this.towerArray[i].isBuilding) {
          this.towerArray[i].updateBuilding(delta);
        } else {
          for (var j = 0; j < g.mobsManager.mobArray.length; j++) {
            const x = g.mobsManager.mobArray[j].mesh.position.x - this.towerArray[i].mesh.position.x;
            const z = g.mobsManager.mobArray[j].mesh.position.z - this.towerArray[i].mesh.position.z;
            const distance = Math.sqrt(x*x + z*z);
            if((!this.towerArray[i].target || distance < this.towerArray[i].getTargetDistance()) && distance < this.towerArray[i].range) {
              this.towerArray[i].target = g.mobsManager.mobArray[j];
            }
          }

          this.towerArray[i].updateAttack(delta);
        }
      }
    }
}

export class Tower {
  static DEFAULT_POWER = 1;
  static DEFAULT_SPEED = 1;
  static DEFAULT_RANGE = 2.5;
  static DEFAULT_COST = 5;

    constructor(type = 'NORMAL', power, speed, range, cost) {
        this.mesh = TOWER_TYPES[type].mesh.clone();

        this.type = type;

        this.power = power ?? TOWER_TYPES[this.type].power;
        this.speed = speed ?? TOWER_TYPES[this.type].speed;
        this.range = range ?? TOWER_TYPES[this.type].range;
        this.cost = cost ?? TOWER_TYPES[this.type].cost;

        this.isBuilding = true;
        this.building = 0; // between 0 and 1 - represent the build percentage

        this.target = undefined; // instance of Mob
        this.elapsedTimeSinceLastAttack = 999;
    }

    getTargetDistance() {
      const x = this.target.mesh.position.x - this.mesh.position.x;
      const z = this.target.mesh.position.z - this.mesh.position.z;
      const distance = Math.sqrt(x*x + z*z);
      return distance;
    }

    updateBuilding(delta) {
      this.building += delta / TOWER_TYPES[this.type].timeToBuild;

      if(!this.wireframeMesh && this.isBuilding) {
        this.mesh.material = TOWER_TYPES[this.type].mesh.material.clone();
        this.mesh.material.transparent = true;
        this.mesh.material.opacity = 0;
        this.wireframeMesh = this.mesh.clone();
        this.wireframeMesh.material = this.mesh.material.clone();
        this.wireframeMesh.material.wireframe = true;
        g.scene.add(this.wireframeMesh);
      }

      if(this.building >= 1) {
        this.building = 1;
        this.isBuilding = false;
        g.scene.remove(this.wireframeMesh);
        this.wireframeMesh = undefined;
        this.mesh.material = TOWER_TYPES[this.type].mesh.material;
      } else {
        this.wireframeMesh.material.opacity = this.building;
        this.mesh.material.opacity = this.building;
      }
    }

    updateAttack(delta) {
      this.elapsedTimeSinceLastAttack += delta;

      if(!this.target || !this.target.isAlive() || this.getTargetDistance() > this.range) {
        this.target = undefined;
        return;
      }

      if(this.elapsedTimeSinceLastAttack >= this.speed) {
        // Launch a missile
        const missilePosition = {
          x: this.mesh.position.x,
          y: this.mesh.position.y + this.mesh.geometry.parameters.height / 2,
          z: this.mesh.position.z
        };
        g.missilesManager.createMissile(this.type, missilePosition, this.target, this.power);
        this.elapsedTimeSinceLastAttack = 0;
      }
    }
}
