import g from './global.js';
import { cellUUID } from './mazemanager.js';
import { objectsMargin, DIFFICULTY } from './constants.js';

class mapPosition {
    constructor(newx, newz) {
        this.x = newx;
        this.z = newz;
    }
}

export class Mob {
    constructor(cell, hp) {
        let speed = 1;
        if (Math.random() > 0.85) speed += 0.5;
        if (Math.random() > 0.85) speed += 1;

        this.mesh = undefined;
        this.hp = hp;
        this.initialHp = hp;
        this.speed = speed;
        this.speedReduction = 0;
        this.currentCell = cell;
        this.targetCell = new mapPosition(cell.x - 1, cell.z);
        this.readyForNextStep = false;
    }

    isAlive() {
      return !this.isAtEntrance() && this.hp > 0;
    }

    isAtEntrance() {
      return this.currentCell.x === g.mazeManager.maze.entrance.x && this.currentCell.z === g.mazeManager.maze.entrance.z;
    }

    isUnderAttack(hpReduction, speedReduction = 0) {
      this.hp -= hpReduction;
      if(this.speedReduction > 0){
        this.speedReduction = speedReduction;
        this.speed -= this.speedReduction;
      }

      if(this.hp <= 0) {
        var mobstodelete = new Array();
        mobstodelete.push(this);
        g.mobsManager.deleteMobs(mobstodelete);
        g.gameManager.game.updateScore(1);
        g.gameManager.game.updateMoney(Math.ceil(1 + this.initialHp/8));
      }
    }

    getDistanceFromEntrance() {
      return g.mazeManager.maze.paths.get(cellUUID(this.currentCell))
    }

    updatePosition(delta) {
        if (!this.targetCell) {
            return;
        }

        var is_X_ok = false;
        var is_Z_ok = false;
        var convertedpositiontarget_x =
            this.targetCell.x * objectsMargin - (g.mazeManager.maze.width * objectsMargin) / 2 + 1 / 2;
        var convertedpositiontarget_z =
            this.targetCell.z * objectsMargin - (g.mazeManager.maze.height * objectsMargin) / 2 + 1 / 2;

        // --------- Z AXIS -----------
        if (this.mesh.position.z < convertedpositiontarget_z) {
            this.mesh.position.z += this.speed * delta;
            if (this.mesh.position.z > convertedpositiontarget_z) {
                this.mesh.position.z = convertedpositiontarget_z;
            }
        } else if (this.mesh.position.z > convertedpositiontarget_z) {
            this.mesh.position.z -= this.speed * delta;
            if (this.mesh.position.z < convertedpositiontarget_z) {
                this.mesh.position.z = convertedpositiontarget_z;
            }
        } else if (this.mesh.position.z === convertedpositiontarget_z) {
            is_Z_ok = true;
        }

        // --------- X AXIS -----------
        if (this.mesh.position.x < convertedpositiontarget_x) {
            this.mesh.position.x += this.speed * delta;
            if (this.mesh.position.x > convertedpositiontarget_x) {
                this.mesh.position.x = convertedpositiontarget_x;
            }
        } else if (this.mesh.position.x > convertedpositiontarget_x) {
            this.mesh.position.x -= this.speed * delta;
            if (this.mesh.position.x < convertedpositiontarget_x) {
                this.mesh.position.x = convertedpositiontarget_x;
            }
        } else if (this.mesh.position.x === convertedpositiontarget_x) {
            is_X_ok = true;
        }

        if (is_X_ok && is_Z_ok) {
            this.readyForNextStep = true;
        }
    }
}

export class MobsManager {
    constructor() {
        this.mobArray = new Array();
    }

    getPowFromDifficulty(difficulty) {
      switch (difficulty) {
        case DIFFICULTY.INSANE:
          return 1.65
          break
        case DIFFICULTY.HARD:
          return 1.5
          break
        case DIFFICULTY.EASY:
          return 1.3
          break
        case DIFFICULTY.SUPEREASY:
          return 1.15
          break
        case DIFFICULTY.NORMAL:
        default:
          return 1.4
      }
    }

    createMob(basemesh) {
        var tmpmob = new Mob(g.mazeManager.maze.exit, Math.floor(1 + Math.pow(g.gameManager.game.score, this.getPowFromDifficulty(g.gameManager.game.difficulty))/10));
        tmpmob.mesh = basemesh.clone();

        tmpmob.mesh.scale.x = 1 / tmpmob.speed;
        tmpmob.mesh.scale.y = 1 / tmpmob.speed;
        tmpmob.mesh.scale.z = 1 / tmpmob.speed;

        tmpmob.mesh.position.x =
            tmpmob.currentCell.x * objectsMargin - (g.mazeManager.maze.width * objectsMargin) / 2 + 1 / 2;
        tmpmob.mesh.position.y = tmpmob.mesh.position.y / tmpmob.speed;
        tmpmob.mesh.position.z =
            tmpmob.currentCell.z * objectsMargin - (g.mazeManager.maze.height * objectsMargin) / 2 + 1 / 2;

        this.mobArray.push(tmpmob);
        g.scene.add(tmpmob.mesh);
    }

    getNextStep(currentCell) {
        const currentDistance = g.mazeManager.maze.paths.get(cellUUID(currentCell));
        const positions = new Array();
        if (g.mazeManager.maze.paths.get(cellUUID({ x: currentCell.x, z: currentCell.z + 1 })) < currentDistance) {
            positions.push(new mapPosition(currentCell.x, currentCell.z + 1));
        }
        if (g.mazeManager.maze.paths.get(cellUUID({ x: currentCell.x + 1, z: currentCell.z })) < currentDistance) {
            positions.push(new mapPosition(currentCell.x + 1, currentCell.z));
        }
        if (g.mazeManager.maze.paths.get(cellUUID({ x: currentCell.x, z: currentCell.z - 1 })) < currentDistance) {
            positions.push(new mapPosition(currentCell.x, currentCell.z - 1));
        }
        if (g.mazeManager.maze.paths.get(cellUUID({ x: currentCell.x - 1, z: currentCell.z })) < currentDistance) {
            positions.push(new mapPosition(currentCell.x - 1, currentCell.z));
        }
        return positions[Math.floor(Math.random()*positions.length)];
    }

    deleteMobs(mobstodelete_array) {
        for (var mob of mobstodelete_array) {
            const index = this.mobArray.indexOf(mob);
            if (index > -1) {
                this.mobArray.splice(index, 1);
            }
            g.scene.remove(mob.mesh);
        }
    }

    updateMobsPosition(delta) {
        var mobstodelete = new Array();

        for (var mob of this.mobArray) {
            if (mob.readyForNextStep) {
                // if we need a new step
                mob.currentCell = mob.targetCell;
                mob.targetCell = this.getNextStep(mob.currentCell);
                mob.readyForNextStep = false;
                if (!mob.targetCell) {
                    // if invalid target, we delete this mob - end of path or invalid
                    mobstodelete.push(mob);
                    if(mob.isAtEntrance()) { // player loses 1 life
                      g.gameManager.game.updateLives(1);
                    }
                }
            }

            mob.updatePosition(delta);
        }

        this.deleteMobs(mobstodelete);
    }
}
