'use strict';

const btVector = (x, y, z) => {
    vector.setValue(x, y, z);
    return vector;
}

const btQuaternion = (x, y, z, w) => {
    quaternion.setValue(x, y, z, w);
    return quaternion;
}

const btTransform = (vector, quaternion) => {
  transform.setOrigin( vector );
  transform.setRotation( quaternion );
  return transform;
}

const toDegrees = (radians) => {
    return radians * (180 / Math.PI);
};

const toRadians = (degrees) => {
    return degrees * (Math.PI / 180);
};
