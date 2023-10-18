class missilePosition {
    constructor(x, z) {
        this.x = x;
        this.z = z;
    }
}

class Missile {
    constructor(mob, power, speed) {
        this.mesh = undefined;

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

      return distance <= this.mesh.geometry.parameters.radius;
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

        // // --------- Z AXIS -----------
        // if (this.mesh.position.z < this.target.mesh.position.z) {
        //     this.mesh.position.z += this.speed * delta;
        //     if (this.mesh.position.z > this.target.mesh.position.z) {
        //         this.mesh.position.z = this.target.mesh.position.z;
        //     }
        // } else if (this.mesh.position.z > this.target.mesh.position.z) {
        //     this.mesh.position.z -= this.speed * delta;
        //     if (this.mesh.position.z < this.target.mesh.position.z) {
        //         this.mesh.position.z = this.target.mesh.position.z;
        //     }
        // }
        //
        // // --------- X AXIS -----------
        // if (this.mesh.position.x < this.target.mesh.position.x) {
        //     this.mesh.position.x += this.speed * delta;
        //     if (this.mesh.position.x > this.target.mesh.position.x) {
        //         this.mesh.position.x = this.target.mesh.position.x;
        //     }
        // } else if (this.mesh.position.x > this.target.mesh.position.x) {
        //     this.mesh.position.x -= this.speed * delta;
        //     if (this.mesh.position.x < this.target.mesh.position.x) {
        //         this.mesh.position.x = this.target.mesh.position.x;
        //     }
        // }
    }
}

class MissilesManager {
    constructor() {
        this.missileArray = new Array();
    }

    createMissile(type, position, target, power, scene) {
        var missile = new Missile(target, power, type.speed);
        missile.mesh = type.mesh.clone();

        missile.mesh.position.x = position.x;
        missile.mesh.position.y = position.y;
        missile.mesh.position.z = position.z;

        this.missileArray.push(missile);
        scene.add(missile.mesh);
    }

    deleteMissiles(mobstodelete_array, scene) {
        for (var i = 0; i < mobstodelete_array.length; i++) {
            const index = this.missileArray.indexOf(mobstodelete_array[i]);
            if (index > -1) {
                this.missileArray.splice(index, 1);
            }
            scene.remove(mobstodelete_array[i].mesh);
        }
    }

    updateMissilesPosition(delta, scene) {
        var missilestodelete = new Array();

        for (var i = 0; i < this.missileArray.length; i++) {
            this.missileArray[i].updatePosition(delta);

            if(this.missileArray[i].isAtTarget()) { // missile arrived at destination
              this.missileArray[i].target.isUnderAttack(this.missileArray[i].power, 0, scene);
              missilestodelete.push(this.missileArray[i]);
            }
        }

        this.deleteMissiles(missilestodelete, scene);
    }
}
