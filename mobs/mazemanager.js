"use strict";

const mazeGenerator = async () => {
    const entrance = Math.floor(Math.random() * (mazeSize.width - 4)) + 2;
    const exit = Math.floor(Math.random() * (mazeSize.width - 4)) + 2;

    maze[0][entrance].type = 2;
    updatePolygon(maze[0][entrance]);

    maze[1][entrance].type = 0;
    updatePolygon(maze[1][entrance]);

    maze[mazeSize.height - 1][exit].type = 3;
    updatePolygon(maze[mazeSize.height - 1][exit]);

    await recursiveGeneratorCell(1, entrance);
    maze[mazeSize.height - 2][exit].type = 0;
    updatePolygon(maze[mazeSize.height - 2][exit]);
    maze[mazeSize.height - 3][exit].type = 0;
    updatePolygon(maze[mazeSize.height - 3][exit]);

    for (var x = 0; x < mazeSize.width; x++) {
        for (var z = 0; z < mazeSize.height; z++) {
            if (maze[x][z].type > 3) {
                maze[x][z].type = 1;
            }
            if (maze[x][z].type === 1) {
                clickableObjs.push(maze[x][z].polygon);
            }
        }
    }
};

const recursiveGeneratorCell = async (x, z) => {
    let cells = [];
    if (maze[x - 1][z].type > 3) cells.push(maze[x - 1][z].type);
    if (maze[x + 1][z].type > 3) cells.push(maze[x + 1][z].type);
    if (maze[x][z - 1].type > 3) cells.push(maze[x][z - 1].type);
    if (maze[x][z + 1].type > 3) cells.push(maze[x][z + 1].type);
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
            updatePolygon(maze[xToTest][z]);
            await recursiveGeneratorCell(xToTest, z);
        } else if (z === zToTest) {
            maze[xToTest][z].type = 1;
            updatePolygon(maze[xToTest][z]);
        } else if (
            x === xToTest &&
            maze[x - 1][zToTest].type !== 0 &&
            maze[x + 1][zToTest].type !== 0 &&
            maze[x][zToTest + (zToTest - x)]?.type !== 0
        ) {
            maze[x][zToTest].type = 0;
            updatePolygon(maze[x][zToTest]);
            await recursiveGeneratorCell(x, zToTest);
        } else if (x === xToTest) {
            maze[x][zToTest].type = 1;
            updatePolygon(maze[x][zToTest]);
        }

        cells.splice(alea, 1);
    }
};
