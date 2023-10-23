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
    lifespan: 10,
    explodeEffet: 1,
    number: {
      min: 15,
      max: 40
    },
    size: 0.1,
    mesh: undefined,
  },
  ROCKET: {
    lifespan: 1,
    explodeEffet: 2.5,
    number: {
      min: 8,
      max: 15
    },
    size: 0.12,
    mesh: undefined,
  },
}
