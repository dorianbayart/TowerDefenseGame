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
        this.mesh = polygon_mesh.clone();
        this.mesh.position.x = x * objects_margin - (mazeSize.width * objects_margin) / 2 + polygonSize / 2;
        this.mesh.position.z = z * objects_margin - (mazeSize.height * objects_margin) / 2 + polygonSize / 2;
    }

    updatePolygon = () => {
        if (this.type < 2) {
            this.mesh.scale.y = 0.05 + 0.95 * this.type;
            this.mesh.material.color = this.type === 0 ? THREE_COLOR.DARKGRAY : THREE_COLOR.LIGHTGRAY;
        } else {
            if (this.type === 2) {
                // entrance
                //cell.mesh.scale.y = 0.85;
                this.mesh.material.color = THREE_COLOR.GREEN;
                this.mesh.material.opacity = 0.5;
                this.mesh.material.transparent = true;
            } else if (this.type === 3) {
                // exit
                //cell.mesh.scale.y = 0.85;
                this.mesh.material.color = THREE_COLOR.RED;
                this.mesh.material.opacity = 0.5;
                this.mesh.material.transparent = true;
            }
        }
        this.mesh.position.y = (this.mesh.scale.y * polygonSize) / 2;
    };
}

class Maze {
    constructor(width = 25, height = 25) {}
}

const mazeGenerator = () => {
    maze = new Array();
    console.log('mazeGenerator');

    for (var x = 0; x < mazeSize.width; x++) {
        maze[x] = new Array();
        for (var z = 0; z < mazeSize.height; z++) {
            var cell = new Cell(x, z);
            //const mesh = polygon_mesh.clone();
            // mesh.position.x = x * objects_margin - (mazeSize.width * objects_margin) / 2 + polygonSize / 2; // POSITION X
            // mesh.position.z = z * objects_margin - (mazeSize.height * objects_margin) / 2 + polygonSize / 2; // POSITION Z
            // mesh.position.y = (mesh.scale.y * polygonSize) / 2;
            let type = z + x * mazeSize.height;
            if (x === 0 || x === mazeSize.width - 1 || z === 0 || z === mazeSize.height - 1) {
                type = 1;
            }
            cell.type = (x === 0 || x === mazeSize.width - 1 || z === 0 || z === mazeSize.height - 1) ? 1 : z + x * mazeSize.height;
            // if (x === 0 || x === mazeSize.width - 1 || z === 0 || z === mazeSize.height - 1) {
            //     maze[x][z] = {
            //         type: 1,
            //         polygon: mesh,
            //     };
            // } else {
            //     maze[x][z] = {
            //         type: z + x * mazeSize.height,
            //         polygon: mesh,
            //     };
            // }

            //cell.mesh = mesh;

            maze[x][z] = cell;

            scene.add(cell.mesh);
        }
    }

    // Define Entrance position
    const entranceZ = Math.floor(Math.random() * (mazeSize.width - 4)) + 2;
    entrance = { x: 0, z: entranceZ };

    maze[0][entranceZ].type = 2;
    //updatePolygon(maze[0][entranceZ]);

    //maze[1][entranceZ].type = 0;
    //updatePolygon(maze[1][entranceZ]);

    // Generate the Maze
    recursiveGeneratorCell(0, entranceZ);

    // Build the Maze paths
    mazePaths = new Map();
    mazeSolver(mazePaths);

    // Define Exit position
    exit = { x: maze.length - 1, z: Math.floor(Math.random() * (mazeSize.width - 4)) + 2 };
    while (!mazePaths.has(cellUUID({ x: mazeSize.width - 2, z: exit.z }))) {
        exit.z = Math.floor(Math.random() * (mazeSize.width - 4)) + 2;
    }

    maze[exit.x][exit.z].type = 3;
    //updatePolygon(maze[mazeSize.height - 1][exit.z]);

    //maze[mazeSize.height - 2][exit.z].type = 0;
    //updatePolygon(maze[mazeSize.height - 2][exitZ]);
    //maze[mazeSize.height - 3][exit.z].type = 0;
    //updatePolygon(maze[mazeSize.height - 3][exitZ]);

    for (var x = 0; x < mazeSize.width; x++) {
        for (var z = 0; z < mazeSize.height; z++) {
            if (maze[x][z].type > 3) {
                maze[x][z].type = 1;
                // updatePolygon(maze[x][z]);
            }
            if (maze[x][z].type === 1) {
                clickableObjs.push(maze[x][z].mesh);
            }
            maze[x][z].updatePolygon();
        }
    }

    // entrance = { x: 0, z: maze[0].findIndex((c) => c.type === 2) };
    // exit = { x: maze.length - 1, z: maze[maze.length - 1].findIndex((c) => c.type === 3) };

    // if (!mazePaths.has(cellUUID(exit))) {
    //     mazeGenerator();
    // }
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
            //updatePolygon(maze[xToTest][z]);
            recursiveGeneratorCell(xToTest, z);
        } else if (z === zToTest) {
            maze[xToTest][z].type = 1;
            //updatePolygon(maze[xToTest][z]);
        } else if (
            x === xToTest &&
            maze[x - 1][zToTest].type !== 0 &&
            maze[x + 1][zToTest].type !== 0 &&
            maze[x][zToTest + (zToTest - x)]?.type !== 0
        ) {
            maze[x][zToTest].type = 0;
            //updatePolygon(maze[x][zToTest]);
            recursiveGeneratorCell(x, zToTest);
        } else if (x === xToTest) {
            maze[x][zToTest].type = 1;
            //updatePolygon(maze[x][zToTest]);
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
