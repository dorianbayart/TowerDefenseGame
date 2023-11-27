class Global {
  ammo; // AmmoJs instance

  constructor() {
    this.renderer;
    this.rendererPixi;
    this.scene;
    this.scenePixi;
    this.camera;
    this.gui;
    this.controls;

    this.parameters = {
      antialiasing: true,
      quality: 1,
      shadows: true,
      shadowMapSize: 768,
    }

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
