function createTowerGui_open() {
    document.getElementById('createTowerDiv').style.display = 'block';
}
function createTowerGui_close() {
    document.getElementById('createTowerDiv').style.display = 'none';
}
function infoTowerGui_open(tower_posx, tower_posz) {
    document.getElementById('posXinfo').innerHTML = tower_posx;
    document.getElementById('posZinfo').innerHTML = tower_posz;
    document.getElementById('TowerInfoDiv').style.display = 'block';
}
function infoTowerGui_close() {
    document.getElementById('TowerInfoDiv').style.display = 'none';
    document.getElementById('posXinfo').innerHTML = 'NULL';
    document.getElementById('posZinfo').innerHTML = 'NULL';
}

const onMouseUp = (event) => {
    cursor.material.emissive.g = 0;
    cursor.material.color = THREE_COLOR.GREEN;
    towerManager.newTowerMeshToCreate = undefined;
    towerManager.selectedTower = undefined;

    if(towerManager.rangeTowerToDisplay) {
      var tmpRangeTower = towerManager.rangeTowerToDisplay;
      scene.remove(tmpRangeTower);
      towerManager.rangeTowerToDisplay = undefined;
    }

    if (cursorValid) {
        var checkTower = towerManager.getTowerAtPosition(cursor.position.x, cursor.position.z);
        const mazeMesh = maze[0][0].mesh;

        if (checkTower === null) {
          if(Tower.DEFAULT_COST <= gameManager.game.money) {
            var newTower = towerMesh.clone();
            newTower.position.set(cursor.position.x, mazeMesh.position.y + mazeMesh.geometry.parameters.height/2 + towerMesh.geometry.parameters.height/2, cursor.position.z);
            towerManager.newTowerMeshToCreate = newTower;
            var rangeTower = rangeMesh.clone();
            rangeTower.position.set(cursor.position.x, mazeMesh.position.y + mazeMesh.geometry.parameters.height/2, cursor.position.z);
            towerManager.rangeTowerToDisplay = rangeTower;
            scene.add(rangeTower);
            infoTowerGui_close();
            createTowerGui_open();
          }
        } else {
            towerManager.selectedTower = checkTower;
            var rangeTower = rangeMesh.clone();
            rangeTower.position.set(cursor.position.x, mazeMesh.position.y + mazeMesh.geometry.parameters.height/2, cursor.position.z);
            towerManager.rangeTowerToDisplay = rangeTower;
            scene.add(rangeTower);
            createTowerGui_close();
            infoTowerGui_open(checkTower.mesh.position.x, checkTower.mesh.position.z);
        }
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
