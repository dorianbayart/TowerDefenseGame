let boxShape, transform, vector, quaternion

export const btBoxShape = (x, y, z) => {
    if(boxShape) boxShape.setLocalScaling(btVector(x, y, z))
    else boxShape = new Ammo.btBoxShape( btVector() )
    return boxShape
}

export const btVector = (x, y, z) => {
    if(vector) {
      vector.setValue(x, y, z)
    } else {
      vector = new Ammo.btVector3(x, y, z)
    }
    return vector
}

export const btQuaternion = (x, y, z, w) => {
    if(quaternion) {
      quaternion.setValue(x, y, z, w)
    } else {
      quaternion = new Ammo.btQuaternion(x, y, z, w)
    }
    return quaternion
}

export const btTransform = (vector, quaternion) => {
  if(transform) {
    transform.setOrigin( vector )
    transform.setRotation( quaternion )
  } else {
    transform = new Ammo.btTransform()
    transform.setIdentity()
  }
  return transform
}

export const getShuffledArr = (arr) => {
    const newArr = arr.slice()
    for (let i = newArr.length - 1; i > 0; i--) {
        const rand = Math.floor(Math.random() * (i + 1)); // ; is required because of next line
        [newArr[i], newArr[rand]] = [newArr[rand], newArr[i]]
    }
    return newArr
};

export const toDegrees = (radians) => {
    return radians * (180 / Math.PI)
};

export const toRadians = (degrees) => {
    return degrees * (Math.PI / 180)
};

export const towerTypeToLabel = (type) => {
  return type.split('_').map(l => l.charAt(0).toUpperCase()+l.slice(1).toLowerCase()).join(' ')
}
