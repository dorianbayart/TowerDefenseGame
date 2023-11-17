import * as THREE from 'three';
import g from './global.js';
import { COLOR, THREE_COLOR } from './constants.js';
import { TOWER_TYPES } from './types.js';
import { Tower } from './towermanager.js';

const energyBarParameters = {
    fillColor: 'lightgreen',
    borderColor: '#FFFFFF',
    backgroundColor: 'crimson',
    value: 0,
    width: 200,
    height: 12,
    radius: 4,
    border: 1,
    animate: false,
    vertical: false
};

const defaultTextStyle = {
  dropShadow: true,
  dropShadowAlpha: 0.8,
  dropShadowBlur: 4,
  dropShadowDistance: 1,
  fontFamily: "\"Lucida Console\", Monaco, monospace",
  fontSize: 16,
  fontVariant: "small-caps",
  fill: 'lightgreen',
  lineJoin: 'bevel',
  strokeThickness: 4,
  align: 'left',
};

var displayStats = true;
var statsToDisplay;
var refreshDelay = .5; // in seconds
var particulesNumber = 0;
var initialRigidBodyNumber = 0;
var fps;
var deltas = [];
var deltaSize = 5 / refreshDelay;

var latest = 0;

var hpToDisplay;

export class Gui {
  constructor() {
    this.cursor;
    this.cursorValid = false;
    this.mouse = new THREE.Vector2();
    this.raycaster = new THREE.Raycaster();

    this.money;
    this.score;
    this.lives;
    this.energyPerSec;
    this.debugStats;

    this.debug = {
      initialRigidBodyNumber: 0,
    };

    this.progressBar = {
      bg: undefined,
      fill: undefined,
      progress: 0
    };

    this.textStyle = new PIXI.TextStyle(defaultTextStyle);

    this.initCursor();
    this.initEnergyBar(energyBarParameters);
    this.initTexts();
  }

  update = (delta) => {
    this.updateTexts(delta);

    this.progressBar.progress = g.gameManager.game.energy / g.gameManager.game.capacity;
    this.updateProgressBar(energyBarParameters);
  }

  updateTexts = (delta) => {
    latest += delta;

    if (latest > refreshDelay) {
        latest -= refreshDelay;

        deltas.push(delta);
        deltas = deltas.slice(-deltaSize);
        fps = Math.round(deltas.length / deltas.reduce((a, b) => a + b));

        this.money.text = `Money: ${g.gameManager.game.money}`;
        this.score.text = `Score: ${g.gameManager.game.score}`;
        this.lives.text = `Lives: ${g.gameManager.game.lives}`;
        this.energyPerSec.text = `Energy: ${g.gameManager.game.energyPerSec >= 0 ? '+' : ''}${g.gameManager.game.energyPerSec.toFixed(g.gameManager.game.energyPerSec > 10 ? 0 : 2)}/s`;

        if (displayStats) {
          if(g.mobsManager.mobArray.length) {
            hpToDisplay = g.mobsManager.mobArray[g.mobsManager.mobArray.length-1]?.initialHp;
          }

          particulesNumber = g.universeManager.rigidBodyList.length - this.debug.initialRigidBodyNumber
          this.debugStats.text = `HP:${hpToDisplay} | ${g.renderer.info.render.triangles}tri | Particules:${particulesNumber}\n${Math.round(window.innerWidth*window.devicePixelRatio/**g.parameters.quality*/*100)/100}x${Math.round(window.innerHeight*window.devicePixelRatio/**g.parameters.quality*/*100)/100} | PixelRatio:${Math.round(window.devicePixelRatio*100)/100} | ${fps}FPS`;
        }
    }
  }

  updateProgressBar = ({
        borderColor,
        backgroundColor,
        fillColor,
        width,
        height,
        radius,
        border,
        animate,
        vertical
    }) => {
    this.progressBar.fill
      .clear()
      .beginFill(fillColor)
      .drawRoundedRect(border, border, width * this.progressBar.progress - (border * 2), height - (border * 2), radius);
  }

  initEnergyBar = ({
        value,
        borderColor,
        backgroundColor,
        fillColor,
        width,
        height,
        radius,
        border,
        animate,
        vertical
    }) => {

    this.progressBar.bg = new PIXI.Graphics()
        .beginFill(borderColor)
        .drawRoundedRect(0, 0, width, height, radius)
        .beginFill(backgroundColor)
        .drawRoundedRect(border, border, width - (border * 2), height - (border * 2), radius);
    this.progressBar.bg.position.x = window.innerWidth - width - 5;
    this.progressBar.bg.position.y = 2;

    this.progressBar.fill = new PIXI.Graphics()
        .beginFill(fillColor)
        .drawRoundedRect(border, border, value - (border * 2), height - (border * 2), radius);
    this.progressBar.fill.position.x = window.innerWidth - width - 5;
    this.progressBar.fill.position.y = 2;

    g.scenePixi.addChild(this.progressBar.bg);
    g.scenePixi.addChild(this.progressBar.fill);
  }

  initCursor = () => {
    const cursorMaterial = new THREE.MeshLambertMaterial({ transparent: true, opacity: 0, color: COLOR.GREEN });
    const cursorGeometry = new THREE.BoxGeometry(1, 1 / 10, 1);
    this.cursor = new THREE.Mesh(cursorGeometry, cursorMaterial);
    // this.cursor.castShadow = true;
    this.cursor.receiveShadow = true;
    g.scene.add(this.cursor);
  }

  initTexts = () => {
    this.money = new PIXI.Text('', this.textStyle);
    this.money.position.set(5, 2);
    g.scenePixi.addChild(this.money);

    this.score = new PIXI.Text('', this.textStyle);
    this.score.position.set(5, 1.1*this.textStyle.fontSize + 2);
    g.scenePixi.addChild(this.score);

    this.lives = new PIXI.Text('', this.textStyle);
    this.lives.position.set(5, 1.1*this.textStyle.fontSize*2 + 2);
    g.scenePixi.addChild(this.lives);

    this.energyPerSec = new PIXI.Text('', this.textStyle);
    this.energyPerSec.position.set(window.innerWidth - energyBarParameters.width - 5, energyBarParameters.height + 2);
    g.scenePixi.addChild(this.energyPerSec);

    this.debugStats = new PIXI.Text('', this.textStyle);
    this.debugStats.position.set(5, window.innerHeight - 2.4*this.textStyle.fontSize - 5);
    g.scenePixi.addChild(this.debugStats);
  }

  createTowerGui_open = () => {
      document.getElementById('createTowerDiv').style.display = 'block';
  };
  createTowerGui_close = () => {
      document.getElementById('createTowerDiv').style.display = 'none';
  };
  infoTowerGui_open = (speed, power, range) => {
      document.getElementById('speed').innerHTML = Math.round(1/speed * 10) / 10;
      document.getElementById('power').innerHTML = power;
      document.getElementById('range').innerHTML = range;
      document.getElementById('TowerInfoDiv').style.display = 'block';
  };
  infoTowerGui_close = () => {
      document.getElementById('TowerInfoDiv').style.display = 'none';
      document.getElementById('speed').innerHTML = 'NULL';
      document.getElementById('power').innerHTML = 'NULL';
      document.getElementById('range').innerHTML = 'NULL';
  };

  onMouseUp = (event) => {
      this.cursor.material.emissive.g = 0;
      this.cursor.material.color = THREE_COLOR.GREEN;
      g.towerManager.newTowerToCreate = undefined;
      g.towerManager.selectedTower = undefined;

      const type = Object.keys(TOWER_TYPES)[Math.round(Math.random())];

      if(g.towerManager.rangeTowerToDisplay) {
        var tmpRangeTower = g.towerManager.rangeTowerToDisplay;
        g.scene.remove(tmpRangeTower);
        g.towerManager.rangeTowerToDisplay = undefined;
      }

      if (this.cursorValid) {
          const checkTower = g.towerManager.getTowerAtPosition(this.cursor.position.x, this.cursor.position.z);
          const mazeMesh = g.mazeManager.maze.map[0][0].mesh;

          if (checkTower === null) { // new tower
            if(TOWER_TYPES[type].cost <= g.gameManager.game.money) {
              var newTower = new Tower(type);
              newTower.mesh.position.set(this.cursor.position.x, mazeMesh.position.y + mazeMesh.geometry.parameters.height/2 + newTower.mesh.geometry.parameters.height/2, this.cursor.position.z);
              g.towerManager.newTowerToCreate = newTower;
              var rangeTower = TOWER_TYPES[type].rangeMesh.clone();
              rangeTower.position.set(this.cursor.position.x, mazeMesh.position.y + mazeMesh.geometry.parameters.height/2, this.cursor.position.z);
              g.towerManager.rangeTowerToDisplay = rangeTower;
              g.scene.add(rangeTower);
              this.infoTowerGui_close();
              this.createTowerGui_open();
            }
          } else { // tower exists
              g.towerManager.selectedTower = checkTower;
              var rangeTower = TOWER_TYPES[checkTower.type].rangeMesh.clone();
              rangeTower.position.set(this.cursor.position.x, mazeMesh.position.y + mazeMesh.geometry.parameters.height/2, this.cursor.position.z);
              g.towerManager.rangeTowerToDisplay = rangeTower;
              g.scene.add(rangeTower);
              this.createTowerGui_close();
              this.infoTowerGui_open(checkTower.speed, checkTower.power, checkTower.range);
          }
      } else {
          this.createTowerGui_close();
          this.infoTowerGui_close();
      }
  };

  onMouseDown = (event) => {
      event.preventDefault();
      this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, g.camera);
      var intersects = this.raycaster.intersectObjects(g.clickableObjs);

      if (intersects.length > 0) {
          this.cursor.material.color = THREE_COLOR.RED;
          this.cursorValid = true;
      } else {
          this.cursorValid = false;
      }
  };

  onMouseMove = (event) => {
      event.preventDefault();
      this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, g.camera);
      var intersects = this.raycaster.intersectObjects(g.clickableObjs);

      if (intersects.length > 0) {
          var selectedBloc = intersects[0].object;
          this.cursor.position.set(
              selectedBloc.position.x,
              selectedBloc.position.y + selectedBloc.geometry.parameters.height / 2 + this.cursor.geometry.parameters.height / 2,
              selectedBloc.position.z
          );
          this.cursor.material.opacity = 0.5;
      } else {
          this.cursor.material.opacity = 0;
      }
  };

}
