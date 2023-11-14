class Global {
  constructor() {
    this.scene;
    this.camera;
    this.gui;

    this.universeManager;

    this.builderManager;
    this.gameManager;
    this.mazeManager;
    this.missilesManager;
    this.mobsManager;
    this.particulesManager;
    this.towerManager;

    this.meshes = {};
    this.clickableObjs = new Array();
  }
}

export default ( new Global );
