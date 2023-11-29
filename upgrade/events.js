import { ammoStart } from './script.js';


import g from './global.js';


const toggleElementVisibility = async (elementsToHide = [], elementsToDisplay = [], noTimeout = false) => {
  const timeout = noTimeout ? 0 : 125;
  for (var element of elementsToHide) {

      setTimeout(async () => element.classList.add('displayNone'), timeout);
      element.classList.add('hide');

  }

  setTimeout(async () => {
    for (var element of elementsToDisplay) {

        element.classList.remove('displayNone');
        setTimeout(async () => element.classList.remove('hide'), 0);

    }
  }, 2 * timeout);

}

export const displayHomeMenu = () => {
  setTimeout(() => document.body.style.opacity = 1, 250);
  toggleElementVisibility(
    [document.getElementById('menuOptions'), document.getElementById('gameBuildButton')],
    [document.getElementById('menuHome')]);
}

export const displayGameButtons = () => {
  toggleElementVisibility(
    [],
    [document.getElementById('gameBuildButton')]
  );
}

export const initMainMenuEvents = () => {
  // Start Button
  document.getElementById('startGame').addEventListener('click', () => {
    toggleElementVisibility(
      [document.getElementById('menuHome')]
    );

    // ------ Ammo.js Init ------
    if(g.ammo) {
      ammoStart();
    } else {
      g.ammo = Ammo();
      g.ammo.then( ammoStart );
    }
  })

  // Options Buttons
  document.getElementById('options').addEventListener('click', () => {
    toggleElementVisibility([document.getElementById('menuHome')], [document.getElementById('menuOptions')]);

    document.getElementById('antialiasingValue').innerHTML = g.parameters.antialiasing ? 'Yes' : 'No';
    document.getElementById('shadowsValue').innerHTML = g.parameters.shadows ? 'Yes' : 'No';
    switch(g.parameters.quality) {
      case .5:
        document.getElementById('qualityValue').innerHTML = 'Low';
        break;
      case .75:
        document.getElementById('qualityValue').innerHTML = 'Medium';
        break;
      case 1:
      default:
        document.getElementById('qualityValue').innerHTML = 'High';
        break;
    }
    switch(g.parameters.shadowMapSize) {
      case 512:
        document.getElementById('shadowsQualityValue').innerHTML = 'Low';
        break;
      case 1024:
        document.getElementById('shadowsQualityValue').innerHTML = 'Medium';
        break;
      case 2048:
      default:
        document.getElementById('shadowsQualityValue').innerHTML = 'High';
        break;
    }
  })
  document.getElementById('antialiasingButton').addEventListener('click', () => {
    g.parameters.antialiasing = !g.parameters.antialiasing;
    document.getElementById('antialiasingValue').innerHTML = g.parameters.antialiasing ? 'Yes' : 'No';
  })
  document.getElementById('qualityButton').addEventListener('click', () => {
    if(g.parameters.quality === .5) {
      g.parameters.quality = .75;
      document.getElementById('qualityValue').innerHTML = 'Medium';
    } else if(g.parameters.quality === .75) {
      g.parameters.quality = 1;
      document.getElementById('qualityValue').innerHTML = 'High';
    } else if(g.parameters.quality === 1) {
      g.parameters.quality = .5;
      document.getElementById('qualityValue').innerHTML = 'Low';
    }
  })
  document.getElementById('shadowsButton').addEventListener('click', () => {
    g.parameters.shadows = !g.parameters.shadows;
    document.getElementById('shadowsValue').innerHTML = g.parameters.shadows ? 'Yes' : 'No';
    if(g.parameters.shadows) {
      document.getElementById('shadowsQualityButton').classList.remove('disabled');
    } else {
      document.getElementById('shadowsQualityButton').classList.add('disabled');
    }
  })
  document.getElementById('shadowsQualityButton').addEventListener('click', () => {
    if(!g.parameters.shadows) return;
    if(g.parameters.shadowMapSize === 512) {
      g.parameters.shadowMapSize = 1024;
      document.getElementById('shadowsQualityValue').innerHTML = 'Medium';
    } else if(g.parameters.shadowMapSize === 1024) {
      g.parameters.shadowMapSize = 2048;
      document.getElementById('shadowsQualityValue').innerHTML = 'High';
    } else if(g.parameters.shadowMapSize === 2048) {
      g.parameters.shadowMapSize = 512;
      document.getElementById('shadowsQualityValue').innerHTML = 'Low';
    }
  })
  document.getElementById('menuOptions-back').addEventListener('click', () => {
    toggleElementVisibility([document.getElementById('menuOptions')], [document.getElementById('menuHome')]);
  });



  displayHomeMenu();
}

export const initGameButtonsEvents = () => {
  displayGameButtons();
}
