import * as THREE from 'three';
import g from './global.js';
import { COLOR, THREE_COLOR } from './constants.js';
import { TOWER_TYPES } from './types.js';
import { Tower } from './towermanager.js';

export class Gui {
  constructor() {
    this.cursor;
    this.cursorValid = false;
    this.mouse = new THREE.Vector2();
    this.raycaster = new THREE.Raycaster();

    this.gameInfosToDisplay;

    this.initCursor();
  }

  initCursor = () => {
    const cursorMaterial = new THREE.MeshLambertMaterial({ transparent: true, opacity: 0, color: COLOR.GREEN });
    const cursorGeometry = new THREE.BoxGeometry(1, 1 / 10, 1);
    this.cursor = new THREE.Mesh(cursorGeometry, cursorMaterial);
    // this.cursor.castShadow = true;
    this.cursor.receiveShadow = true;
    g.scene.add(this.cursor);
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
