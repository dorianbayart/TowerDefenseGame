export const TOWER_TYPES = {
  NORMAL: {
    mesh: undefined,
    rangeMesh: undefined,
    speed: 1,
    power: 1,
    range: 2,
    cost: 5,
    timeToBuild: 3,
  },
  ROCKET: {
    mesh: undefined,
    rangeMesh: undefined,
    speed: 2.5,
    power: 2.5,
    range: 3.5,
    cost: 10,
    timeToBuild: 5,
  }
}

export const MISSILE_TYPES = {
  NORMAL: {
    mesh: undefined,
    speed: 8, // m/s
    energyCost: .5,
  },
  ROCKET: {
    mesh: undefined,
    speed: 3, // m/s
    energyCost: 2,
  }
};

export const PARTICULE_TYPES = {
  NORMAL: {
    lifespan: 1.2,
    explodeEffet: 1,
    number: {
      min: 3,
      max: 8
    },
    size: 0.1,
    mesh: undefined,
  },
  ROCKET: {
    lifespan: 2,
    explodeEffet: 2.5,
    number: {
      min: 3,
      max: 12
    },
    size: 0.12,
    mesh: undefined,
  },
}
