import * as THREE from 'three';
import { OrbitControls } from 'orbit-controls';

import { objectsMargin, mazeSize, COLOR, THREE_COLOR } from './constants.js';
import { MISSILE_TYPES, PARTICULE_TYPES, TOWER_TYPES } from './types.js';
import { btBoxShape, btVector, btQuaternion, btTransform, toDegrees, toRadians } from './helpers.js';
import { Game, GameManager } from './gamemanager.js';
import { Missile, MissilesManager } from './missilesmanager.js';
import { Particule, ParticulesManager } from './particlesmanager.js';
import { Mob, MobsManager } from './mobsmanager.js';
import { Tower, TowerManager } from './towermanager.js';
import { Cell, Maze, MazeManager } from './mazemanager.js';
import { UniverseManager } from './universemanager.js';
import { Gui } from './gui.js';

import g from './global.js';


// Basic Threejs variables
var renderer;
var scenePixi;
var rendererPixi;
var delta;
var elapsed;
var controls;

// Benchmarking
var displayStats = true;
var statsToDisplay;
var statsDelay = .5; // in seconds
var particulesNumber = 0;
var initialRigidBodyNumber = 0;
var fps;
var deltas = [];
var deltaSize = 200;
var quality = 1;
var latest = 0;
var shadowMapSize = 768;


// Gameplay
var hpToDisplay;

// Lights
var directionalLight1;
var directionalLight2;

let cameraDistance = 12;
const CAMERA_LOOKAT_VECTOR = new THREE.Vector3(0, 0, 0);

function init() {
    g.scene = new THREE.Scene();
    g.gui = new Gui();

    let canvas = document.createElement('canvas');
    document.body.appendChild(canvas);

    // ---------------- RENDERER ----------------
    renderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvas});
    renderer.setPixelRatio(window.devicePixelRatio * quality);
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap

    scenePixi = new PIXI.Container();
    rendererPixi = new PIXI.Renderer({
    	width: window.innerWidth,
    	height: window.innerHeight,
    	view: canvas,
      context: renderer.context,
    	transparent: true,
    	autoDensity: true,
    	antialias: true,
    	autoResize: true,
    	resolution: window.devicePixelRatio * quality,
    });


    // ---------------- 2D -----------------
    statsToDisplay = new PIXI.Text('', { fontFamily: 'monospace', fontSize: 12, fill: 'lightgreen', align: 'left' });
    statsToDisplay.position.set(5, window.innerHeight - 2*statsToDisplay.style.fontSize - 5);
    scenePixi.addChild(statsToDisplay);

    g.gui.gameInfosToDisplay = new PIXI.Text('', { fontFamily: 'monospace', fontSize: 12, fill: 'lightgreen', align: 'left' });
    g.gui.gameInfosToDisplay.position.set(5, 2);
    scenePixi.addChild(g.gui.gameInfosToDisplay);


    // ---------------- CAMERA ----------------

    if (window.innerWidth > window.innerHeight) {
        g.camera = new THREE.PerspectiveCamera(
            getFov(),
            window.innerWidth / window.innerHeight,
            1,
            mazeSize * getFov()
        );
    } else {
        g.camera = new THREE.PerspectiveCamera(
            getFov(),
            window.innerWidth / window.innerHeight,
            1,
            mazeSize * getFov()
        );
    }
    g.camera.position.set(-(mazeSize * 1.5 * objectsMargin) / 2, mazeSize * objectsMargin, 0);
    g.camera.lookAt(CAMERA_LOOKAT_VECTOR);
    g.scene.add(g.camera);

    controls = new OrbitControls( g.camera, renderer.domElement );
    controls.target.set( 0, 0, 0 );
    //controls.autoRotate = true;
    controls.autoRotateSpeed = .75;

    // ---------------- LIGHTS ----------------

    var ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    g.scene.add(ambientLight);

    directionalLight1 = new THREE.PointLight(0xffffff, 10 * mazeSize);
    directionalLight1.position.y = 5;
    directionalLight1.castShadow = true;
    directionalLight1.shadow.mapSize.width = shadowMapSize;
    directionalLight1.shadow.mapSize.height = shadowMapSize;
    directionalLight1.shadow.camera.near = 0.5;
    directionalLight1.shadow.camera.far = 100;
    directionalLight1.shadow.normalBias = 0.01;
    g.scene.add(directionalLight1);
    directionalLight2 = new THREE.PointLight(0xffffff, 10 * mazeSize);
    directionalLight2.position.y = 5;
    directionalLight2.castShadow = true;
    directionalLight2.shadow.mapSize.width = shadowMapSize;
    directionalLight2.shadow.mapSize.height = shadowMapSize;
    directionalLight2.shadow.camera.near = 0.5;
    directionalLight2.shadow.camera.far = 100;
    directionalLight2.shadow.normalBias = 0.01;
    g.scene.add(directionalLight2);
    // g.scene.add(new THREE.DirectionalLight(0xffffff, 2.5));

    // GROUND MESH
    const groundGeometry = new THREE.BoxGeometry(mazeSize, 0.075, mazeSize);
    const groundMaterial = new THREE.MeshLambertMaterial( {color: COLOR.BLACK, reflectivity: 1} );
    g.meshes.groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
    g.meshes.groundMesh.position.y = -g.meshes.groundMesh.geometry.parameters.height / 2
    g.meshes.groundMesh.rotation.x = Math.PI / 2;
    g.meshes.groundMesh.receiveShadow = true;
    g.universeManager.linkPhysicsObject(g.meshes.groundMesh);
    g.scene.add(g.meshes.groundMesh);

    // MAZE MESH
    const mazeMaterial = new THREE.MeshLambertMaterial({
        color: COLOR.GRAY,
        reflectivity: 1,
        // shininess: 150
    });
    const mazeGeometry = new THREE.BoxGeometry(1, .5, 1);
    g.meshes.wallMesh = new THREE.Mesh(mazeGeometry, mazeMaterial);
    g.meshes.wallMesh.castShadow = true;
    g.meshes.wallMesh.receiveShadow = true;

    // MOB MESH
    const mobMaterial = new THREE.MeshLambertMaterial({ color: COLOR.BLUE });
    const mobGeometry = new THREE.BoxGeometry(1 / 2, 1 / 2, 1 / 2);
    g.meshes.mobMesh = new THREE.Mesh(mobGeometry, mobMaterial);
    g.meshes.mobMesh.castShadow = true;
    g.meshes.mobMesh.receiveShadow = true;
    g.meshes.mobMesh.position.y = g.meshes.mobMesh.geometry.parameters.height / 2;

    // MISSILE MESH
    const missileMaterial = new THREE.MeshLambertMaterial({ color: COLOR.INDIGO });
    const missileGeometry_normal = new THREE.SphereGeometry(.12, 6, 6);
    const missileGeometry_rocket = new THREE.CylinderGeometry(.1, .12, .25, 6, 1);
    MISSILE_TYPES.NORMAL.mesh = new THREE.Mesh(missileGeometry_normal, missileMaterial);
    MISSILE_TYPES.NORMAL.mesh.castShadow = true;
    // MISSILE_TYPES.NORMAL.mesh.receiveShadow = true;
    MISSILE_TYPES.ROCKET.mesh = new THREE.Mesh(missileGeometry_rocket, missileMaterial);
    MISSILE_TYPES.ROCKET.mesh.castShadow = true;
    // MISSILE_TYPES.ROCKET.mesh.receiveShadow = true;


    const particuleMaterial = new THREE.MeshLambertMaterial({ color: COLOR.INDIGO });
    const particuleGeometry_normal = new THREE.BoxGeometry(PARTICULE_TYPES.NORMAL.size, PARTICULE_TYPES.NORMAL.size, PARTICULE_TYPES.NORMAL.size);
    const particuleGeometry_rocket = new THREE.BoxGeometry(PARTICULE_TYPES.ROCKET.size, PARTICULE_TYPES.ROCKET.size, PARTICULE_TYPES.ROCKET.size);
    PARTICULE_TYPES.NORMAL.mesh = new THREE.Mesh(particuleGeometry_normal, particuleMaterial);
    PARTICULE_TYPES.NORMAL.mesh.castShadow = true;
    // PARTICULE_TYPES.NORMAL.mesh.receiveShadow = true;
    PARTICULE_TYPES.ROCKET.mesh = new THREE.Mesh(particuleGeometry_rocket, particuleMaterial);
    PARTICULE_TYPES.ROCKET.mesh.castShadow = true;
    // PARTICULE_TYPES.ROCKET.mesh.receiveShadow = true;

    // TOWER MESH
    const towerMaterial = new THREE.MeshLambertMaterial({ color: COLOR.BROWN });
    const towerGeometry_normal = new THREE.BoxGeometry(.5, .75, .5);
    const towerGeometry_rocket = new THREE.CylinderGeometry(.2, .3, .75, 12, 1);
    TOWER_TYPES.NORMAL.mesh = new THREE.Mesh(towerGeometry_normal, towerMaterial);
    TOWER_TYPES.NORMAL.mesh.castShadow = true;
    TOWER_TYPES.NORMAL.mesh.receiveShadow = true;
    TOWER_TYPES.ROCKET.mesh = new THREE.Mesh(towerGeometry_rocket, towerMaterial);
    TOWER_TYPES.ROCKET.mesh.castShadow = true;
    TOWER_TYPES.ROCKET.mesh.receiveShadow = true;

    // RANGE TOWER MESH
    const rangeMaterial = new THREE.MeshLambertMaterial({ transparent: true, opacity: 0.5, color: COLOR.BROWN });
    const rangeGeometry_normal = new THREE.CylinderGeometry( TOWER_TYPES.NORMAL.range, TOWER_TYPES.NORMAL.range, 0.05, 24, 1 );
    const rangeGeometry_rocket = new THREE.CylinderGeometry( TOWER_TYPES.ROCKET.range, TOWER_TYPES.ROCKET.range, 0.05, 24, 1 );
    TOWER_TYPES.NORMAL.rangeMesh = new THREE.Mesh(rangeGeometry_normal, rangeMaterial);
    // TOWER_TYPES.NORMAL.rangeMesh.castShadow = true;
    TOWER_TYPES.NORMAL.rangeMesh.receiveShadow = true;
    TOWER_TYPES.ROCKET.rangeMesh = new THREE.Mesh(rangeGeometry_rocket, rangeMaterial);
    // TOWER_TYPES.ROCKET.rangeMesh.castShadow = true;
    TOWER_TYPES.ROCKET.rangeMesh.receiveShadow = true;

    // CURSOR



    // ---------------- EVENTS ----------------
    renderer.domElement.addEventListener('pointerdown', g.gui.onMouseDown, false);
    renderer.domElement.addEventListener('pointerup', g.gui.onMouseUp, false);
    document.addEventListener('pointermove', g.gui.onMouseMove, false);
    window.addEventListener('resize', onResize);
    document.getElementById('buttonyes').addEventListener('click', function (e) {
        e.stopPropagation();
        g.towerManager.addTower()

        var tmpRangeTower = g.towerManager.rangeTowerToDisplay;
        g.scene.remove(tmpRangeTower);
        g.towerManager.rangeTowerToDisplay = undefined;
        g.gui.createTowerGui_close();
    });
    document.getElementById('buttonno').addEventListener('click', function (e) {
        e.stopPropagation();
        g.towerManager.newTowerToCreate = undefined;
        var tmpRangeTower = g.towerManager.rangeTowerToDisplay;
        g.scene.remove(tmpRangeTower);
        g.towerManager.rangeTowerToDisplay = undefined;
        g.gui.createTowerGui_close();
    });
    document.getElementById('buttondelete').addEventListener('click', function (e) {
        e.stopPropagation();
        g.towerManager.deleteTower(g.towerManager.selectedTower);
        g.scene.remove(g.towerManager.selectedTower.mesh);
        g.gui.infoTowerGui_close();
        g.towerManager.selectedTower = undefined;
        var tmpRangeTower = g.towerManager.rangeTowerToDisplay;
        g.scene.remove(tmpRangeTower);
        g.towerManager.rangeTowerToDisplay = undefined;
    });
    document.getElementById('buttonclose').addEventListener('click', function (e) {
        e.stopPropagation();
        g.gui.infoTowerGui_close();
        g.towerManager.selectedTower = undefined;
        var tmpRangeTower = g.towerManager.rangeTowerToDisplay;
        g.scene.remove(tmpRangeTower);
        g.towerManager.rangeTowerToDisplay = undefined;
    });



    // ---------------- Maze Manager ------------
    g.mazeManager = new MazeManager(g.scene);
    g.mazeManager.maze.generate(mazeSize, mazeSize);

    // ---------------- Managers --------------
    g.gameManager = new GameManager();
    g.missilesManager = new MissilesManager();
    g.mobsManager = new MobsManager();
    g.particulesManager = new ParticulesManager();
    g.towerManager = new TowerManager();

    // ---------------- STARTING THE RENDER LOOP ----------------
    render();

    initialRigidBodyNumber = g.universeManager.rigidBodyList.length;
}

const ammoStart = () => {
  // Init Universe
  g.universeManager = new UniverseManager();

  // Init
  init();
}

const render = async () => {
    requestAnimationFrame(render); // we are calling render() again,  to loop

    delta = g.gameManager.clock.getDelta();
    elapsed = g.gameManager.clock.elapsedTime;

    // g.camera.position.x = cameraDistance * Math.sin(elapsed/25);
    // g.camera.position.z = cameraDistance * Math.cos(elapsed/25);
    // g.camera.lookAt(CAMERA_LOOKAT_VECTOR);
    controls.update(delta);

    directionalLight1.position.x = -((Math.cos(elapsed / 3) * (mazeSize * objectsMargin)) / 3);
    directionalLight1.position.z = (Math.sin(elapsed / 3) * (mazeSize * objectsMargin)) / 3;

    directionalLight2.position.x = (Math.cos(elapsed / 3) * (mazeSize * objectsMargin)) / 3;
    directionalLight2.position.z = -(Math.sin(elapsed / 3) * (mazeSize * objectsMargin)) / 3;

    g.gameManager.updateGameInfos();
    g.missilesManager.updateMissilesPosition(delta, g.scene);
    g.particulesManager.updateParticules(delta, g.scene);
    g.mobsManager.updateMobsPosition(delta, g.scene);
    g.towerManager.updateTowers(delta, g.scene);

    g.universeManager.updatePhysicsUniverse(delta);

    renderer.resetState();
    renderer.render(g.scene, g.camera); // We are rendering the 3D world

    rendererPixi.reset();
    rendererPixi.render(scenePixi, {clear: false}); // Rendering the 2D g.scene without erasing the 3D world

    if (displayStats) {
        deltas.push(delta);
        deltas = deltas.slice(-deltaSize);
        fps = Math.round(10 * deltas.length / deltas.reduce((a, b) => a + b)) / 10;

        latest += delta;

        if(g.mobsManager.mobArray.length) {
          hpToDisplay = g.mobsManager.mobArray[g.mobsManager.mobArray.length-1]?.initialHp;
        }

        if (latest > statsDelay) {
            latest -= statsDelay;
            particulesNumber = g.universeManager.rigidBodyList.length - initialRigidBodyNumber
            statsToDisplay.text = `${Math.floor(elapsed)}s | HP:${hpToDisplay} | ${renderer.info.render.triangles}tri | Particules:${particulesNumber}\n${fps}FPS | ${Math.round(window.innerWidth*window.devicePixelRatio*quality*100)/100}x${Math.round(window.innerHeight*window.devicePixelRatio*quality*100)/100} | PixelRatio:${Math.round(window.devicePixelRatio*100)/100}`;
        }
    }
}

const onResize = () => {
    renderer.setPixelRatio(window.devicePixelRatio * quality);
    renderer.setSize(window.innerWidth, window.innerHeight);
    g.camera.fov = getFov();
    g.camera.aspect = window.innerWidth / window.innerHeight;
    g.camera.updateProjectionMatrix();

    statsToDisplay.position.set(5, window.innerHeight - 2*statsToDisplay.style.fontSize - 5);
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

// ------ Ammo.js Init ------
Ammo().then( ammoStart );
