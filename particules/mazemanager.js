'use strict';

/*
TYPE
0: path
1: wall
2: entrance
3: exit
*/

class Cell {
    constructor(x, z) {
        this.type = 1;
        this.mesh = wallMesh.clone();
        this.mesh.position.x = x * objectsMargin - (mazeSize.width * objectsMargin) / 2 + polygonSize / 2;
        this.mesh.position.z = z * objectsMargin - (mazeSize.height * objectsMargin) / 2 + polygonSize / 2;
    }

    updatePolygon = () => {
        if (this.type < 2) {
            this.mesh.scale.y = 0.05 + 0.95 * this.type;
            var newMaterial = this.mesh.material.clone();
            newMaterial.color = this.type === 0 ? THREE_COLOR.GRAY : THREE_COLOR.LIGHTGRAY;
            this.mesh.material = newMaterial;
        } else {
            if (this.type === 2) {
                // entrance
                var newMaterial = this.mesh.material.clone();
                newMaterial.color = THREE_COLOR.GREEN;
                newMaterial.opacity = 0.5;
                newMaterial.transparent = true;
                this.mesh.material = newMaterial;
            } else if (this.type === 3) {
                // exit
                var newMaterial = this.mesh.material.clone();
                newMaterial.color = THREE_COLOR.RED;
                newMaterial.opacity = 0.5;
                newMaterial.transparent = true;
                this.mesh.material = newMaterial;
            }
        }
        this.mesh.position.y = (this.mesh.scale.y * polygonSize) / 2;
    };
}

class Maze {
    constructor(width = 25, height = 25) {}
}

const mazeGenerator = () => {
    if (maze && maze.length) {
        for (var x = 0; x < mazeSize.width; x++) {
            for (var z = 0; z < mazeSize.height; z++) {
                const cell = maze[x][z];
                scene.remove(cell.mesh);
            }
        }
    }

    maze = new Array();

    for (var x = 0; x < mazeSize.width; x++) {
        maze[x] = new Array();
        for (var z = 0; z < mazeSize.height; z++) {
            const cell = new Cell(x, z);

            let type = z + x * mazeSize.height;
            if (x === 0 || x === mazeSize.width - 1 || z === 0 || z === mazeSize.height - 1) {
                type = 1;
            }
            cell.type = (x === 0 || x === mazeSize.width - 1 || z === 0 || z === mazeSize.height - 1) ? 1 : z + x * mazeSize.height;

            maze[x][z] = cell;
        }
    }

    // Define Entrance position
    const entranceZ = Math.floor(Math.random() * (mazeSize.width - 4)) + 2;
    entrance = { x: 0, z: entranceZ };

    maze[0][entranceZ].type = 2;

    // Generate the Maze
    recursiveGeneratorCell(0, entranceZ);

    // Build the Maze paths
    mazePaths = new Map();
    mazeSolver(mazePaths);

    // Search an exit with a long path
    // TODO: allow the exit to be everywhere - search for the longest path all over the maze
    exit = { x: maze.length - 1, z: Math.floor(Math.random() * (mazeSize.width - 4)) + 2 };
    for (var z = 0; z < mazeSize.height; z++) {
        const potentialExit = { x: maze.length - 1, z: z };
        if (mazePaths.get(cellUUID({ x: exit.x - 1, z: exit.z })) < mazePaths.get(cellUUID({ x: potentialExit.x - 1, z: potentialExit.z }))) {
            exit = potentialExit;
        }
    }

    // If the exit has no path to, generate another maze
    if (!mazePaths.has(cellUUID({ x: exit.x - 1, z: exit.z }))) {
        mazeGenerator();
    }

    maze[exit.x][exit.z].type = 3;

    for (var x = 0; x < mazeSize.width; x++) {
        for (var z = 0; z < mazeSize.height; z++) {
            if (maze[x][z].type > 3) {
                maze[x][z].type = 1;
            }
            maze[x][z].updatePolygon();

            if (maze[x][z].type === 1) {
                clickableObjs.push(maze[x][z].mesh);
            }
            if(maze[x][z].type > 0) {
              scene.add(maze[x][z].mesh);
              linkPhysicsObject(maze[x][z].mesh, 0);
            }
        }
    }
};

const recursiveGeneratorCell = (x, z) => {
    let cells = [];
    if (x > 1 && maze[x - 1][z].type > 3) cells.push(maze[x - 1][z].type);
    if (x < mazeSize.width - 2 && maze[x + 1][z].type > 3) cells.push(maze[x + 1][z].type);
    if (z > 1 && maze[x][z - 1].type > 3) cells.push(maze[x][z - 1].type);
    if (z < mazeSize.height -2 && maze[x][z + 1].type > 3) cells.push(maze[x][z + 1].type);
    if (cells.length === 0) return;

    while (cells.length > 0) {
        const alea = Math.floor(Math.random() * cells.length);
        const xToTest = Math.floor(cells[alea] / mazeSize.height);
        const zToTest = cells[alea] % mazeSize.width;

        if (
            z === zToTest &&
            maze[xToTest][z - 1].type !== 0 &&
            maze[xToTest][z + 1].type !== 0 &&
            maze[xToTest + (xToTest - x)][z]?.type !== 0
        ) {
            maze[xToTest][z].type = 0;
            recursiveGeneratorCell(xToTest, z);
        } else if (z === zToTest) {
            maze[xToTest][z].type = 1;
        } else if (
            x === xToTest &&
            maze[x - 1][zToTest].type !== 0 &&
            maze[x + 1][zToTest].type !== 0 &&
            maze[x][zToTest + (zToTest - x)]?.type !== 0
        ) {
            maze[x][zToTest].type = 0;
            recursiveGeneratorCell(x, zToTest);
        } else if (x === xToTest) {
            maze[x][zToTest].type = 1;
        }

        cells.splice(alea, 1);
    }
};

const cellUUID = (coords) => {
    return `x${coords.x}z${coords.z}`;
};

const mazeSolver = (mazePaths) => {
    const frontier = new Array();
    frontier.push(entrance);
    mazePaths.set(cellUUID(entrance), 0);

    while (frontier.length > 0) {
        const current = frontier.shift();
        const neighboors = mazeGetNeighboors(current);
        for (const neighboor of neighboors) {
            if (!mazePaths.has(cellUUID(neighboor))) {
                frontier.push(neighboor);
                mazePaths.set(cellUUID(neighboor), mazePaths.get(cellUUID(current)) + 1);
            }
        }
    }
};

const mazeGetNeighboors = (cell) => {
    const neighboors = new Array();
    if (cell.z < mazeSize.height - 1 && maze[cell.x][cell.z + 1].type !== 1)
        neighboors.push({ x: cell.x, z: cell.z + 1 });
    if (cell.z > 0 && maze[cell.x][cell.z - 1].type !== 1) neighboors.push({ x: cell.x, z: cell.z - 1 });
    if (cell.x < mazeSize.width - 1 && maze[cell.x + 1][cell.z].type !== 1)
        neighboors.push({ x: cell.x + 1, z: cell.z });
    if (cell.x > 0 && maze[cell.x - 1][cell.z].type !== 1) neighboors.push({ x: cell.x - 1, z: cell.z });
    return neighboors;
};
