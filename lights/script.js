'use strict';

// Basic Threejs variables
var scene;
var clock;
var camera;
var renderer;

// Benchmarking
var displayStats = true;
var statsDelay = 2.25; // in seconds
var fps;
var deltas = [];
var deltaSize = 280;
var quality = 1;
var latest = 0;

// 3D
// Grid
var gridSize = 25;
var polygonSize = 8;
var elevation = 5;
var objects_margin = 10;
var wavespeed = 1;
var wavewidth = gridSize * 4;
var waveheight = polygonSize / 4;
// Array
var waveobjects = new Array();
// Light
var directionalLight;

function init() {
    scene = new THREE.Scene();
    clock = new THREE.Clock();

    // ---------------- RENDERER ----------------

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio * quality);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement); // we add the HTML element to the HTML page

    // ---------------- CAMERA ----------------

    if (window.innerWidth > window.innerHeight) {
        camera = new THREE.PerspectiveCamera(
            (30 * window.devicePixelRatio * window.innerHeight) / 850,
            window.innerWidth / window.innerHeight,
            1,
            10000
        );
    } else {
        camera = new THREE.PerspectiveCamera(
            (30 * window.devicePixelRatio * window.innerWidth) / 450,
            window.innerWidth / window.innerHeight,
            1,
            10000
        );
    }
    camera.position.set(-(gridSize * objects_margin), gridSize * objects_margin, -(gridSize * objects_margin));
    camera.lookAt(new THREE.Vector3(-(gridSize * objects_margin) / 8, 0, -(gridSize * objects_margin) / 8));
    scene.add(camera);

    // ---------------- LIGHTS ----------------

    var ambientLight = new THREE.AmbientLight(0xcccccc, 0.25);
    scene.add(ambientLight);

    directionalLight = new THREE.PointLight(0xffffff, 10000);
    directionalLight.position.y = 2 * polygonSize;
    scene.add(directionalLight);

    // ---------------- 3D POLYGON ----------------

    for (var x = 0; x < gridSize; x++) {
        for (var z = 0; z < gridSize; z++) {
            const geometry = new THREE.BoxGeometry(polygonSize, polygonSize, polygonSize);
            const material = new THREE.MeshPhongMaterial({
                color: 'deepskyblue',
                side: THREE.DoubleSide,
                shininess: 200,
            });
            const polygon = new THREE.Mesh(geometry, material);
            polygon.position.x = x * objects_margin - (gridSize * objects_margin) / 2 + polygonSize / 2; // POSITION X
            // polygon.position.y = (Math.random() * polygonSize) / 2;
            polygon.position.z = z * objects_margin - (gridSize * objects_margin) / 2 + polygonSize / 2; // POSITION Z
            polygon.rotation.x = toRadians(90);
            scene.add(polygon);
            waveobjects.push(polygon);
        }
    }

    // ---------------- STARTING THE RENDER LOOP ----------------

    render();
}

function render() {
    requestAnimationFrame(render); // we are calling render() again,  to loop

    var delta = clock.getDelta();
    var elapsed = clock.elapsedTime;

    for (var i = 0; i < waveobjects.length; i++) {
        //waveobjects[i].rotation.x += delta / 3;
        //waveobjects[i].rotation.y += delta / 4;
        waveobjects[i].position.y =
            Math.cos(
                (elapsed + (waveobjects[i].position.x / wavewidth) * 4 + waveobjects[i].position.z / wavewidth) *
                    wavespeed
            ) * waveheight;
    }

    directionalLight.position.x = -((Math.cos(elapsed / 4) * (gridSize * objects_margin)) / 3);
    directionalLight.position.z = (Math.sin(elapsed / 4) * (gridSize * objects_margin)) / 3;

    renderer.render(scene, camera); // We are rendering the 3D world

    if (displayStats) {
        deltas.push(delta);
        deltas = deltas.slice(-deltaSize);
        fps = Math.floor(deltas.length / deltas.reduce((a, b) => a + b));

        latest += delta;

        if (latest > statsDelay) {
            latest -= statsDelay;
            const statsDiv = document.getElementById('benchmarking');
            statsDiv.innerHTML = `${Math.floor(elapsed)} sec | ${
                renderer.info.render.triangles
            } triangles | ${fps} FPS | PixelRatio:${window.devicePixelRatio}`;
        }
    }
}

init();