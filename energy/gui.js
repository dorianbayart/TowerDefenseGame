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

var hpToDisplay = 0;

export class Gui {
  constructor() {
    this.cursor;
    this.cursorValid = false;
    this.mouse = new THREE.Vector2();
    this.raycaster = new THREE.Raycaster();

    this.moneyLogo;
    this.scoreLogo;
    this.livesLogo;
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

        this.money.text = g.gameManager.game.money;
        this.score.text = g.gameManager.game.score;
        this.lives.text = g.gameManager.game.lives;
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
    /* MONEY */
    this.moneyLogo = PIXI.Sprite.from('../public/icons/money-alt.svg');
    this.moneyLogo.anchor.set(.5);
    this.moneyLogo.width = 1.4*this.textStyle.fontSize;
    this.moneyLogo.height = 1.4*this.textStyle.fontSize;
    this.moneyLogo.tint = 0x00FF00;
    g.scenePixi.addChild(this.moneyLogo);

    this.money = new PIXI.Text('', this.textStyle);
    g.scenePixi.addChild(this.money);

    /* SCORE */
    this.scoreLogo = PIXI.Sprite.from('../public/icons/trophy.svg');
    this.scoreLogo.anchor.set(.5);
    this.scoreLogo.width = 1.2*this.textStyle.fontSize;
    this.scoreLogo.height = 1.2*this.textStyle.fontSize;
    this.scoreLogo.tint = 0x00FF00;
    g.scenePixi.addChild(this.scoreLogo);

    this.score = new PIXI.Text('', this.textStyle);
    g.scenePixi.addChild(this.score);

    /* LIVES */
    this.livesLogo = PIXI.Sprite.from('../public/icons/heart-shield.svg');
    this.livesLogo.anchor.set(.5);
    this.livesLogo.width = 1.4*this.textStyle.fontSize;
    this.livesLogo.height = 1.4*this.textStyle.fontSize;
    this.livesLogo.tint = 0x00FF00;
    g.scenePixi.addChild(this.livesLogo);

    this.lives = new PIXI.Text('', this.textStyle);
    g.scenePixi.addChild(this.lives);

    /* ENERGY */
    this.energyPerSec = new PIXI.Text('', this.textStyle);
    g.scenePixi.addChild(this.energyPerSec);

    /* DEBUG STATS */
    this.debugStats = new PIXI.Text('', this.textStyle);
    g.scenePixi.addChild(this.debugStats);

    this.onResize();
  }

  onResize = () => {
    if(window.innerWidth < 500 && window.innerWidth < window.innerHeight) { // Portrait
      const logoSize = this.moneyLogo.width;
      this.moneyLogo.x = logoSize/2 + 5;
      this.moneyLogo.y = logoSize/2 + 3;
      this.money.position.set(5 + this.moneyLogo.width + 4, 2);

      this.scoreLogo.x = logoSize/2 + 5;
      this.scoreLogo.y = logoSize/2 + 1.5*this.textStyle.fontSize + 3;
      this.score.position.set(5 + logoSize + 4, 1.5*this.textStyle.fontSize + 2);

      this.livesLogo.x = logoSize/2 + 5;
      this.livesLogo.y = logoSize/2 + 2*1.5*this.textStyle.fontSize + 3;
      this.lives.position.set(5 + logoSize + 4, 2*1.5*this.textStyle.fontSize + 2);
    } else { // Landscape
      this.moneyLogo.x = this.moneyLogo.width/2 + 5;
      this.moneyLogo.y = this.moneyLogo.height/2 + 3;
      this.money.position.set(5 + this.moneyLogo.width + 4, 2);

      this.scoreLogo.x = this.scoreLogo.width/2 + 105;
      this.scoreLogo.y = this.scoreLogo.height/2 + 3;
      this.score.position.set(105 + this.scoreLogo.width + 4, 2);

      this.livesLogo.x = this.livesLogo.width/2 + 205;
      this.livesLogo.y = this.livesLogo.height/2 + 2;
      this.lives.position.set(205 + this.livesLogo.width + 4, 2);
    }

    this.progressBar.bg.position.x = window.innerWidth - energyBarParameters.width - 5;
    this.progressBar.fill.position.x = window.innerWidth - energyBarParameters.width - 5;
    this.energyPerSec.position.set(window.innerWidth - energyBarParameters.width - 5, energyBarParameters.height + 2);

    this.debugStats.position.set(5, window.innerHeight - 2.4*this.textStyle.fontSize - 5);
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
