import g from './global.js';
import { objectsMargin, COLOR, THREE_COLOR } from './constants.js';

/*
TYPE
0: path
1: wall
2: entrance
3: exit
*/

export class Cell {
    constructor(x, z) {
        this.type = 1;
        this.mesh = g.meshes.wallMesh.clone();
        this.mesh.position.x = x;
        this.mesh.position.z = z;
    }

    updatePolygon = () => {
      var newMaterial = this.mesh.material.clone();
        if (this.type < 2) {
            this.mesh.scale.y = 0.05 + 0.95 * this.type;
            newMaterial.color = this.type === 0 ? THREE_COLOR.GRAY : THREE_COLOR.LIGHTGRAY;
        } else {
            if (this.type === 2) {
                // entrance
                newMaterial.color = THREE_COLOR.GREEN;
                newMaterial.opacity = 0.5;
                newMaterial.transparent = true;
            } else if (this.type === 3) {
                // exit
                newMaterial.color = THREE_COLOR.RED;
                newMaterial.opacity = 0.5;
                newMaterial.transparent = true;
            }
        }
        this.mesh.material = newMaterial;
        this.mesh.position.y = this.mesh.geometry.parameters.height * this.mesh.scale.y / 2;
    };
};

export const cellUUID = (coords) => {
    return `x${coords.x}z${coords.z}`;
};

export class MazeManager {
  constructor() {
    this.maze = new Maze();
  }

}

export class Maze {
    constructor() {
      this.map = undefined
      this.width = 0;
      this.height = 0;
      this.entrance = { x: undefined, z: undefined };
      this.exit = { x: undefined, z: undefined };
      this.paths = undefined;
    }

    generate = (width, height) => {
      this.width = width;
      this.height = height;

        if (this.map && this.map.length) {
            for (var x = 0; x < this.map.length; x++) {
                for (var z = 0; z < this.map[0].length; z++) {
                    const cell = this.map[x][z];
                    g.scene.remove(cell.mesh);
                }
            }
        }

        this.map = new Array();

        for (var x = 0; x < this.width; x++) {
            this.map[x] = new Array();
            for (var z = 0; z < this.height; z++) {
                const cell = new Cell(
                  x * objectsMargin - (this.width * objectsMargin) / 2 + 1 / 2,
                  z * objectsMargin - (this.height * objectsMargin) / 2 + 1 / 2
                );

                let type = z + x * this.height;
                if (x === 0 || x === this.width - 1 || z === 0 || z === this.height - 1) {
                    type = 1;
                }
                cell.type = (x === 0 || x === this.width - 1 || z === 0 || z === this.height - 1) ? 1 : z + x * this.height;

                this.map[x][z] = cell;
            }
        }

        // Define Entrance position
        const entranceZ = Math.floor(Math.random() * (this.width - 4)) + 2;
        this.entrance = { x: 0, z: entranceZ };

        this.map[0][entranceZ].type = 2;

        // Generate the Maze
        this.recursiveGeneratorCell(0, entranceZ);

        // Build the Maze paths
        this.paths = new Map();
        this.mazeSolver();

        // Search an exit with a long path
        // TODO: allow the exit to be everywhere - search for the longest path all over the maze
        this.exit = { x: this.map.length - 1, z: Math.floor(Math.random() * (this.width - 4)) + 2 };
        for (var z = 0; z < this.height; z++) {
            const potentialExit = { x: this.map.length - 1, z: z };
            if (this.paths.get(cellUUID({ x: this.exit.x - 1, z: this.exit.z })) < this.paths.get(cellUUID({ x: potentialExit.x - 1, z: potentialExit.z }))) {
                this.exit = potentialExit;
            }
        }

        // If the exit has no path to, generate another maze
        if (!this.paths.has(cellUUID({ x: this.exit.x - 1, z: this.exit.z }))) {
            this.generate(this.width, this.height);
        }

        this.map[this.exit.x][this.exit.z].type = 3;

        for (var x = 0; x < this.width; x++) {
            for (var z = 0; z < this.height; z++) {
                if (this.map[x][z].type > 3) {
                    this.map[x][z].type = 1;
                }
                this.map[x][z].updatePolygon();

                if (this.map[x][z].type === 1) {
                    g.clickableObjs.push(this.map[x][z].mesh);
                }
                if(this.map[x][z].type > 0) {
                  g.scene.add(this.map[x][z].mesh);
                  g.universeManager.linkPhysicsObject(this.map[x][z].mesh, 0);
                }
            }
        }
    };


      recursiveGeneratorCell = (x, z) => {
          let cells = [];
          if (x > 1 && this.map[x - 1][z].type > 3) cells.push(this.map[x - 1][z].type);
          if (x < this.width - 2 && this.map[x + 1][z].type > 3) cells.push(this.map[x + 1][z].type);
          if (z > 1 && this.map[x][z - 1].type > 3) cells.push(this.map[x][z - 1].type);
          if (z < this.height -2 && this.map[x][z + 1].type > 3) cells.push(this.map[x][z + 1].type);
          if (cells.length === 0) return;

          while (cells.length > 0) {
              const alea = Math.floor(Math.random() * cells.length);
              const xToTest = Math.floor(cells[alea] / this.height);
              const zToTest = cells[alea] % this.width;

              if (
                  z === zToTest &&
                  this.map[xToTest][z - 1].type !== 0 &&
                  this.map[xToTest][z + 1].type !== 0 &&
                  this.map[xToTest + (xToTest - x)][z]?.type !== 0
              ) {
                  this.map[xToTest][z].type = 0;
                  this.recursiveGeneratorCell(xToTest, z);
              } else if (z === zToTest) {
                  this.map[xToTest][z].type = 1;
              } else if (
                  x === xToTest &&
                  this.map[x - 1][zToTest].type !== 0 &&
                  this.map[x + 1][zToTest].type !== 0 &&
                  this.map[x][zToTest + (zToTest - x)]?.type !== 0
              ) {
                  this.map[x][zToTest].type = 0;
                  this.recursiveGeneratorCell(x, zToTest);
              } else if (x === xToTest) {
                  this.map[x][zToTest].type = 1;
              }

              cells.splice(alea, 1);
          }
      };



      mazeSolver = () => {
          const frontier = new Array();
          frontier.push(this.entrance);
          this.paths.set(cellUUID(this.entrance), 0);

          while (frontier.length > 0) {
              const current = frontier.shift();
              const neighboors = this.mazeGetNeighboors(current);
              for (const neighboor of neighboors) {
                  if (!this.paths.has(cellUUID(neighboor))) {
                      frontier.push(neighboor);
                      this.paths.set(cellUUID(neighboor), this.paths.get(cellUUID(current)) + 1);
                  }
              }
          }
      };

      mazeGetNeighboors = (cell) => {
          const neighboors = new Array();
          if (cell.z < this.height - 1 && this.map[cell.x][cell.z + 1].type !== 1)
              neighboors.push({ x: cell.x, z: cell.z + 1 });
          if (cell.z > 0 && this.map[cell.x][cell.z - 1].type !== 1) neighboors.push({ x: cell.x, z: cell.z - 1 });
          if (cell.x < this.width - 1 && this.map[cell.x + 1][cell.z].type !== 1)
              neighboors.push({ x: cell.x + 1, z: cell.z });
          if (cell.x > 0 && this.map[cell.x - 1][cell.z].type !== 1) neighboors.push({ x: cell.x - 1, z: cell.z });
          return neighboors;
      };

}
