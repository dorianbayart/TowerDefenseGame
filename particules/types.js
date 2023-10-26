'use strict';

var TOWER_TYPES = {
  NORMAL: {
    mesh: undefined,
    rangeMesh: undefined,
    speed: 1,
    power: 1,
    range: 2.5,
    cost: 5
  },
  ROCKET: {
    mesh: undefined,
    rangeMesh: undefined,
    speed: 1.75,
    power: 2,
    range: 4,
    cost: 10
  }
}

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
