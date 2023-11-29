import * as THREE from 'three';
import { MapControls } from 'map-controls';

import { objectsMargin, mazeSize, COLOR, THREE_COLOR } from './constants.js';
import { MISSILE_TYPES, PARTICULE_TYPES, TOWER_TYPES } from './types.js';
import { btBoxShape, btVector, btQuaternion, btTransform, toDegrees, toRadians } from './helpers.js';
import { Builder, BuilderManager } from './buildermanager.js';
import { Game, GameManager } from './gamemanager.js';
import { Missile, MissilesManager } from './missilesmanager.js';
import { Particule, ParticulesManager } from './particlesmanager.js';
import { Mob, MobsManager } from './mobsmanager.js';
import { Tower, TowerManager } from './towermanager.js';
import { Cell, Maze, MazeManager } from './mazemanager.js';
import { UniverseManager } from './universemanager.js';
import { Gui, buttonyes, buttonno, buttondelete, buttonclose } from './gui.js';
import { initMainMenuEvents, initGameButtonsEvents } from './events.js';

import g from './global.js';



// Lights
var directionalLight1;
var directionalLight2;

let cameraDistance = 12;




initMainMenuEvents()

export const ammoStart = () => {
  // Init Universe
  if(!g.universeManager) g.universeManager = new UniverseManager();

  // Init
  init();
}

const init = () => {
  cameraDistance = 12;

  const canvas = document.createElement('canvas');
  canvas.id = 'canvasGame';
  document.body.appendChild(canvas);

  initGameButtonsEvents();

  // ---------------- RENDERER ----------------
  g.renderer = new THREE.WebGLRenderer({ antialias: g.parameters.antialiasing, canvas: canvas});
  g.renderer.setPixelRatio(window.devicePixelRatio);
  g.renderer.setSize(window.innerWidth, window.innerHeight, false);
  g.renderer.shadowMap.enabled = g.parameters.shadows
  g.renderer.shadowMap.type = THREE.PCFSoftShadowMap


  g.rendererPixi = new PIXI.Renderer({
    width: window.innerWidth,
    height: window.innerHeight,
    view: canvas,
    context: g.renderer.context,
    transparent: true,
    autoDensity: true,
    antialias: g.parameters.antialiasing,
    autoResize: true,
    resolution: window.devicePixelRatio,
  });


  g.scene = new THREE.Scene();
  g.scenePixi = new PIXI.Container();
  g.gui = new Gui();

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
  g.camera.lookAt(new THREE.Vector3(0, 0, 0));
  g.scene.add(g.camera);

  g.controls = new MapControls( g.camera, g.renderer.domElement );
  g.controls.target.set( 0, 0, 0 );
  g.controls.zoomSpeed = 0.25;
  g.controls.minDistance = 4;
  g.controls.maxDistance = 20;
  g.controls.enableDamping = true;
  g.controls.dampingFactor = 0.05;
  //g.controls.autoRotate = true;
  g.controls.autoRotateSpeed = .75;

  // ---------------- LIGHTS ----------------

  var ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  g.scene.add(ambientLight);

  directionalLight1 = new THREE.PointLight(0xffffff, 10 * mazeSize);
  directionalLight1.position.y = 5;
  directionalLight1.castShadow = true;
  directionalLight1.shadow.mapSize.width = g.parameters.shadowMapSize;
  directionalLight1.shadow.mapSize.height = g.parameters.shadowMapSize;
  directionalLight1.shadow.camera.near = 1;
  directionalLight1.shadow.camera.far = 40;
  directionalLight1.shadow.normalBias = 0.01;
  g.scene.add(directionalLight1);
  directionalLight2 = new THREE.PointLight(0xffffff, 10 * mazeSize);
  directionalLight2.position.y = 5;
  directionalLight2.castShadow = true;
  directionalLight2.shadow.mapSize.width = g.parameters.shadowMapSize;
  directionalLight2.shadow.mapSize.height = g.parameters.shadowMapSize;
  directionalLight2.shadow.camera.near = 1;
  directionalLight2.shadow.camera.far = 40;
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
    color: COLOR.LIGHTERGRAY,
    reflectivity: 1,
    // shininess: 150
  });
  const mazeGeometry = new THREE.BoxGeometry(1, .5, 1);
  g.meshes.wallMesh = new THREE.Mesh(mazeGeometry, mazeMaterial);
  g.meshes.wallMesh.castShadow = true;
  g.meshes.wallMesh.receiveShadow = true;

  // MOB MESH
  const mobMaterial = new THREE.MeshLambertMaterial({ color: COLOR.LIGHTERBLUE });
  const mobGeometry = new THREE.BoxGeometry(1 / 2, 1 / 2, 1 / 2);
  g.meshes.mobMesh = new THREE.Mesh(mobGeometry, mobMaterial);
  g.meshes.mobMesh.castShadow = true;
  g.meshes.mobMesh.receiveShadow = true;
  g.meshes.mobMesh.position.y = g.meshes.mobMesh.geometry.parameters.height / 2;

  // MISSILE MESH
  const missileMaterial_normal = new THREE.MeshLambertMaterial({ color: COLOR.LIGHTBROWN });
  const missileMaterial_rocket = new THREE.MeshLambertMaterial({ color: COLOR.LIGHTERINDIGO });
  const missileGeometry_normal = new THREE.SphereGeometry(.12, Math.floor(12 * g.parameters.quality), Math.floor(12 * g.parameters.quality));
  const missileGeometry_rocket = new THREE.CylinderGeometry(.1, .12, .25, Math.floor(12 * g.parameters.quality), 1);
  MISSILE_TYPES.NORMAL.mesh = new THREE.Mesh(missileGeometry_normal, missileMaterial_normal);
  MISSILE_TYPES.NORMAL.mesh.castShadow = true;
  // MISSILE_TYPES.NORMAL.mesh.receiveShadow = true;
  MISSILE_TYPES.ROCKET.mesh = new THREE.Mesh(missileGeometry_rocket, missileMaterial_rocket);
  MISSILE_TYPES.ROCKET.mesh.castShadow = true;
  // MISSILE_TYPES.ROCKET.mesh.receiveShadow = true;


  const particuleMaterial_normal = new THREE.MeshLambertMaterial({ color: COLOR.LIGHTBROWN });
  const particuleMaterial_rocket = new THREE.MeshLambertMaterial({ color: COLOR.LIGHTERINDIGO });
  const particuleGeometry_normal = new THREE.BoxGeometry(PARTICULE_TYPES.NORMAL.size, PARTICULE_TYPES.NORMAL.size, PARTICULE_TYPES.NORMAL.size);
  const particuleGeometry_rocket = new THREE.BoxGeometry(PARTICULE_TYPES.ROCKET.size, PARTICULE_TYPES.ROCKET.size, PARTICULE_TYPES.ROCKET.size);
  PARTICULE_TYPES.NORMAL.mesh = new THREE.Mesh(particuleGeometry_normal, particuleMaterial_normal);
  PARTICULE_TYPES.NORMAL.mesh.castShadow = true;
  // PARTICULE_TYPES.NORMAL.mesh.receiveShadow = true;
  PARTICULE_TYPES.ROCKET.mesh = new THREE.Mesh(particuleGeometry_rocket, particuleMaterial_rocket);
  PARTICULE_TYPES.ROCKET.mesh.castShadow = true;
  // PARTICULE_TYPES.ROCKET.mesh.receiveShadow = true;

  // TOWER MESH
  const towerMaterial_normal = new THREE.MeshLambertMaterial({ color: COLOR.LIGHTERBROWN });
  const towerMaterial_rocket = new THREE.MeshLambertMaterial({ color: COLOR.INDIGO });
  const towerGeometry_normal = new THREE.BoxGeometry(.5, .75, .5);
  const towerGeometry_rocket = new THREE.CylinderGeometry(.2, .3, .75, Math.floor(16 * g.parameters.quality), 1);
  TOWER_TYPES.NORMAL.mesh = new THREE.Mesh(towerGeometry_normal, towerMaterial_normal);
  TOWER_TYPES.NORMAL.mesh.castShadow = true;
  TOWER_TYPES.NORMAL.mesh.receiveShadow = true;
  TOWER_TYPES.ROCKET.mesh = new THREE.Mesh(towerGeometry_rocket, towerMaterial_rocket);
  TOWER_TYPES.ROCKET.mesh.castShadow = true;
  TOWER_TYPES.ROCKET.mesh.receiveShadow = true;

  // RANGE TOWER MESH
  const rangeMaterial_normal = new THREE.MeshLambertMaterial({ transparent: true, opacity: 0.5, color: COLOR.LIGHTBROWN });
  const rangeMaterial_rocket = new THREE.MeshLambertMaterial({ transparent: true, opacity: 0.5, color: COLOR.LIGHTERINDIGO });
  const rangeGeometry_normal = new THREE.CylinderGeometry( TOWER_TYPES.NORMAL.range, TOWER_TYPES.NORMAL.range, 0.05, Math.floor(24 * g.parameters.quality), 1 );
  const rangeGeometry_rocket = new THREE.CylinderGeometry( TOWER_TYPES.ROCKET.range, TOWER_TYPES.ROCKET.range, 0.05, Math.floor(24 * g.parameters.quality), 1 );
  TOWER_TYPES.NORMAL.rangeMesh = new THREE.Mesh(rangeGeometry_normal, rangeMaterial_normal);
  TOWER_TYPES.NORMAL.rangeMesh.receiveShadow = true;
  TOWER_TYPES.ROCKET.rangeMesh = new THREE.Mesh(rangeGeometry_rocket, rangeMaterial_rocket);
  TOWER_TYPES.ROCKET.rangeMesh.receiveShadow = true;


  // BUILDER MESH
  const builderMaterial = new THREE.MeshLambertMaterial({ color: COLOR.GREEN });
  const builderGeometry = new THREE.SphereGeometry(.20, Math.floor(16 * g.parameters.quality), Math.floor(16 * g.parameters.quality));
  g.meshes.builderMesh = new THREE.Mesh(builderGeometry, builderMaterial);
  g.meshes.builderMesh.castShadow = true;
  g.meshes.builderMesh.receiveShadow = true;
  g.meshes.builderMesh.position.y = g.meshes.wallMesh.geometry.parameters.height + TOWER_TYPES.NORMAL.mesh.geometry.parameters.height + 1;



  // ---------------- EVENTS ----------------
  g.renderer.domElement.addEventListener('pointerdown', g.gui.onMouseDown, false);
  g.renderer.domElement.addEventListener('pointerup', g.gui.onMouseUp, false);
  document.removeEventListener('pointermove', g.gui.onMouseMove, false);
  document.addEventListener('pointermove', g.gui.onMouseMove, false);
  window.removeEventListener('resize', onResize);
  window.addEventListener('resize', onResize);
  document.getElementById('buttonyes').removeEventListener('click', buttonyes);
  document.getElementById('buttonyes').addEventListener('click', buttonyes);
  document.getElementById('buttonno').removeEventListener('click', buttonno);
  document.getElementById('buttonno').addEventListener('click', buttonno);
  document.getElementById('buttondelete').removeEventListener('click', buttondelete);
  document.getElementById('buttondelete').addEventListener('click', buttondelete);
  document.getElementById('buttonclose').removeEventListener('click', buttonclose);
  document.getElementById('buttonclose').addEventListener('click', buttonclose);



  // ---------------- Maze Manager ------------
  g.mazeManager = new MazeManager(g.scene);
  g.mazeManager.maze.generate(mazeSize, mazeSize);

  // ---------------- Managers --------------
  g.gameManager = new GameManager();
  g.missilesManager = new MissilesManager();
  g.mobsManager = new MobsManager();
  g.particulesManager = new ParticulesManager();
  g.towerManager = new TowerManager();
  g.builderManager = new BuilderManager(g.scene);

  // ---------------- STARTING THE RENDER LOOP ----------------
  render();

  g.gui.debug.initialRigidBodyNumber = g.universeManager.rigidBodyList.length;
}



const render = async () => {
  if(!g.gameManager) return

  const delta = g.gameManager.clock.getDelta();
  const elapsed = g.gameManager.clock.elapsedTime;

  g.controls.update(delta);

  directionalLight1.position.x = -((Math.cos(elapsed / 3) * (mazeSize * objectsMargin)) / 3);
  directionalLight1.position.z = (Math.sin(elapsed / 3) * (mazeSize * objectsMargin)) / 3;

  directionalLight2.position.x = (Math.cos(elapsed / 3) * (mazeSize * objectsMargin)) / 3;
  directionalLight2.position.z = -(Math.sin(elapsed / 3) * (mazeSize * objectsMargin)) / 3;

  g.gameManager.updateGame(delta);


  g.gui.update(delta);

  g.renderer.resetState();
  g.renderer.render(g.scene, g.camera); // We are rendering the 3D world

  g.rendererPixi.reset();
  g.rendererPixi.render(g.scenePixi, {clear: false}); // Rendering the 2D g.scene without erasing the 3D world




  requestAnimationFrame(render); // we are calling render() again,  to loop
}

const onResize = () => {
  if(g.renderer) {
    g.renderer.setPixelRatio(window.devicePixelRatio);
    g.renderer.setSize(window.innerWidth, window.innerHeight);
  }
  if(g.rendererPixi) {
    g.rendererPixi.resize(window.innerWidth, window.innerHeight);
  }
  if(g.camera) {
    g.camera.fov = getFov();
    g.camera.aspect = window.innerWidth / window.innerHeight;
    g.camera.updateProjectionMatrix();
  }

  g.gui.onResize();
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
