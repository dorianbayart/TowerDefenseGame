class mapPosition {
    constructor(newx, newz) {
        this.x = newx;
        this.z = newz;
    }
}

class Mob {
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
      return this.hp > 0;
    }

    isAtEntrance() {
      return this.currentCell.x === entrance.x && this.currentCell.z === entrance.z;
    }

    isUnderAttack(hpReduction, speedReduction = 0, scene) {
      this.hp -= hpReduction;
      if(this.speedReduction > 0){
        this.speedReduction = speedReduction;
        this.speed -= this.speedReduction;
      }

      if(this.hp <= 0) {
        var mobstodelete = new Array();
        mobstodelete.push(this);
        mobsManager.deleteMobs(mobstodelete, scene);
        gameManager.game.updateScore(1);
        gameManager.game.updateMoney(Math.ceil(1 + this.initialHp/8));
      }
    }

    updatePosition(delta) {
        if (!this.targetCell) {
            return;
        }

        var is_X_ok = false;
        var is_Z_ok = false;
        var convertedpositiontarget_x =
            this.targetCell.x * objectsMargin - (mazeSize.width * objectsMargin) / 2 + polygonSize / 2;
        var convertedpositiontarget_z =
            this.targetCell.z * objectsMargin - (mazeSize.height * objectsMargin) / 2 + polygonSize / 2;

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

class MobsManager {
    constructor() {
        this.mobArray = new Array();
    }

    createMob(basemesh, scene) {
        var tmpmob = new Mob(exit, Math.floor(1 + Math.pow(gameManager.game.score, 1.4)/10));
        tmpmob.mesh = basemesh.clone();

        tmpmob.mesh.scale.x = 1 / tmpmob.speed;
        tmpmob.mesh.scale.y = 1 / tmpmob.speed;
        tmpmob.mesh.scale.z = 1 / tmpmob.speed;

        tmpmob.mesh.position.x =
            tmpmob.currentCell.x * objectsMargin - (mazeSize.width * objectsMargin) / 2 + polygonSize / 2;
        tmpmob.mesh.position.y = tmpmob.mesh.position.y / tmpmob.speed;
        tmpmob.mesh.position.z =
            tmpmob.currentCell.z * objectsMargin - (mazeSize.height * objectsMargin) / 2 + polygonSize / 2;

        this.mobArray.push(tmpmob);
        scene.add(tmpmob.mesh);
    }

    getNextStep(currentCell) {
        const currentDistance = mazePaths.get(cellUUID(currentCell));
        const positions = new Array();
        if (mazePaths.get(cellUUID({ x: currentCell.x, z: currentCell.z + 1 })) < currentDistance) {
            positions.push(new mapPosition(currentCell.x, currentCell.z + 1));
        }
        if (mazePaths.get(cellUUID({ x: currentCell.x + 1, z: currentCell.z })) < currentDistance) {
            positions.push(new mapPosition(currentCell.x + 1, currentCell.z));
        }
        if (mazePaths.get(cellUUID({ x: currentCell.x, z: currentCell.z - 1 })) < currentDistance) {
            positions.push(new mapPosition(currentCell.x, currentCell.z - 1));
        }
        if (mazePaths.get(cellUUID({ x: currentCell.x - 1, z: currentCell.z })) < currentDistance) {
            positions.push(new mapPosition(currentCell.x - 1, currentCell.z));
        }
        return positions[Math.floor(Math.random()*positions.length)];
    }

    deleteMobs(mobstodelete_array, scene) {
        for (var i = 0; i < mobstodelete_array.length; i++) {
            const index = this.mobArray.indexOf(mobstodelete_array[i]);
            if (index > -1) {
                this.mobArray.splice(index, 1);
            }
            scene.remove(mobstodelete_array[i].mesh);
        }
    }

    updateMobsPosition(delta, scene) {
        var mobstodelete = new Array();

        for (var i = 0; i < this.mobArray.length; i++) {
            if (this.mobArray[i].readyForNextStep) {
                // if we need a new step
                this.mobArray[i].currentCell = this.mobArray[i].targetCell;
                this.mobArray[i].targetCell = this.getNextStep(this.mobArray[i].currentCell);
                this.mobArray[i].readyForNextStep = false;
                if (!this.mobArray[i].targetCell) {
                    // if invalid target, we delete this mob - end of path or invalid
                    mobstodelete.push(this.mobArray[i]);
                    if(this.mobArray[i].isAtEntrance()) { // player loses 1 life
                      gameManager.game.updateLives(1);
                    }
                }
            }

            this.mobArray[i].updatePosition(delta);
        }

        this.deleteMobs(mobstodelete, scene);
    }
}
