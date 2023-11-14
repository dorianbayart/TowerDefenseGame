import * as THREE from 'three';
import g from './global.js';
import { getShuffledArr } from './helpers.js';
import { MISSILE_TYPES, TOWER_TYPES } from './types.js';
import { ORDERS } from './buildermanager.js';

export class TowerManager {
    constructor() {
        // ---- Tower List ----
        this.towerArray = new Array();
        this.lastShuffling = 0;

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

        g.builderManager.addOrder(ORDERS.BUILD, tower);

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
      if(this.towerArray.length === 0) return;

      this.lastShuffling += delta;
      if(this.lastShuffling > 1) {
        this.towerArray = getShuffledArr(this.towerArray);
        console.log('shuffling !');
        this.lastShuffling -= 1;
      }

      for (var tower of this.towerArray) {
        if(tower.building < 1) {
          tower.updateBuilding(delta);
        } else {
          for (var mob of g.mobsManager.mobArray) {
            const x = mob.mesh.position.x - tower.mesh.position.x;
            const z = mob.mesh.position.z - tower.mesh.position.z;
            const distance = Math.sqrt(x*x + z*z);
            if(/*(!tower.target || distance < tower.getTargetDistance()) &&*/ distance < tower.range) {
              if(!tower.target) tower.target = mob;
              //if(distance < tower.getTargetDistance()) tower.target = mob; // choose the closest mob
              if(mob.getDistanceFromEntrance() < tower.target.getDistanceFromEntrance()) tower.target = mob; // choose the mob closest to entrance
            }
          }

          tower.updateAttack(delta);
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

        this.isBuilding = false;
        this.building = 0; // between 0 and 1 - represent the build percentage
        this.energyPerSec = g.builderManager.builder.energyPerSec; // energy needed during build

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
      if(!this.wireframeMesh && this.building === 0) {
        //this.mesh.castShadow = false;
        this.mesh.material = TOWER_TYPES[this.type].mesh.material.clone();
        this.mesh.material.transparent = true;
        this.mesh.material.opacity = 0;
        //this.mesh.material.side = THREE.DoubleSide;
        //this.mesh.material.shadowSide = THREE.DoubleSide;
        this.mesh.castShadow = false;
        this.wireframeMesh = this.mesh.clone();
        this.wireframeMesh.material = this.mesh.material.clone();
        this.wireframeMesh.material.wireframe = true;
        g.scene.add(this.wireframeMesh);
      }

      if(!g.builderManager.builder.isCloseTo(this.mesh.position) || g.gameManager.game.energy < delta*this.energyPerSec) {
        this.isBuilding = false;
        return;
      }

      this.building += delta / TOWER_TYPES[this.type].timeToBuild;

      if(this.building >= 1) {
        this.building = 1;
        this.isBuilding = false;
        g.scene.remove(this.wireframeMesh);
        this.wireframeMesh.material.dispose();
        this.wireframeMesh = undefined;
        this.mesh.material = TOWER_TYPES[this.type].mesh.material;
        this.mesh.castShadow = true;
        g.builderManager.removeOrder(ORDERS.BUILD, this);
      } else {
        this.isBuilding = true;
        this.wireframeMesh.material.opacity = this.building;
        this.mesh.material.opacity = this.building;
        this.wireframeMesh.castShadow = true;
      }
    }

    updateAttack(delta) {
      this.elapsedTimeSinceLastAttack += delta;

      if(!this.target || !this.target.isAlive() || this.getTargetDistance() > this.range) {
        this.target = undefined;
        return;
      }

      if(this.elapsedTimeSinceLastAttack >= this.speed && MISSILE_TYPES[this.type].energyCost <= g.gameManager.game.energy) {
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
