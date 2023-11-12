import * as THREE from 'three';
import g from './global.js';

export const ORDERS = {
  BUILD: 'build'
}

export class Order {
  constructor(type, param) {
    this.type = type;
    this.param = param;
    this.position = undefined;
  }
}

export class Builder {
    constructor() {
        this.mesh = g.meshes.builderMesh.clone();
        this.mesh.position.x = g.mazeManager.maze.entrance.x + 1/2 - g.mazeManager.maze.width/2 + this.mesh.geometry.parameters.radius/2;
        this.mesh.position.z = g.mazeManager.maze.entrance.z + 1/2 - g.mazeManager.maze.height/2 + this.mesh.geometry.parameters.radius/2;

        this.radiusAction = 1;
        this.speed = 1.5;

        this.todoList = new Array();
    }

    isCloseTo(position) {
      const vector = {
        x: position.x - this.mesh.position.x,
        y: position.y - this.mesh.position.y + 1,
        z: position.z - this.mesh.position.z,
      }
      const distance = Math.sqrt(vector.x*vector.x + vector.y*vector.y + vector.z*vector.z);
      return distance <= this.radiusAction
    }

    updatePosition(delta) {
      const order = this.todoList[0];
      const vector = {
        x: order.position.x - this.mesh.position.x,
        y: order.position.y - this.mesh.position.y + 1,
        z: order.position.z - this.mesh.position.z,
      }
      const distance = Math.sqrt(vector.x*vector.x + vector.y*vector.y + vector.z*vector.z);

      if(distance > this.radiusAction) {
        const factor = delta * this.speed / distance;

        this.mesh.position.x += vector.x * factor;
        this.mesh.position.y += vector.y * factor;
        this.mesh.position.z += vector.z * factor;
      }
    }
}

export class BuilderManager {
    constructor(scene) {
        this.builder = new Builder();
        scene.add(this.builder.mesh);
    }

    addOrder(type, param) {
      this.builder.todoList.push(new Order(type, param))
    }

    removeOrder(type, param) {
      if(this.builder.todoList.length === 0) return;

      switch (type) {
        case ORDERS.BUILD:
          const index = this.builder.todoList.findIndex(order => order.type === type && order.param === param)
          if(index > -1) this.builder.todoList.splice(index, 1);
          break;
        default:
      }
    }

    updateBuilder(delta) {
      if(this.builder.todoList.length === 0) return;

      const order = this.builder.todoList[0];

      switch (order.type) {
        case ORDERS.BUILD:
          order.position = order.param.mesh.position;
          this.builder.updatePosition(delta);
          break;
        default:
      }
    }
}
