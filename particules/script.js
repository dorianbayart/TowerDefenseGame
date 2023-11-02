'use strict';

// Basic Threejs variables
var scene;
var clock;
var camera;
var renderer;
var scenePixi;
var rendererPixi;
var delta;
var elapsed;

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
var shadowMapSize = 512;

// Maze
var mazeSize = {
    width: 14,
    height: 14,
};
var maze;
var mazePaths;
var entrance;
var exit;

// Managers
var gameManager;
var missilesManager;
var mobsManager;
var particulesManager;
var towerManager;

// Gameplay
var gameInfosToDisplay;
var hpToDisplay;

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
var groundMesh;
var mobMesh;
var wallMesh;

// Ammo.js
var physicsUniverse, tmpTransformation;
var rigidBodyList = new Array();
var boxShape, quaternion, vector, transform;

var threeQuaternion = new THREE.Quaternion();

let cameraDistance = 12;
const CAMERA_LOOKAT_VECTOR = new THREE.Vector3(0, -4 * polygonSize, 0);

function init() {
    scene = new THREE.Scene();
    clock = new THREE.Clock();

    let canvas = document.createElement('canvas');
    document.body.appendChild(canvas);

    // ---------------- RENDERER ----------------
    renderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvas});
    renderer.setPixelRatio(window.devicePixelRatio * quality);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap

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
    statsToDisplay.position.set(5, window.innerHeight - statsToDisplay.style.fontSize - 5);
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
    camera.lookAt(CAMERA_LOOKAT_VECTOR);
    scene.add(camera);

    // ---------------- LIGHTS ----------------

    var ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    directionalLight1 = new THREE.PointLight(0xffffff, 10 * gridSize);
    directionalLight1.position.y = 5 * polygonSize;
    directionalLight1.castShadow = true;
    directionalLight1.shadow.mapSize.width = shadowMapSize;
    directionalLight1.shadow.mapSize.height = shadowMapSize;
    directionalLight1.shadow.camera.near = 0.5;
    directionalLight1.shadow.camera.far = 100;
    directionalLight1.shadow.normalBias = 0.01;
    scene.add(directionalLight1);
    directionalLight2 = new THREE.PointLight(0xffffff, 10 * gridSize);
    directionalLight2.position.y = 5 * polygonSize;
    directionalLight2.castShadow = true;
    directionalLight2.shadow.mapSize.width = shadowMapSize;
    directionalLight2.shadow.mapSize.height = shadowMapSize;
    directionalLight2.shadow.camera.near = 0.5;
    directionalLight2.shadow.camera.far = 100;
    directionalLight2.shadow.normalBias = 0.01;
    scene.add(directionalLight2);
    // scene.add(new THREE.DirectionalLight(0xffffff, 2.5));

    // GROUND MESH
    const groundGeometry = new THREE.BoxGeometry(polygonSize*mazeSize.width, 0.05, polygonSize*mazeSize.height);
    const groundMaterial = new THREE.MeshLambertMaterial( {color: COLOR.BLACK, reflectivity: 1} );
    groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
    groundMesh.position.y = -groundMesh.geometry.parameters.height / 2
    groundMesh.rotation.x = Math.PI / 2;
    groundMesh.receiveShadow = true;
    linkPhysicsObject(groundMesh);
    scene.add(groundMesh);

    // MAZE MESH
    const mazeMaterial = new THREE.MeshLambertMaterial({
        color: COLOR.GRAY,
        reflectivity: 1,
        shininess: 150
    });
    const mazeGeometry = new THREE.BoxGeometry(polygonSize, polygonSize*.4, polygonSize);
    wallMesh = new THREE.Mesh(mazeGeometry, mazeMaterial);
    wallMesh.castShadow = true;
    wallMesh.receiveShadow = true;

    // MOB MESH
    const mobMaterial = new THREE.MeshLambertMaterial({ color: COLOR.BLUE });
    const mobGeometry = new THREE.BoxGeometry(polygonSize / 2, polygonSize / 2, polygonSize / 2);
    mobMesh = new THREE.Mesh(mobGeometry, mobMaterial);
    mobMesh.castShadow = true;
    mobMesh.receiveShadow = true;
    mobMesh.position.y = polygonSize / 2;

    // MISSILE MESH
    const missileMaterial = new THREE.MeshLambertMaterial({ color: COLOR.INDIGO });
    const missileGeometry_normal = new THREE.SphereGeometry(.12, 8, 8);
    const missileGeometry_rocket = new THREE.CylinderGeometry(.1, .12, .25, 8, 1);
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
    const towerGeometry_normal = new THREE.BoxGeometry(.5, polygonSize * .75, .5);
    const towerGeometry_rocket = new THREE.CylinderGeometry(.2, .3, polygonSize * .75, 10, 1);
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
    const cursorMaterial = new THREE.MeshLambertMaterial({ transparent: true, opacity: 0, color: COLOR.GREEN });
    const cursorGeometry = new THREE.BoxGeometry(polygonSize, polygonSize / 10, polygonSize);
    cursor = new THREE.Mesh(cursorGeometry, cursorMaterial);
    // cursor.castShadow = true;
    cursor.receiveShadow = true;
    scene.add(cursor);

    // ---------------- EVENTS ----------------
    renderer.domElement.addEventListener('pointerdown', onMouseDown, false);
    renderer.domElement.addEventListener('pointerup', onMouseUp, false);
    document.addEventListener('pointermove', onMouseMove, false);
    window.addEventListener('resize', onResize);
    document.getElementById('buttonyes').addEventListener('click', function (e) {
        e.stopPropagation();
        towerManager.addTower()

        var tmpRangeTower = towerManager.rangeTowerToDisplay;
        scene.remove(tmpRangeTower);
        towerManager.rangeTowerToDisplay = undefined;
        createTowerGui_close();
    });
    document.getElementById('buttonno').addEventListener('click', function (e) {
        e.stopPropagation();
        towerManager.newTowerToCreate = undefined;
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
    missilesManager = new MissilesManager();
    mobsManager = new MobsManager();
    particulesManager = new ParticulesManager();
    towerManager = new TowerManager();

    // ---------------- STARTING THE RENDER LOOP ----------------
    render();

    initialRigidBodyNumber = rigidBodyList.length;
}

const ammoStart = () => {
  tmpTransformation = new Ammo.btTransform();

  initPhysicsUniverse();

  // Init
  init();
}

const initPhysicsUniverse = () => {
    quaternion = new Ammo.btQuaternion();
    vector = new Ammo.btVector3();
    transform = new Ammo.btTransform();
    transform.setIdentity();
    boxShape = new Ammo.btBoxShape( vector );

    var collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
    var dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
    var overlappingPairCache  = new Ammo.btDbvtBroadphase();
    var solver = new Ammo.btSequentialImpulseConstraintSolver();
    physicsUniverse = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
    physicsUniverse.setGravity(btVector(0, -3, 0));
}

const linkPhysicsObject = (mesh, mass = 0, tmpQuaternion = {x: 0, y: 0, z: 0, w: 1}, inertia = {x: 0, y: 0, z: 0}) => {
  const t = new Ammo.btTransform();
  t.setIdentity();
  t.setOrigin(btVector(mesh.position.x, mesh.position.y, mesh.position.z));
  t.setRotation(btQuaternion(tmpQuaternion.x, tmpQuaternion.y, tmpQuaternion.z, tmpQuaternion.w));
  const defaultMotionState = new Ammo.btDefaultMotionState( t );

  const structColShape = new Ammo.btBoxShape( btVector(mesh.geometry.parameters.width*0.5, mesh.geometry.parameters.height, mesh.geometry.parameters.depth*0.5) );
  const localInertia = btVector( inertia.x, inertia.y, inertia.z );
  structColShape.setMargin( 0.001 );
  structColShape.calculateLocalInertia( mass, localInertia );

  let RBody_Info = new Ammo.btRigidBodyConstructionInfo( mass, defaultMotionState, structColShape, localInertia );
  let RBody = new Ammo.btRigidBody( RBody_Info );

  let velocity = btVector( inertia.x, inertia.y, inertia.z );
  RBody.setLinearVelocity( velocity );
  physicsUniverse.addRigidBody( RBody );

  mesh.userData.physicsBody = RBody;
  rigidBodyList.push(mesh);
}

const linkPhysicsParticule = (mesh, mass, tmpQuaternion, inertia) => {
  tmpQuaternion = tmpQuaternion ?? {x: 0, y: 0, z: 0, w: 1};
  inertia = inertia ?? {x: 0, y: 0, z: 0};

  btTransform(btVector(mesh.position.x, mesh.position.y, mesh.position.z), btQuaternion(tmpQuaternion.x, tmpQuaternion.y, tmpQuaternion.z, tmpQuaternion.w));
  const defaultMotionState = new Ammo.btDefaultMotionState( transform );

  const structColShape = btBoxShape( mesh.geometry.parameters.width*0.5, mesh.geometry.parameters.height*0.5, mesh.geometry.parameters.depth*0.5 );
  const localInertia = btVector( inertia.x, inertia.y, inertia.z );
  structColShape.setMargin( 0.001 );
  structColShape.calculateLocalInertia( mass, localInertia );

  let RBody_Info = new Ammo.btRigidBodyConstructionInfo( mass, defaultMotionState, structColShape, localInertia );
  let RBody = new Ammo.btRigidBody( RBody_Info );

  let velocity = btVector( inertia.x, inertia.y, inertia.z );
  RBody.setLinearVelocity( velocity );
  physicsUniverse.addRigidBody( RBody );

  mesh.userData.physicsBody = RBody;
  rigidBodyList.push(mesh);
}

const deleteFromUniverse = (mesh) => {
  // delete from Scene
  scene.remove(mesh);

  // delete from Physics Universe
  const index = rigidBodyList.indexOf(mesh);
  if(index > -1) {
    rigidBodyList.splice(index, 1);
    physicsUniverse.removeRigidBody(mesh.userData.physicsBody);
    if(mesh.userData.physicsBody.getMotionState()) {
      mesh.userData.physicsBody.getMotionState().__destroy__();
    }
    if(mesh.userData.physicsBody.getCollisionShape()) {
      //mesh.userData.physicsBody.getCollisionShape().__destroy__();
    }
    mesh.userData.physicsBody.__destroy__();
    mesh.userData = null;
    mesh = null;
  }
}

const updatePhysicsUniverse = (deltaTime) => {
    physicsUniverse.stepSimulation( deltaTime, 10 );
    let Graphics_Obj, Physics_Obj, motionState, new_pos, new_qua;

    for ( let i = 0; i < rigidBodyList.length; i++ ) {
      Graphics_Obj = rigidBodyList[ i ];
      Physics_Obj = Graphics_Obj.userData.physicsBody;

      motionState = Physics_Obj.getMotionState();
      if ( motionState ) {
          motionState.getWorldTransform( tmpTransformation );
          new_pos = tmpTransformation.getOrigin();
          new_qua = tmpTransformation.getRotation();
          Graphics_Obj.position.set( new_pos.x(), new_pos.y(), new_pos.z() );
          Graphics_Obj.quaternion.set( new_qua.x(), new_qua.y(), new_qua.z(), new_qua.w() );
      }
    }
}

const render = async () => {
    requestAnimationFrame(render); // we are calling render() again,  to loop

    delta = clock.getDelta();
    elapsed = clock.elapsedTime;

    camera.position.x = cameraDistance * Math.sin(elapsed/25);
    camera.position.z = cameraDistance * Math.cos(elapsed/25);
    camera.lookAt(CAMERA_LOOKAT_VECTOR);

    directionalLight1.position.x = -((Math.cos(elapsed / 3) * (gridSize * objectsMargin)) / 3);
    directionalLight1.position.z = (Math.sin(elapsed / 3) * (gridSize * objectsMargin)) / 3;

    directionalLight2.position.x = (Math.cos(elapsed / 3) * (gridSize * objectsMargin)) / 3;
    directionalLight2.position.z = -(Math.sin(elapsed / 3) * (gridSize * objectsMargin)) / 3;

    gameManager.updateGameInfos();
    missilesManager.updateMissilesPosition(delta, scene);
    particulesManager.updateParticules(delta, scene);
    mobsManager.updateMobsPosition(delta, scene);
    towerManager.updateTowers(delta, scene);

    updatePhysicsUniverse(delta);

    renderer.resetState();
    renderer.render(scene, camera); // We are rendering the 3D world

    rendererPixi.reset();
    rendererPixi.render(scenePixi, {clear: false}); // Rendering the 2D scene without erasing the 3D world

    if (displayStats) {
        deltas.push(delta);
        deltas = deltas.slice(-deltaSize);
        fps = Math.round(10 * deltas.length / deltas.reduce((a, b) => a + b)) / 10;

        latest += delta;

        if(mobsManager.mobArray.length) {
          hpToDisplay = mobsManager.mobArray[mobsManager.mobArray.length-1]?.initialHp;
        }

        if (latest > statsDelay) {
            latest -= statsDelay;
            particulesNumber = rigidBodyList.length - initialRigidBodyNumber
            statsToDisplay.text = `${Math.floor(elapsed)}s | ${renderer.info.render.triangles}tri | Particules:${particulesNumber}`+/*(${physicsUniverse.getPairCache().getNumOverlappingPairs()}:${Object.keys(boxShape.lB?.mB).length })*/` | ${fps}FPS | PixelRatio:${Math.round(window.devicePixelRatio*100)/100} | HP:${hpToDisplay}`;
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

// ------ Ammo.js Init ------
Ammo().then( ammoStart );
