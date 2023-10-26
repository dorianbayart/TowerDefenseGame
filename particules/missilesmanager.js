class missilePosition {
    constructor(x, z) {
        this.x = x;
        this.z = z;
    }
}

class Particule {
  constructor(lifespan) {
    this.mesh = undefined;

    this.lifespan = lifespan ?? 1;
  }

  isDead() {
    return this.lifespan <= 0 || this.mesh.position.y < 0;
  }

  update(delta) {
    this.lifespan -= delta;
  }
}

class ParticulesManager {
  constructor() {
      this.particuleArray = new Array();
  }

  createExplosion(type, position) {
    const particulesNumber = Math.round(Math.random()*(PARTICULE_TYPES[type].number.max - PARTICULE_TYPES[type].number.min) + PARTICULE_TYPES[type].number.min);
    for(var i = 0; i < particulesNumber; i++) {
      var particule = new Particule(PARTICULE_TYPES[type].lifespan * 0.4 + Math.random()*PARTICULE_TYPES[type].lifespan * 1.6);
      particule.mesh = PARTICULE_TYPES[type].mesh.clone();
      particule.mesh.position.x = position.x + (2*Math.random() - 1) * polygonSize/5;
      particule.mesh.position.y = position.y + polygonSize/5;
      particule.mesh.position.z = position.z + (2*Math.random() - 1) * polygonSize/5;

      scene.add(particule.mesh);
      linkPhysicsParticule(
        particule.mesh,
        0.05,
        { x: Math.random(), y: Math.random(), z: Math.random(), w: Math.random() },
        {
          x: (2*Math.random() - 1) * PARTICULE_TYPES[type].explodeEffet,
          y: Math.random() * PARTICULE_TYPES[type].explodeEffet * 3,
          z: (2*Math.random() - 1) * PARTICULE_TYPES[type].explodeEffet
        }
      );
      this.particuleArray.push(particule);
    }
  }

  deleteParticules(particulestodelete_array, scene) {
      for (var i = 0; i < particulestodelete_array.length; i++) {
          const index = this.particuleArray.indexOf(particulestodelete_array[i]);
          if (index > -1) {
              this.particuleArray.splice(index, 1);
          }

          deleteFromUniverse(particulestodelete_array[i].mesh);
      }
  }

  updateParticules(delta, scene) {
      var particulestodelete = new Array();

      for (var i = 0; i < this.particuleArray.length; i++) {
          this.particuleArray[i].update(delta);

          if(this.particuleArray[i].isDead()) {
            particulestodelete.push(this.particuleArray[i]);
          }
      }

      this.deleteParticules(particulestodelete, scene);
  }
}

class Missile {
    constructor(type, mob, power, speed) {
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
          this.mesh.quaternion.setFromUnitVectors(
            this.mesh.up.normalize(),
            (new THREE.Vector3(vector.x, vector.y, vector.z)).normalize()
          );
        }
    }
}

class MissilesManager {
    constructor() {
        this.missileArray = new Array();
    }

    createMissile(type, position, target, power, scene) {
        var missile = new Missile(type, target, power, MISSILE_TYPES[type].speed);
        missile.mesh = MISSILE_TYPES[type].mesh.clone();

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
          if(this.missileArray[i].target.isAlive()) {
            this.missileArray[i].updatePosition(delta);

            if(this.missileArray[i].isAtTarget()) { // missile arrived at destination
              this.missileArray[i].target.isUnderAttack(this.missileArray[i].power, 0, scene);
              particulesManager.createExplosion(this.missileArray[i].type, this.missileArray[i].mesh.position);
              missilestodelete.push(this.missileArray[i]);
            }
          } else {
            console.log('Target already dead')
            missilestodelete.push(this.missileArray[i]);
          }
        }

        this.deleteMissiles(missilestodelete, scene);
    }
}
