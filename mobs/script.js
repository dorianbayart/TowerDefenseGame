'use strict';

var COLOR = {
    GREEN: new THREE.Color('green'),
    RED: new THREE.Color('red'),
};

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

// RAYCASTER
var raycaster;
var mouse = new THREE.Vector2();
var clickableObjs = new Array();

// Game objs
var cursor;
var mob_mesh;

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
        camera = new THREE.PerspectiveCamera(
            getFov(),
            window.innerWidth / window.innerHeight,
            1,
            gridSize * polygonSize * getFov()
        );
    } else {
        camera = new THREE.PerspectiveCamera(
            getFov(),
            window.innerWidth / window.innerHeight,
            1,
            gridSize * polygonSize * getFov()
        );
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

    // MOB MESH
    const mob_material = new THREE.MeshLambertMaterial({ color: 0x16a085 });
    const mob_geometry = new THREE.BoxGeometry(1, 1, 1);
    mob_mesh = new THREE.Mesh(mob_geometry, mob_material);
    mob_mesh.position.y = polygonSize / 2;

    const cursor_material = new THREE.MeshLambertMaterial({ transparent: true, opacity: 0, color: 'green' });
    const cursor_geometry = new THREE.BoxGeometry(10, 1, 10);
    cursor = new THREE.Mesh(cursor_geometry, cursor_material);
    scene.add(cursor);

    raycaster = new THREE.Raycaster();

    // ---------------- EVENTS ----------------
    document.addEventListener('pointerdown', onMouseDown, false);
    document.addEventListener('pointerup', onMouseUp, false);
    document.addEventListener('pointermove', onMouseMove, false);
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



const onMouseUp = (event) => {
    cursor.material.emissive.g = 0;
    cursor.material.color = COLOR.GREEN;
};

const onMouseDown = (event) => {
    event.preventDefault();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    var intersects = raycaster.intersectObjects(clickableObjs);

    if (intersects.length > 0) {
        cursor.material.color = COLOR.RED;
    }
};

const onMouseMove = (event) => {
    event.preventDefault();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    var intersects = raycaster.intersectObjects(clickableObjs);

    if (intersects.length > 0) {
        var selectedBloc = intersects[0].object;
        cursor.position.set(
            selectedBloc.position.x,
            selectedBloc.position.y + polygonSize / 2,
            selectedBloc.position.z
        );
        cursor.material.opacity = 0.5;
    } else {
        cursor.material.opacity = 0;
    }
};

init();
