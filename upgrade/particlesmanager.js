import g from './global.js';
import { PARTICULE_TYPES } from './types.js';

class missilePosition {
    constructor(x, z) {
        this.x = x;
        this.z = z;
    }
}

export class Particule {
  constructor(type = 'NORMAL') {
    this.mesh = PARTICULE_TYPES[type].mesh.clone();
    this.mesh.material = this.mesh.material.clone();
    this.mesh.material.transparent = true;

    this.lifespan = PARTICULE_TYPES[type].lifespan * 0.4 + Math.random()*PARTICULE_TYPES[type].lifespan * 1.6 ?? 1; // seconds
    this.percentLifespan = 1; // percentage
  }

  isDead() {
    return this.lifespan <= 0 || this.mesh.position.y < -25;
  }

  update(delta) {
    this.percentLifespan = this.percentLifespan * (this.lifespan - delta) / this.lifespan;
    this.lifespan -= delta;
    this.mesh.material.opacity = this.percentLifespan;
  }
}

export class ParticulesManager {
  constructor() {
      this.particuleArray = new Array();
  }

  createExplosion(type, position) {
    const particulesNumber = Math.round(Math.random()*(PARTICULE_TYPES[type].number.max - PARTICULE_TYPES[type].number.min) + PARTICULE_TYPES[type].number.min);
    for(var i = 0; i < particulesNumber; i++) {
      const particule = new Particule(type);
      particule.mesh.position.x = position.x + (2*Math.random() - 1) /5;
      particule.mesh.position.y = position.y + 1/5;
      particule.mesh.position.z = position.z + (2*Math.random() - 1) /5;

      g.scene.add(particule.mesh);
      g.universeManager.linkPhysicsParticule(
        particule.mesh,
        0.005,
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

  deleteParticules(particulestodelete_array) {
      for (var i = 0; i < particulestodelete_array.length; i++) {
          const index = this.particuleArray.indexOf(particulestodelete_array[i]);
          if (index > -1) {
              this.particuleArray.splice(index, 1);
          }

          g.universeManager.deleteFromUniverse(particulestodelete_array[i].mesh);
      }
  }

  updateParticules(delta) {
      var particulestodelete = new Array();

      for (var i = 0; i < this.particuleArray.length; i++) {
          this.particuleArray[i].update(delta);

          if(this.particuleArray[i].isDead()) {
            particulestodelete.push(this.particuleArray[i]);
          }
      }

      this.deleteParticules(particulestodelete);
  }
}
