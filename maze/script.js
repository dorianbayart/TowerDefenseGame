'use strict';

// Basic Threejs variables
var scene;
var clock;
var camera;
var renderer;

// Benchmarking
var displayStats = true;
var statsDelay = 1.25; // in seconds
var fps;
var deltas = [];
var deltaSize = 280;
var quality = 1;
var latest = 0;

// Maze
var mazeSize = {
    width: 25,
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

function init() {
    scene = new THREE.Scene();
    clock = new THREE.Clock();

    // ---------------- RENDERER ----------------

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio * quality);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement); // we add the HTML element to the HTML page

    // ---------------- CAMERA ----------------

    if (window.innerWidth > window.innerHeight) {
        camera = new THREE.PerspectiveCamera(
            getFov(),
            window.innerWidth / window.innerHeight,
            1,
            1000
        );
    } else {
        camera = new THREE.PerspectiveCamera(
            getFov(),
            window.innerWidth / window.innerHeight,
            1,
            1000
        );
    }
    camera.position.set(
        -(gridSize * objects_margin) * Math.cos(0),
        gridSize * objects_margin,
        -(gridSize * objects_margin) * Math.sin(0)
    );
    camera.lookAt(new THREE.Vector3(0, -2 * polygonSize, 0));
    scene.add(camera);

    // ---------------- LIGHTS ----------------

    var ambientLight = new THREE.AmbientLight(0xcccccc, 0.25);
    scene.add(ambientLight);

    directionalLight1 = new THREE.PointLight(0xffffff, 10000);
    directionalLight1.position.y = 2 * polygonSize;
    scene.add(directionalLight1);
    directionalLight2 = new THREE.PointLight(0xffffff, 10000);
    directionalLight2.position.y = 2 * polygonSize;
    scene.add(directionalLight2);

    // ---------------- Maze Generator ------------
    mazeGenerator();

    // ---------------- 3D POLYGON ----------------

    for (var x = 0; x < mazeSize.width; x++) {
        for (var z = 0; z < mazeSize.height; z++) {
            const geometry = new THREE.BoxGeometry(polygonSize, polygonSize, polygonSize);
            const material = new THREE.MeshPhongMaterial({
                color: 'deepskyblue',
                side: THREE.DoubleSide,
                shininess: 200,
            });
            const polygon = new THREE.Mesh(geometry, material);
            polygon.position.x = x * objects_margin - (mazeSize.width * objects_margin) / 2 + polygonSize / 2; // POSITION X
            polygon.position.z = z * objects_margin - (mazeSize.height * objects_margin) / 2 + polygonSize / 2; // POSITION Z
            polygon.scale.y = 0.5 + 0.5 * maze[x][z];
            polygon.position.y = (polygon.scale.y * polygonSize) / 2;
            scene.add(polygon);
        }
    }

    window.addEventListener('resize', onResize);

    // ---------------- STARTING THE RENDER LOOP ----------------
    render();
}

function render() {
    requestAnimationFrame(render); // we are calling render() again,  to loop

    var delta = clock.getDelta();
    var elapsed = clock.elapsedTime;

    directionalLight1.position.x = -((Math.cos(elapsed / 3) * (gridSize * objects_margin)) / 3);
    directionalLight1.position.z = (Math.sin(elapsed / 3) * (gridSize * objects_margin)) / 3;

    directionalLight2.position.x = (Math.cos(elapsed / 3) * (gridSize * objects_margin)) / 3;
    directionalLight2.position.z = -(Math.sin(elapsed / 3) * (gridSize * objects_margin)) / 3;

    // camera.position.set(
    //     -(gridSize * objects_margin) * Math.sin(elapsed / 10),
    //     gridSize * objects_margin,
    //     -(gridSize * objects_margin) * Math.cos(elapsed / 10)
    // );
    // camera.lookAt(new THREE.Vector3(0, -2 * polygonSize, 0));

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

function onResize() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.fov = getFov();
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
}

const getFov = () => {
    if (window.innerWidth > window.innerHeight) {
        return (66 * window.devicePixelRatio * window.innerHeight) / window.innerWidth;
    } else {
        return (66 * window.devicePixelRatio * window.innerWidth) / window.innerHeight;
    }
};

const mazeGenerator = () => {
    for (var x = 0; x < mazeSize.width; x++) {
        maze[x] = [];
        for (var z = 0; z < mazeSize.height; z++) {
            maze[x][z] = Math.random() < 0.2 ? 0 : 1;
        }
    }

    console.log(maze);
};

init();
