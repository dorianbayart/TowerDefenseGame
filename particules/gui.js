function createTowerGui_open() {
    document.getElementById('createTowerDiv').style.display = 'block';
}
function createTowerGui_close() {
    document.getElementById('createTowerDiv').style.display = 'none';
}
function infoTowerGui_open(speed, power, range) {
    document.getElementById('speed').innerHTML = Math.round(1/speed * 10) / 10;
    document.getElementById('power').innerHTML = power;
    document.getElementById('range').innerHTML = range;
    document.getElementById('TowerInfoDiv').style.display = 'block';
}
function infoTowerGui_close() {
    document.getElementById('TowerInfoDiv').style.display = 'none';
    document.getElementById('speed').innerHTML = 'NULL';
    document.getElementById('power').innerHTML = 'NULL';
    document.getElementById('range').innerHTML = 'NULL';
}

const onMouseUp = (event) => {
    cursor.material.emissive.g = 0;
    cursor.material.color = THREE_COLOR.GREEN;
    towerManager.newTowerToCreate = undefined;
    towerManager.selectedTower = undefined;

    const type = Object.keys(TOWER_TYPES)[Math.round(Math.random())];

    if(towerManager.rangeTowerToDisplay) {
      var tmpRangeTower = towerManager.rangeTowerToDisplay;
      scene.remove(tmpRangeTower);
      towerManager.rangeTowerToDisplay = undefined;
    }

    if (cursorValid) {
        var checkTower = towerManager.getTowerAtPosition(cursor.position.x, cursor.position.z);
        const mazeMesh = maze[0][0].mesh;

        if (checkTower === null) {
          if(TOWER_TYPES[type].cost <= gameManager.game.money) {
            var newTower = new Tower(type);
            newTower.mesh.position.set(cursor.position.x, mazeMesh.position.y + mazeMesh.geometry.parameters.height/2 + newTower.mesh.geometry.parameters.height/2, cursor.position.z);
            towerManager.newTowerToCreate = newTower;
            var rangeTower = TOWER_TYPES[type].rangeMesh.clone();
            rangeTower.position.set(cursor.position.x, mazeMesh.position.y + mazeMesh.geometry.parameters.height/2, cursor.position.z);
            towerManager.rangeTowerToDisplay = rangeTower;
            scene.add(rangeTower);
            infoTowerGui_close();
            createTowerGui_open();
          }
        } else {
            towerManager.selectedTower = checkTower;
            var rangeTower = TOWER_TYPES[checkTower.type].rangeMesh.clone();
            rangeTower.position.set(cursor.position.x, mazeMesh.position.y + mazeMesh.geometry.parameters.height/2, cursor.position.z);
            towerManager.rangeTowerToDisplay = rangeTower;
            scene.add(rangeTower);
            createTowerGui_close();
            infoTowerGui_open(checkTower.speed, checkTower.power, checkTower.range);
        }
    } else {
        createTowerGui_close();
        infoTowerGui_close();
    }
};

const onMouseDown = (event) => {
    event.preventDefault();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    var intersects = raycaster.intersectObjects(clickableObjs);

    if (intersects.length > 0) {
        cursor.material.color = THREE_COLOR.RED;
        cursorValid = true;
    } else {
        cursorValid = false;
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
            selectedBloc.position.y + selectedBloc.geometry.parameters.height / 2 + cursor.geometry.parameters.height / 2,
            selectedBloc.position.z
        );
        cursor.material.opacity = 0.5;
    } else {
        cursor.material.opacity = 0;
    }
};
