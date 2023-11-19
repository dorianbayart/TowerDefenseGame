import * as THREE from 'three';

export const mazeSize = 15;
export const objectsMargin = 1;

export const COLOR = {
  BLACK: '#17202a',
  BLUE: '#2874a6',
  BROWN: '#ba4a00', //#A0522D = sienna
  DARKGRAY: '#626567',
  GREEN: '#1e8449',
  GRAY: '#909497',
  INDIGO: '#884ea0',
  LAVENDER: 'lavender',
  LIGHTBLUE: '#85c1e9',
  LIGHTBROWN: '#edbb99',
  LIGHTGRAY: '#d7dbdd',
  LIGHTGREEN: '#7dcea0',
  LIGHTINDIGO: '#d7bde2',
  LIGHTORANGE: '#f8c471',
  LIGHTRED: '#d98880',
  LIGHTSTEEL: '#85929e',
  LIGHTERBLUE: '#3498db',
  LIGHTERBROWN: '#dc7633',
  LIGHTERGRAY: '#bdc3c7',
  LIGHTERGREEN: '#27ae60',
  LIGHTERINDIGO: '#af7ac5',
  LIGHTERORANGE: '#f39c12',
  LIGHTERRED: '#c0392b',
  LIGHTERSTEEL: '#34495e',
  ORANGE: '#b9770e',
  RED: '#922b21',
  SALMON: 'lightsalmon',
  STEEL: '#283747',
  WHITE: '#fdfefe'
}

export const THREE_COLOR = {
  BLACK: new THREE.Color(COLOR.BLACK),
  BLUE: new THREE.Color(COLOR.BLUE),
  BROWN: new THREE.Color(COLOR.BROWN),
  DARKGRAY: new THREE.Color(COLOR.DARKGRAY),
  GREEN: new THREE.Color(COLOR.GREEN),
  GRAY: new THREE.Color(COLOR.GRAY),
  INDIGO: new THREE.Color(COLOR.INDIGO),
  LAVENDER: new THREE.Color(COLOR.LAVENDER),
  LIGHTGRAY: new THREE.Color(COLOR.LIGHTGRAY),
  RED: new THREE.Color(COLOR.RED),
  SALMON: new THREE.Color(COLOR.SALMON),
};
