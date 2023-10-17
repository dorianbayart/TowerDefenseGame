'use strict';

// Basic Threejs variables
var scene;
var clock;
var camera;
var renderer;
var scenePixi;
var rendererPixi;

// Benchmarking
var displayStats = true;
var statsToDisplay;
var statsDelay = .25; // in seconds
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
var maze;
var mazePaths;
var entrance;
var exit;

// Managers
var gameManager;
var mobsManager;
var towerManager;

// Gameplay
var gameInfosToDisplay;

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
var cursorValid = false;

// Game objs
var cursor;
var mobMesh;
var rangeMesh;
var towerMesh;
var wallMesh;

async function init() {
    scene = new THREE.Scene();
    clock = new THREE.Clock();

    let canvas = document.createElement('canvas');
    document.body.appendChild(canvas);

    // ---------------- RENDERER ----------------
    renderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvas});
    renderer.setPixelRatio(window.devicePixelRatio * quality);
    renderer.setSize(window.innerWidth, window.innerHeight);

    scenePixi = new PIXI.Container();
    rendererPixi = new PIXI.Renderer({
    	width: window.innerWidth,
    	height: window.innerHeight,
    	view: canvas,
      context: renderer.context,
    	transparent: true,
    	autoDensity : true,
    	antialias : true,
    	autoResize : true,
    	resolution: window.devicePixelRatio * quality,
    });

    // ---------------- 2D -----------------
    statsToDisplay = new PIXI.Text('', { fontFamily: 'monospace', fontSize: 12, fill: 'lightgreen', align: 'left' });
    statsToDisplay.position.set(5, window.innerHeight - statsToDisplay.style.fontSize);
    scenePixi.addChild(statsToDisplay);

    gameInfosToDisplay = new PIXI.Text('', { fontFamily: 'monospace', fontSize: 12, fill: 'lightgreen', align: 'left' });
    gameInfosToDisplay.position.set(5, 2);
    scenePixi.addChild(gameInfosToDisplay);


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
    const mazeMaterial = new THREE.MeshPhongMaterial({
        color: COLOR.GRAY,
        shininess: 150,
    });
    const geometry = new THREE.BoxGeometry(polygonSize, polygonSize, polygonSize);
    wallMesh = new THREE.Mesh(geometry, mazeMaterial);

    // MOB MESH
    const mobMaterial = new THREE.MeshLambertMaterial({ color: COLOR.BLUE });
    const mobGeometry = new THREE.BoxGeometry(polygonSize / 2, polygonSize / 2, polygonSize / 2);
    mobMesh = new THREE.Mesh(mobGeometry, mobMaterial);
    mobMesh.position.y = polygonSize / 2;

    // TOWER MESH
    const towerMaterial = new THREE.MeshLambertMaterial({ color: COLOR.BROWN });
    const towerGeometry = new THREE.BoxGeometry(0.5, polygonSize * 3 / 2, 0.5);
    towerMesh = new THREE.Mesh(towerGeometry, towerMaterial);

    // RANGE TOWER MESH
    const rangeMaterial = new THREE.MeshLambertMaterial({ transparent: true, opacity: 0.5, color: COLOR.BROWN });
    const rangeGeometry = new THREE.CylinderGeometry( 2.5, 2.5, 0.25, 24, 1 );
    rangeMesh = new THREE.Mesh(rangeGeometry, rangeMaterial);

    // CURSOR
    const cursorMaterial = new THREE.MeshLambertMaterial({ transparent: true, opacity: 0, color: COLOR.GREEN });
    const cursorGeometry = new THREE.BoxGeometry(polygonSize, polygonSize / 10, polygonSize);
    cursor = new THREE.Mesh(cursorGeometry, cursorMaterial);
    scene.add(cursor);

    // ---------------- EVENTS ----------------
    renderer.domElement.addEventListener('pointerdown', onMouseDown, false);
    renderer.domElement.addEventListener('pointerup', onMouseUp, false);
    document.addEventListener('pointermove', onMouseMove, false);
    window.addEventListener('resize', onResize);
    document.getElementById('buttonyes').addEventListener('click', function (e) {
        e.stopPropagation();
        var tmpTower = towerManager.newTowerMeshToCreate;
        scene.add(tmpTower);
        const cost = towerManager.addTower(tmpTower);
        towerManager.newTowerMeshToCreate = undefined;
        var tmpRangeTower = towerManager.rangeTowerToDisplay;
        scene.remove(tmpRangeTower);
        towerManager.rangeTowerToDisplay = undefined;
        createTowerGui_close();
        gameManager.game.updateMoney(cost);
    });
    document.getElementById('buttonno').addEventListener('click', function (e) {
        e.stopPropagation();
        towerManager.newTowerMeshToCreate = undefined;
        var tmpRangeTower = towerManager.rangeTowerToDisplay;
        scene.remove(tmpRangeTower);
        towerManager.rangeTowerToDisplay = undefined;
        createTowerGui_close();
    });
    document.getElementById('buttondelete').addEventListener('click', function (e) {
        e.stopPropagation();
        towerManager.deleteTower(towerManager.selectedTower);
        scene.remove(towerManager.selectedTower.mesh);
        infoTowerGui_close();
        towerManager.selectedTower = undefined;
        var tmpRangeTower = towerManager.rangeTowerToDisplay;
        scene.remove(tmpRangeTower);
        towerManager.rangeTowerToDisplay = undefined;
    });
    document.getElementById('buttonclose').addEventListener('click', function (e) {
        e.stopPropagation();
        infoTowerGui_close();
        towerManager.selectedTower = undefined;
        var tmpRangeTower = towerManager.rangeTowerToDisplay;
        scene.remove(tmpRangeTower);
        towerManager.rangeTowerToDisplay = undefined;
    });

    // ---------------- Maze Generator ------------
    mazeGenerator();

    // ---------------- Managers --------------
    gameManager = new GameManager();
    mobsManager = new MobsManager();
    towerManager = new TowerManager();

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

    gameManager.updateGameInfos();
    mobsManager.updateMobsPosition(delta, scene);
    towerManager.updateTowers(delta, scene);

    renderer.resetState();
    renderer.render(scene, camera); // We are rendering the 3D world

    rendererPixi.reset();
    rendererPixi.render(scenePixi, {clear: false}); // Rendering the 2D scene without erasing the 3D world

    if (displayStats) {
        deltas.push(delta);
        deltas = deltas.slice(-deltaSize);
        fps = Math.round(10 * deltas.length / deltas.reduce((a, b) => a + b)) / 10;

        latest += delta;

        if (latest > statsDelay) {
            latest -= statsDelay;
            statsToDisplay.text = `${Math.floor(elapsed)}s | ${renderer.info.render.triangles}tri | ${fps}FPS | PixelRatio:${Math.round(window.devicePixelRatio*100)/100} | HP:${Math.ceil(elapsed/10)}`;
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

init();
