import * as THREE from 'three';
import g from './global.js';
import { MISSILE_TYPES } from './types.js';

let btVector;

class missilePosition {
    constructor(x, z) {
        this.x = x;
        this.z = z;
    }
}

export class Missile {
    constructor(type, mob, power, speed, energyCost) {
        this.mesh = undefined;
        this.type = type ?? 'NORMAL';

        this.target = mob; // type Mob

        this.speed = speed;
        this.power = power;
    }

    isAtTarget() {
      const vector = {
        x: this.target.mesh.position.x - this.mesh.position.x,
        y: this.target.mesh.position.y - this.mesh.position.y,
        z: this.target.mesh.position.z - this.mesh.position.z,
      }
      const distance = Math.sqrt(vector.x*vector.x + vector.y*vector.y + vector.z*vector.z);

      return distance <= this.target.mesh.geometry.parameters.width / 2;
    }

    updatePosition(delta) {
        if (!this.target) {
            return;
        }

        const vector = {
          x: this.target.mesh.position.x - this.mesh.position.x,
          y: this.target.mesh.position.y - this.mesh.position.y,
          z: this.target.mesh.position.z - this.mesh.position.z,
        }

        const distance = Math.sqrt(vector.x*vector.x + vector.y*vector.y + vector.z*vector.z);

        const factor = delta * this.speed / distance;

        this.mesh.position.x += vector.x * factor;
        this.mesh.position.y += vector.y * factor;
        this.mesh.position.z += vector.z * factor;

        if(this.type === 'ROCKET') {
          btVector.set(vector.x, vector.y, vector.z);
          this.mesh.quaternion.setFromUnitVectors(
            this.mesh.up.normalize(),
            btVector.normalize()
          );
        }
    }
}

export class MissilesManager {
    constructor() {
        this.missileArray = new Array();

        btVector = new THREE.Vector3();
    }

    createMissile(type, position, target, power) {
        var missile = new Missile(type, target, power, MISSILE_TYPES[type].speed);
        missile.mesh = MISSILE_TYPES[type].mesh.clone();

        missile.mesh.position.x = position.x;
        missile.mesh.position.y = position.y;
        missile.mesh.position.z = position.z;

        this.missileArray.push(missile);
        g.scene.add(missile.mesh);
    }

    deleteMissiles(mobstodelete_array) {
        for (var i = 0; i < mobstodelete_array.length; i++) {
            const index = this.missileArray.indexOf(mobstodelete_array[i]);
            if (index > -1) {
                this.missileArray.splice(index, 1);
            }
            g.scene.remove(mobstodelete_array[i].mesh);
        }
    }

    updateMissilesPosition(delta) {
        var missilestodelete = new Array();

        for (var i = 0; i < this.missileArray.length; i++) {
          if(this.missileArray[i].target.isAlive()) {
            this.missileArray[i].updatePosition(delta);

            if(this.missileArray[i].isAtTarget()) { // missile arrived at destination
              this.missileArray[i].target.isUnderAttack(this.missileArray[i].power, 0, g.scene);
              g.particulesManager.createExplosion(this.missileArray[i].type, this.missileArray[i].mesh.position);
              missilestodelete.push(this.missileArray[i]);
            }
          } else {
            /* Target already dead */
            missilestodelete.push(this.missileArray[i]);
          }
        }

        this.deleteMissiles(missilestodelete);
    }
}
