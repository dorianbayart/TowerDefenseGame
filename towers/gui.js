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

    if (cursorValid) {
        var checkTower = towerManager.getTowerAtPosition(cursor.position.x, cursor.position.z);

        if (checkTower === null) {
            var newtower = tower_mesh.clone();
            newtower.position.set(cursor.position.x, 1, cursor.position.z);
            towerManager.newTowerMeshToCreate = newtower;
            infoTowerGui_close();
            createTowerGui_open();
        } else {
            towerManager.selectedTower = checkTower;
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
            /*selectedBloc.position.y +*/ selectedBloc.geometry.parameters.height +
                cursor.geometry.parameters.height / 2,
            selectedBloc.position.z
        );
        cursor.material.opacity = 0.5;
    } else {
        cursor.material.opacity = 0;
    }
};
