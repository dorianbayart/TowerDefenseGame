import * as THREE from 'three';
import g from './global.js';
import { towerTypeToLabel } from './helpers.js';
import { COLOR, THREE_COLOR } from './constants.js';
import { TOWER_TYPES } from './types.js';
import { toggleElementVisibility } from './events.js';
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
    animate: false
};

const defaultTextStyle = {
  dropShadow: false,
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

    this.buildType;

    this.moneyLogo;
    this.scoreLogo;
    this.livesLogo;
    this.money;
    this.score;
    this.lives;
    this.topBar;
    this.bottomBar;
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
    this.initTexts();
    this.initEnergyBar(energyBarParameters);
    // this.initEvents();
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
          this.debugStats.text = `HP:${hpToDisplay} | ${g.renderer.info.render.triangles}tri | Particules:${particulesNumber}\n${Math.round(window.innerWidth*window.devicePixelRatio*100)/100}x${Math.round(window.innerHeight*window.devicePixelRatio*100)/100} | PixelRatio:${Math.round(window.devicePixelRatio*100)/100} | ${fps}FPS`;
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
  }

  initTexts = () => {
    /* Top Bar */
    this.topBar = new PIXI.Graphics();
    g.scenePixi.addChild(this.topBar);

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
      this.topBar.beginFill(COLOR.STEEL, .85);
      this.topBar.drawRect(0, 0, window.innerWidth, 3*1.5*this.textStyle.fontSize + 10);
      this.topBar.drawRect(0, window.innerHeight - 2.4*this.textStyle.fontSize - 5, window.innerWidth, window.innerHeight);
      this.topBar.endFill();

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
      this.topBar.beginFill(COLOR.STEEL, .85);
      this.topBar.drawRect(0, 0, window.innerWidth, energyBarParameters.height + 1.4*this.textStyle.fontSize + 5);
      this.topBar.drawRect(0, window.innerHeight - 2.4*this.textStyle.fontSize - 6, window.innerWidth, window.innerHeight);
      this.topBar.endFill();

      this.moneyLogo.x = this.moneyLogo.width/2 + 5;
      this.moneyLogo.y = this.moneyLogo.height/2 + 8;
      this.money.position.set(5 + this.moneyLogo.width + 4, 7);

      this.scoreLogo.x = this.scoreLogo.width/2 + 105;
      this.scoreLogo.y = this.scoreLogo.height/2 + 8;
      this.score.position.set(105 + this.scoreLogo.width + 4, 7);

      this.livesLogo.x = this.livesLogo.width/2 + 205;
      this.livesLogo.y = this.livesLogo.height/2 + 7;
      this.lives.position.set(205 + this.livesLogo.width + 4, 7);
    }

    if(this.progressBar?.bg?.position && this.progressBar?.fill?.position) {
      this.progressBar.bg.position.x = window.innerWidth - energyBarParameters.width - 5;
      this.progressBar.fill.position.x = window.innerWidth - energyBarParameters.width - 5;
    }
    this.energyPerSec.position.set(window.innerWidth - energyBarParameters.width - 5, energyBarParameters.height + 2);

    this.debugStats.position.set(5, window.innerHeight - 2.4*this.textStyle.fontSize - 5);
  }


  createTowerGui_open = () => {
      document.getElementById('createTowerDiv').style.display = 'block';
  };
  createTowerGui_close = () => {
      document.getElementById('createTowerDiv').style.display = 'none';
  };
  infoTowerGui_open = (type, level, speed, power, range) => {
      document.getElementById('towerInfo').innerHTML = `${towerTypeToLabel(type)} - Level ${level}`;
      document.getElementById('speed').innerHTML = Math.round(1/speed * 10) / 10;
      document.getElementById('power').innerHTML = power;
      document.getElementById('range').innerHTML = range;
      document.getElementById('towerInfoDiv').style.display = 'block';
  };
  infoTowerGui_close = () => {
      document.getElementById('towerInfoDiv').style.display = 'none';
      document.getElementById('towerInfo').innerHTML = 'NULL';
      document.getElementById('speed').innerHTML = 'NULL';
      document.getElementById('power').innerHTML = 'NULL';
      document.getElementById('range').innerHTML = 'NULL';
  };

  onMouseUp = (event) => {
      g.towerManager.selectedTower = undefined;
      buttonclose();

      if (this.cursorValid) {
          const checkTower = g.towerManager.getTowerAtPosition(this.cursor.position.x, this.cursor.position.z);
          const mazeMesh = g.mazeManager.maze.map[0][0].mesh;

          if (checkTower === null) { // new tower
            if(g.gui.buildType && TOWER_TYPES[g.gui.buildType].cost <= g.gameManager.game.money) {
              g.towerManager.addTower()

              var tmpRangeTower = g.towerManager.rangeTowerToDisplay;
              if(tmpRangeTower) g.scene.remove(tmpRangeTower);
              g.towerManager.rangeTowerToDisplay = undefined;

              hideGameBuildOptions();
              g.scene.remove(g.gui.cursor);
              g.gui.buildType = undefined;
            }
          } else { // tower exists
              g.towerManager.selectedTower = checkTower;
              var rangeTower = TOWER_TYPES[checkTower.type].rangeMesh.clone();
              rangeTower.position.set(this.cursor.position.x, mazeMesh.position.y + mazeMesh.geometry.parameters.height/2, this.cursor.position.z);
              g.towerManager.rangeTowerToDisplay = rangeTower;
              g.scene.add(rangeTower);
              this.infoTowerGui_open(checkTower.type, checkTower.level, checkTower.speed, checkTower.power, checkTower.range);

              g.scene.remove(g.gui.cursor);
              g.gui.buildType = undefined;
              g.towerManager.newTowerToCreate = undefined;
              this.cursor.material.opacity = 0;
              this.cursorValid = false;
          }
      } else {
          g.scene.remove(g.gui.cursor);
          hideGameBuildOptions();
          g.gui.buildType = undefined;
          g.towerManager.newTowerToCreate = undefined;
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
        this.cursorValid = true;
      } else {
        this.cursor.material.opacity = 0;
        this.cursorValid = false;
      }

      const checkTower = g.towerManager.getTowerAtPosition(this.cursor.position.x, this.cursor.position.z);
      const mazeMesh = g.mazeManager.maze.map[0][0].mesh;

      if (this.cursorValid && g.gui?.buildType) {
          this.cursor.material.color = THREE_COLOR.GREEN;

          if (checkTower === null) {
            if(g.towerManager.newTowerToCreate) {
              // move tower to create
              g.towerManager.newTowerToCreate.mesh.position.set(this.cursor.position.x, mazeMesh.position.y + mazeMesh.geometry.parameters.height/2 + g.towerManager.newTowerToCreate.mesh.geometry.parameters.height/2, this.cursor.position.z);
            } else {
              var newTower = new Tower(g.gui.buildType);
              newTower.mesh.position.set(this.cursor.position.x, mazeMesh.position.y + mazeMesh.geometry.parameters.height/2 + newTower.mesh.geometry.parameters.height/2, this.cursor.position.z);
              g.towerManager.newTowerToCreate = newTower;
            }
            if(g.towerManager.rangeTowerToDisplay) {
              g.towerManager.rangeTowerToDisplay.position.set(this.cursor.position.x, mazeMesh.position.y + mazeMesh.geometry.parameters.height/2, this.cursor.position.z);
            } else {
              var rangeTower = TOWER_TYPES[g.gui.buildType].rangeMesh.clone();
              rangeTower.position.set(this.cursor.position.x, mazeMesh.position.y + mazeMesh.geometry.parameters.height/2, this.cursor.position.z);
              g.towerManager.rangeTowerToDisplay = rangeTower;
              g.scene.add(rangeTower);
            }
          } else {
            this.cursor.material.color = THREE_COLOR.RED;
            var tmpRangeTower = g.towerManager.rangeTowerToDisplay;
            if(tmpRangeTower) g.scene.remove(tmpRangeTower);
            g.towerManager.rangeTowerToDisplay = undefined;
          }
      } else if (this.cursorValid && checkTower && g.gui && !g.gui.buildType && !g.towerManager.selectedTower) {
        var tmpRangeTower = g.towerManager.rangeTowerToDisplay;
        if(tmpRangeTower) g.scene.remove(tmpRangeTower);
        var rangeTower = TOWER_TYPES[checkTower.type].rangeMesh.clone();
        rangeTower.position.set(this.cursor.position.x, mazeMesh.position.y + mazeMesh.geometry.parameters.height/2, this.cursor.position.z);
        g.towerManager.rangeTowerToDisplay = rangeTower;
        g.scene.add(rangeTower);
      } else if(!g.towerManager.selectedTower && g.gui && !g.gui.buildType && (!checkTower || !this.cursorValid)) {
        var tmpRangeTower = g.towerManager.rangeTowerToDisplay;
        if(tmpRangeTower) g.scene.remove(tmpRangeTower);
        g.towerManager.rangeTowerToDisplay = undefined;
      }
  };

  gameOverDisplay = () => {
    const text = new PIXI.Text('Game Over !', new PIXI.TextStyle({
      dropShadow: true,
      dropShadowAlpha: 0.8,
      dropShadowBlur: 4,
      dropShadowDistance: 1,
      fontFamily: "\"Lucida Console\", Monaco, monospace",
      fontSize: 40,
      fontVariant: "small-caps",
      fill: COLOR.LIGHTERRED,
      lineJoin: 'bevel',
      strokeThickness: 4,
      align: 'left',
    }));
    text.anchor.set(0.5);
    text.x = window.innerWidth / 2;
    text.y = window.innerHeight / 2;
    g.scenePixi.addChild(text);

    buttonclose();
    buttonno();
  }

}


export const buttonno = (e) => {
  if(e) e.stopPropagation();
  g.towerManager.newTowerToCreate = undefined;
  var tmpRangeTower = g.towerManager.rangeTowerToDisplay;
  if(tmpRangeTower) g.scene.remove(tmpRangeTower);
  g.towerManager.rangeTowerToDisplay = undefined;
}

export const buttondelete = (e) => {
  if(e) e.stopPropagation();
  g.towerManager.deleteTower(g.towerManager.selectedTower);
  g.scene.remove(g.towerManager.selectedTower.mesh);
  g.gui.infoTowerGui_close();
  g.towerManager.selectedTower = undefined;
  var tmpRangeTower = g.towerManager.rangeTowerToDisplay;
  if(tmpRangeTower) g.scene.remove(tmpRangeTower);
  g.towerManager.rangeTowerToDisplay = undefined;
}

export const buttonclose = (e) => {
  if(e) e.stopPropagation();
  g.gui.infoTowerGui_close();
  g.towerManager.selectedTower = undefined;
  var tmpRangeTower = g.towerManager.rangeTowerToDisplay;
  if(tmpRangeTower) g.scene.remove(tmpRangeTower);
  g.towerManager.rangeTowerToDisplay = undefined;
}

export const hideGameBuildOptions = () => {
  toggleElementVisibility(
    [document.getElementById('gameBuildOptions')],
    []
  )
}
