'use strict';

var MISSILE_TYPES = {
  NORMAL: {
    mesh: undefined,
    speed: 8
  },
  ROCKET: {
    mesh: undefined,
    speed: 3
  }
};

var PARTICULE_TYPES = {
  NORMAL: {
    lifespan: 1.5,
    explodeEffet: 0.75,
    number: {
      min: 4,
      max: 10
    },
    size: 0.1,
    mesh: undefined,
  },
  ROCKET: {
    lifespan: 2,
    explodeEffet: 1.5,
    number: {
      min: 8,
      max: 15
    },
    size: 0.12,
    mesh: undefined,
  },
}
