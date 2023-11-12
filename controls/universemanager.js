import g from './global.js';
import { btBoxShape, btQuaternion, btTransform, btVector } from './helpers.js'

let tmpTransformation;

export class UniverseManager {
  constructor() {
      this.physicsUniverse = undefined;
      this.rigidBodyList = new Array();

      this.initPhysicsUniverse();
  }

  initPhysicsUniverse = () => {
      tmpTransformation = new Ammo.btTransform();
      btTransform();
      btBoxShape();

      const collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
      const dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
      const overlappingPairCache  = new Ammo.btDbvtBroadphase();
      const solver = new Ammo.btSequentialImpulseConstraintSolver();
      this.physicsUniverse = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
      this.physicsUniverse.setGravity(btVector(0, -9.81, 0));
  }

  updatePhysicsUniverse = (deltaTime) => {
      this.physicsUniverse.stepSimulation( deltaTime, 10 );
      let Graphics_Obj, Physics_Obj, motionState, new_pos, new_qua;

      for ( let i = 0; i < this.rigidBodyList.length; i++ ) {
        Graphics_Obj = this.rigidBodyList[ i ];
        Physics_Obj = Graphics_Obj.userData.physicsBody;

        motionState = Physics_Obj.getMotionState();
        if ( motionState ) {
            motionState.getWorldTransform( tmpTransformation );
            new_pos = tmpTransformation.getOrigin();
            new_qua = tmpTransformation.getRotation();
            Graphics_Obj.position.set( new_pos.x(), new_pos.y(), new_pos.z() );
            Graphics_Obj.quaternion.set( new_qua.x(), new_qua.y(), new_qua.z(), new_qua.w() );
        }
      }
  }

  linkPhysicsObject = (mesh, mass = 0, quaternion = {x: 0, y: 0, z: 0, w: 1}, inertia = {x: 0, y: 0, z: 0}) => {
    const t = new Ammo.btTransform();
    t.setIdentity();
    t.setOrigin(btVector(mesh.position.x, mesh.position.y, mesh.position.z));
    t.setRotation(btQuaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w));
    const defaultMotionState = new Ammo.btDefaultMotionState( t );

    const structColShape = new Ammo.btBoxShape( btVector(mesh.geometry.parameters.width*0.5, mesh.geometry.parameters.height*0.6, mesh.geometry.parameters.depth*0.5) );
    const localInertia = btVector( inertia.x, inertia.y, inertia.z );
    structColShape.setMargin( 0.001 );
    structColShape.calculateLocalInertia( mass, localInertia );

    let RBody_Info = new Ammo.btRigidBodyConstructionInfo( mass, defaultMotionState, structColShape, localInertia );
    let RBody = new Ammo.btRigidBody( RBody_Info );

    let velocity = btVector( inertia.x, inertia.y, inertia.z );
    RBody.setLinearVelocity( velocity );
    this.physicsUniverse.addRigidBody( RBody );

    mesh.userData.physicsBody = RBody;
    this.rigidBodyList.push(mesh);
  }

  linkPhysicsParticule = (mesh, mass, quaternion, inertia) => {
    quaternion = quaternion ?? {x: 0, y: 0, z: 0, w: 1};
    inertia = inertia ?? {x: 0, y: 0, z: 0};

    const defaultMotionState = new Ammo.btDefaultMotionState(
      btTransform(btVector(mesh.position.x, mesh.position.y, mesh.position.z),
      btQuaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w))
    );

    const structColShape = btBoxShape( mesh.geometry.parameters.width*0.75, mesh.geometry.parameters.height*0.75, mesh.geometry.parameters.depth*0.75 );
    const localInertia = btVector( inertia.x, inertia.y, inertia.z );
    structColShape.setMargin( 0.001 );
    structColShape.calculateLocalInertia( mass, localInertia );

    let RBody_Info = new Ammo.btRigidBodyConstructionInfo( mass, defaultMotionState, structColShape, localInertia );
    let RBody = new Ammo.btRigidBody( RBody_Info );

    let velocity = btVector( inertia.x, inertia.y, inertia.z );
    RBody.setLinearVelocity( velocity );
    this.physicsUniverse.addRigidBody( RBody );

    mesh.userData.physicsBody = RBody;
    this.rigidBodyList.push(mesh);
  }

  deleteFromUniverse = (mesh) => {
    // delete from Scene
    g.scene.remove(mesh);

    // delete from Physics Universe
    const index = this.rigidBodyList.indexOf(mesh);
    if(index > -1) {
      this.rigidBodyList.splice(index, 1);
      this.physicsUniverse.removeRigidBody(mesh.userData.physicsBody);
      if(mesh.userData.physicsBody.getMotionState()) {
        mesh.userData.physicsBody.getMotionState().__destroy__();
      }
      if(mesh.userData.physicsBody.getCollisionShape()) {
        //mesh.userData.physicsBody.getCollisionShape().__destroy__();
      }
      mesh.userData.physicsBody.__destroy__();
      mesh.userData = null;
      mesh.material.dispose();
      mesh = null;
    }
  }
}
