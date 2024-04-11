export const TOWER_TYPES = {
  NORMAL: {
    mesh: undefined,
    rangeMesh: undefined,
    speed: 1,
    power: 1,
    range: 2,
    cost: 5,
    timeToBuild: 3,
    iconUrl: '../public/icons/fire-ray.svg'
  },
  MACHINE_GUN: {
    mesh: undefined,
    rangeMesh: undefined,
    speed: .25,
    power: .25,
    range: 2.5,
    cost: 8,
    timeToBuild: 3,
    iconUrl: '../public/icons/cannon-ball.svg'
  },
  ROCKET: {
    mesh: undefined,
    rangeMesh: undefined,
    speed: 2.5,
    power: 2.5,
    range: 3.5,
    cost: 10,
    timeToBuild: 5,
    iconUrl: '../public/icons/rocket.svg'
  },
  LASER: {
    mesh: undefined,
    rangeMesh: undefined,
    speed: 0.1,
    power: 0.25,
    range: 3,
    cost: 15,
    timeToBuild: 8,
    iconUrl: '../public/icons/laser-blast.svg'
  }
}

export const MISSILE_TYPES = {
  NORMAL: {
    mesh: undefined,
    speed: 6, // m/s
    energyCost: .5,
  },
  MACHINE_GUN: {
    mesh: undefined,
    speed: 8, // m/s
    energyCost: .2,
  },
  ROCKET: {
    mesh: undefined,
    speed: 3, // m/s
    energyCost: 2,
  },
  LASER: {
    mesh: undefined,
    speed: 12, // m/s
    energyCost: .1,
  }
};

export const PARTICULE_TYPES = {
  NORMAL: {
    lifespan: 1.2,
    explodeEffet: 1,
    number: {
      min: 4,
      max: 8
    },
    size: 0.1,
    mesh: undefined,
  },
  MACHINE_GUN: {
    lifespan: 1.2,
    explodeEffet: 1,
    number: {
      min: 2,
      max: 5
    },
    size: 0.075,
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
  LASER: {
    lifespan: 0.8,
    explodeEffet: 0.4,
    number: {
      min: 1,
      max: 3
    },
    size: 0.075,
    mesh: undefined,
  },
}
