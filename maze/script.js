'use strict';

// Basic Threejs variables
var scene;
var clock;
var camera;
var renderer;

// Benchmarking
var displayStats = true;
var statsDelay = 3.25; // in seconds
var fps;
var deltas = [];
var deltaSize = 280;
var quality = 1;
var latest = 0;

// Maze
var mazeSize = {
    width: 20,
    height: 20,
};
var maze = [];

// 3D
// Grid
var gridSize = mazeSize.width > mazeSize.height ? mazeSize.width : mazeSize.height;
var polygonSize = 10;
var elevation = 5;
var objects_margin = polygonSize;

// Lights
var directionalLight1;
var directionalLight2;

async function init() {
    scene = new THREE.Scene();
    clock = new THREE.Clock();

    // ---------------- RENDERER ----------------

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio * quality);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement); // we add the HTML element to the HTML page

    // ---------------- CAMERA ----------------

    if (window.innerWidth > window.innerHeight) {
        camera = new THREE.PerspectiveCamera(getFov(), window.innerWidth / window.innerHeight, 1, gridSize*polygonSize*getFov());
    } else {
        camera = new THREE.PerspectiveCamera(getFov(), window.innerWidth / window.innerHeight, 1, gridSize*polygonSize*getFov());
    }
    camera.position.set(-(gridSize * 1.25 * objects_margin) / 2, gridSize * objects_margin, 0);
    camera.lookAt(new THREE.Vector3(0, -4 * polygonSize, 0));
    scene.add(camera);

    // ---------------- LIGHTS ----------------

    var ambientLight = new THREE.AmbientLight(0xcccccc, 0.75);
    scene.add(ambientLight);

    directionalLight1 = new THREE.PointLight(0xffffff, 10000);
    directionalLight1.position.y = 5 * polygonSize;
    scene.add(directionalLight1);
    directionalLight2 = new THREE.PointLight(0xffffff, 10000);
    directionalLight2.position.y = 5 * polygonSize;
    scene.add(directionalLight2);
    scene.add(new THREE.DirectionalLight(0xffffff, 0.85));

    // ---------------- 3D POLYGON ----------------

    for (var x = 0; x < mazeSize.width; x++) {
        maze[x] = [];
        for (var z = 0; z < mazeSize.height; z++) {
            const geometry = new THREE.BoxGeometry(polygonSize, polygonSize, polygonSize);
            const material = new THREE.MeshPhongMaterial({
                color: 'lightgrey',
                side: THREE.DoubleSide,
                shininess: 200,
            });
            const polygon = new THREE.Mesh(geometry, material);
            polygon.position.x = x * objects_margin - (mazeSize.width * objects_margin) / 2 + polygonSize / 2; // POSITION X
            polygon.position.z = z * objects_margin - (mazeSize.height * objects_margin) / 2 + polygonSize / 2; // POSITION Z

            polygon.position.y = (polygon.scale.y * polygonSize) / 2;

            if (x === 0 || x === mazeSize.width - 1 || z === 0 || z === mazeSize.height - 1) {
                maze[x][z] = {
                    type: 1,
                    polygon: polygon,
                };
            } else {
                maze[x][z] = {
                    type: z + x * mazeSize.height,
                    polygon: polygon,
                };
            }

            scene.add(polygon);
        }
    }

    window.addEventListener('resize', onResize);

    // ---------------- STARTING THE RENDER LOOP ----------------
    render();

    // ---------------- Maze Generator ------------
    mazeGenerator();
}

function render() {
    requestAnimationFrame(render); // we are calling render() again,  to loop

    var delta = clock.getDelta();
    var elapsed = clock.elapsedTime;

    directionalLight1.position.x = -((Math.cos(elapsed / 3) * (gridSize * objects_margin)) / 3);
    directionalLight1.position.z = (Math.sin(elapsed / 3) * (gridSize * objects_margin)) / 3;

    directionalLight2.position.x = (Math.cos(elapsed / 3) * (gridSize * objects_margin)) / 3;
    directionalLight2.position.z = -(Math.sin(elapsed / 3) * (gridSize * objects_margin)) / 3;

    renderer.render(scene, camera); // We are rendering the 3D world

    if (displayStats) {
        deltas.push(delta);
        deltas = deltas.slice(-deltaSize);
        fps = Math.floor(deltas.length / deltas.reduce((a, b) => a + b));

        latest += delta;

        if (latest > statsDelay) {
            latest -= statsDelay;
            const statsDiv = document.getElementById('benchmarking');
            statsDiv.innerHTML = `${Math.floor(elapsed)} sec | ${
                renderer.info.render.triangles
            } triangles | ${fps} FPS | PixelRatio:${window.devicePixelRatio}`;
        }
    }
}

const onResize = () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.fov = getFov();
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
};

const getFov = () => {
    var fov = 0;
    if (window.innerWidth > window.innerHeight) {
        fov = (75 * window.innerHeight) / window.innerWidth;
        return fov > 48 ? fov : 48;
    } else {
        fov = 33 + (60 * window.devicePixelRatio * window.innerWidth) / window.innerHeight;
        return fov < 100 ? fov : 100;
    }
};

const updatePolygon = (cell) => {
    if (cell.type < 2) {
        cell.polygon.scale.y = 0.25 + 0.75 * cell.type;
        cell.polygon.material.color = new THREE.Color(cell.type === 0 ? 'grey' : 'lightgrey');
    } else {
        if (cell.type === 2) {
            // entrance
            cell.polygon.scale.y = 0.75;
            cell.polygon.material.color = new THREE.Color('green');
        } else if (cell.type === 3) {
            // exit
            cell.polygon.scale.y = 0.75;
            cell.polygon.material.color = new THREE.Color('red');
        }
    }
    cell.polygon.position.y = (cell.polygon.scale.y * polygonSize) / 2;
};

const mazeGenerator = async () => {
    const startTime = Date.now();
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

    console.log(maze, Date.now() - startTime);
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
            // setTimeout(() => recursiveGeneratorCell(xToTest, z), 500)
            await recursiveGeneratorCell(xToTest, z);
        } else if (z === zToTest) {
            maze[xToTest][z].type = 1;
            updatePolygon(maze[xToTest][z]);
            // setTimeout(() => recursiveGeneratorCell(x, z), 100)
        } else if (
            x === xToTest &&
            maze[x - 1][zToTest].type !== 0 &&
            maze[x + 1][zToTest].type !== 0 &&
            maze[x][zToTest + (zToTest - x)]?.type !== 0
        ) {
            maze[x][zToTest].type = 0;
            updatePolygon(maze[x][zToTest]);
            // setTimeout(() => recursiveGeneratorCell(x, zToTest), 500)
            await recursiveGeneratorCell(x, zToTest);
        } else if (x === xToTest) {
            maze[x][zToTest].type = 1;
            updatePolygon(maze[x][zToTest]);
            //setTimeout(() => recursiveGeneratorCell(x, z), 100)
        }

        //setTimeout(() => recursiveGeneratorCell(x, z), 1500)
        cells.splice(alea, 1);
        // setTimeout(() => cells.splice(alea, 1), 500)
        // await recursiveGeneratorCell(x, z);
        // requestAnimationFrame(() => renderer.render(scene, camera));
    }

};

init();
