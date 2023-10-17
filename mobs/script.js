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
    width: 25,
    height: 25,
};
var maze;
var mazePaths;
var entrance;
var exit;

// Mobs
var mobsManager;

// 3D
// Grid
var gridSize = mazeSize.width > mazeSize.height ? mazeSize.width : mazeSize.height;
var polygonSize = 1;
var objectsMargin = polygonSize;

// Lights
var directionalLight1;
var directionalLight2;

// RAYCASTER
var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();
var clickableObjs = new Array();

// Game objs
var cursor;
var wallMesh;
var mobMesh;

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
    camera.position.set(-(gridSize * 1.25 * objectsMargin) / 2, gridSize * objectsMargin, 0);
    camera.lookAt(new THREE.Vector3(0, -4 * polygonSize, 0));
    scene.add(camera);

    // ---------------- LIGHTS ----------------

    var ambientLight = new THREE.AmbientLight(0xcccccc, 0.4);
    scene.add(ambientLight);

    directionalLight1 = new THREE.PointLight(0xffffff, 5 * gridSize);
    directionalLight1.position.y = 5 * polygonSize;
    scene.add(directionalLight1);
    directionalLight2 = new THREE.PointLight(0xffffff, 5 * gridSize);
    directionalLight2.position.y = 5 * polygonSize;
    scene.add(directionalLight2);
    scene.add(new THREE.DirectionalLight(0xffffff, 2.5));

    // MAZE MESH
    const material = new THREE.MeshPhongMaterial({
        color: COLOR.GRAY,
        shininess: 150,
    });
    const geometry = new THREE.BoxGeometry(polygonSize, polygonSize, polygonSize);
    wallMesh = new THREE.Mesh(geometry, material);

    // MOB MESH
    const mobMaterial = new THREE.MeshLambertMaterial({ color: COLOR.BLUE });
    const mobGeometry = new THREE.BoxGeometry(polygonSize / 2, polygonSize / 2, polygonSize / 2);
    mobMesh = new THREE.Mesh(mobGeometry, mobMaterial);
    mobMesh.position.y = polygonSize / 2;

    // CURSOR
    const cursorMaterial = new THREE.MeshLambertMaterial({ transparent: true, opacity: 0, color: COLOR.GREEN });
    const cursorGeometry = new THREE.BoxGeometry(polygonSize, polygonSize / 10, polygonSize);
    cursor = new THREE.Mesh(cursorGeometry, cursorMaterial);
    scene.add(cursor);

    // ---------------- EVENTS ----------------
    document.addEventListener('pointerdown', onMouseDown, false);
    document.addEventListener('pointerup', onMouseUp, false);
    document.addEventListener('pointermove', onMouseMove, false);
    window.addEventListener('resize', onResize);

    // ---------------- Maze Generator ------------
    mazeGenerator();

    // ---------------- Mobs Manager --------------
    mobsManager = new MobsManager();
    setInterval(() => mobsManager.createMob(mobMesh, scene), 3000);

    // ---------------- STARTING THE RENDER LOOP ----------------
    render();
}

function render() {
    requestAnimationFrame(render); // we are calling render() again,  to loop

    var delta = clock.getDelta();
    var elapsed = clock.elapsedTime;

    directionalLight1.position.x = -((Math.cos(elapsed / 3) * (gridSize * objectsMargin)) / 3);
    directionalLight1.position.z = (Math.sin(elapsed / 3) * (gridSize * objectsMargin)) / 3;

    directionalLight2.position.x = (Math.cos(elapsed / 3) * (gridSize * objectsMargin)) / 3;
    directionalLight2.position.z = -(Math.sin(elapsed / 3) * (gridSize * objectsMargin)) / 3;

    mobsManager.updateMobsPosition(delta, scene);

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

const onMouseUp = (event) => {
    cursor.material.emissive.g = 0;
    cursor.material.color = THREE_COLOR.GREEN;
};

const onMouseDown = (event) => {
    event.preventDefault();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    var intersects = raycaster.intersectObjects(clickableObjs);

    if (intersects.length > 0) {
        cursor.material.color = THREE_COLOR.RED;
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
            /*selectedBloc.position.y +*/ selectedBloc.geometry.parameters.height +
                cursor.geometry.parameters.height / 2,
            selectedBloc.position.z
        );
        cursor.material.opacity = 0.5;
    } else {
        cursor.material.opacity = 0;
    }
};

init();
