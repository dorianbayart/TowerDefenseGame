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

    upgradeSelectedTower() {
      if(this.selectedTower && this.selectedTower.getUpgradeCost() > g.gameManager.game.money) return

      g.gameManager.game.updateMoney(-this.selectedTower.getUpgradeCost())
      g.builderManager.addOrder(ORDERS.UPGRADE, this.selectedTower)
      this.selectedTower.upgrade()
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
        this.lastShuffling -= 1;
      }

      for (var tower of this.towerArray) {
        if(tower.building < 1) {
          tower.updateBuilding(delta);
        } else if(tower.upgrading < 1) {
          tower.upgradeBuilding(delta);
        } else if(Math.random() > 0.1) {
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
  static DEFAULT_LEVEL = 1;
  static DEFAULT_POWER = 1;
  static DEFAULT_SPEED = 1;
  static DEFAULT_RANGE = 2.5;
  static DEFAULT_COST = 5;

    constructor(type = 'NORMAL', level, power, speed, range, cost) {
        this.mesh = TOWER_TYPES[type].mesh.clone();
        this.rangeMesh = TOWER_TYPES[type].rangeMesh.clone();

        this.type = type;

        this.level = level ?? Tower.DEFAULT_LEVEL;
        this.power = power ?? TOWER_TYPES[this.type].power;
        this.speed = speed ?? TOWER_TYPES[this.type].speed;
        this.range = range ?? TOWER_TYPES[this.type].range;
        this.cost = cost ?? TOWER_TYPES[this.type].cost;

        this.isBuilding = false;
        this.isUpgrading = false;
        this.building = 0; // between 0 and 1 - represent the build percentage
        this.upgrading = 1; // between 0 and 1 - represent the build percentage
        this.energyPerSec = this.cost / TOWER_TYPES[this.type].timeToBuild; // energy needed during build

        this.target = undefined; // instance of Mob
        this.elapsedTimeSinceLastAttack = 999;
        this.energyPerSecDuringAttack = MISSILE_TYPES[this.type].energyCost / TOWER_TYPES[this.type].speed; // energy needed during build
    }

    getTargetDistance() {
      const x = this.target.mesh.position.x - this.mesh.position.x;
      const z = this.target.mesh.position.z - this.mesh.position.z;
      const distance = Math.sqrt(x*x + z*z);
      return distance;
    }

    getUpgradeCost() {
      return Math.floor(Math.pow(this.cost, 1.5))
    }

    upgrade() {
      this.upgrading = 0
      this.cost = this.getUpgradeCost()
      this.power = Math.round(this.power * 4 * 100) / 100
      this.speed = Math.round(this.speed * .9 * 100) / 100
      this.range = Math.round((this.range + this.range/8) * 100) / 100
      this.energyPerSecDuringAttack *= 1.5
      this.level ++

      this.rangeMesh.geometry = new THREE.CylinderGeometry( this.range, this.range, 0.05, Math.floor(24 * g.parameters.quality), 1 )
    }

    updateBuilding(delta) {
      if(!this.wireframeMesh && this.building === 0) {
        this.mesh.material = TOWER_TYPES[this.type].mesh.material.clone();
        this.mesh.material.transparent = true;
        this.mesh.material.opacity = 0;
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

    upgradeBuilding(delta) {
      if(!this.wireframeMesh && this.upgrading === 0) {
        this.mesh.material = this.mesh.material.clone();
        this.mesh.material.transparent = true;
        this.mesh.material.opacity = 0;
        this.mesh.castShadow = false;
        this.wireframeMesh = this.mesh.clone();
        this.wireframeMesh.material = this.mesh.material.clone();
        this.wireframeMesh.material.wireframe = true;
        g.scene.add(this.wireframeMesh);
      }

      if(!g.builderManager.builder.isCloseTo(this.mesh.position) || g.gameManager.game.energy < delta*this.energyPerSec) {
        this.isUpgrading = false;
        return;
      }

      this.upgrading += delta / TOWER_TYPES[this.type].timeToBuild;

      if(this.upgrading >= 1) {
        this.upgrading = 1;
        this.isUpgrading = false;
        g.scene.remove(this.wireframeMesh);
        this.wireframeMesh.material.dispose();
        this.wireframeMesh = undefined;
        this.mesh.material = TOWER_TYPES[this.type].mesh.material;
        this.mesh.castShadow = true;
        g.builderManager.removeOrder(ORDERS.UPGRADE, this);
      } else {
        this.isUpgrading = true;
        this.wireframeMesh.material.opacity = this.building;
        this.mesh.material.opacity = this.building;
        this.wireframeMesh.castShadow = true;
      }
    }

    updateAttack(delta) {
      this.elapsedTimeSinceLastAttack += delta;

      if(!this.target || !this.target.isAlive() || this.getTargetDistance() > this.range || this.energyPerSecDuringAttack > g.gameManager.game.energy) {
        this.target = undefined;
        return;
      }

      if(this.elapsedTimeSinceLastAttack >= this.speed && this.energyPerSecDuringAttack*this.speed <= g.gameManager.game.energy) {
        // Launch a missile
        const missilePosition = {
          x: this.mesh.position.x,
          y: this.mesh.position.y + this.mesh.geometry.parameters.height / 2 - (this.type === 'LASER' ? MISSILE_TYPES.LASER.mesh.geometry.parameters.height/2 : 0),
          z: this.mesh.position.z
        };
        g.missilesManager.createMissile(this.type, missilePosition, this.target, this.power);
        this.elapsedTimeSinceLastAttack = 0;
      }
    }
}
