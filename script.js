// Basic Threejs variables
var scene;
var clock;
var camera;
var renderer;

// Benchmarking
var stats;
var fps;
var deltas = [];
var deltaSize = 400;
var quality = 1;
var latest = 0;

// 3D
// Wave configuration
var gridSize = 100;
var cubeSize = 10;
var wavespeed = 1;
var wavewidth = 75;
var waveheight = 25;
var objects_margin = 15;
//Array
var waveobjects = new Array();

function init() {
    scene = new THREE.Scene();
    clock = new THREE.Clock();

    // ---------------- RENDERER ----------------

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio * quality);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement); // we add the HTML element to the HTML page

    // ---------------- CAMERA ----------------

    camera = new THREE.PerspectiveCamera(66, window.innerWidth / window.innerHeight, 1, 10000);
    camera.position.set(0, (gridSize * objects_margin), -(gridSize * objects_margin));
    camera.lookAt(new THREE.Vector3(0, 0, 0));
    scene.add(camera);

    // ---------------- LIGHTS ----------------

    var ambientLight = new THREE.AmbientLight(0xcccccc, 0.2);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    scene.add(directionalLight);

    // ---------------- 3D CUBE ----------------

    for (var x = 0; x < gridSize; x++) {
        for (var z = 0; z < gridSize; z++) {
            const geometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
            const material = new THREE.MeshPhongMaterial({ color: 0x00ffff });
            const cube = new THREE.Mesh(geometry, material);
            cube.position.x = x * objects_margin - (gridSize * objects_margin) / 2; // POSITION X
            cube.position.y = 0;
            cube.position.z = z * objects_margin - (gridSize * objects_margin) / 2; //POSITION Z
            scene.add(cube);
            waveobjects.push(cube);
        }
    }

    // ---------------- BENCHMARKING ----------------
    stats = new Stats();
    stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
    document.body.appendChild(stats.dom);

    // ---------------- STARTING THE RENDER LOOP ----------------

    render();
}

function render() {
    stats.begin();

    requestAnimationFrame(render); // we are calling render() again,  to loop

    var delta = clock.getDelta();
    var elapsed = clock.elapsedTime;

    deltas.push(delta);
    deltas = deltas.slice(-deltaSize);
    fps = Math.floor(deltas.length / deltas.reduce((a, b) => a + b));

    for (var i = 0; i < waveobjects.length; i++) {
        waveobjects[i].rotation.x += 0.3 * delta;
        waveobjects[i].rotation.y += 0.5 * delta;
        waveobjects[i].position.y =
            Math.cos(
                (elapsed + waveobjects[i].position.x / wavewidth * 1.2 + waveobjects[i].position.z / wavewidth) * wavespeed
            ) * waveheight;
    }

    renderer.render(scene, camera); // We are rendering the 3D world

    stats.end();

    latest += delta;

    if (latest > 5) {
        latest -= 5;
        const statsDiv = document.getElementById('benchmarking');
        statsDiv.innerHTML = `${Math.floor(elapsed)} sec | ${renderer.info.render.triangles} triangles | ${fps} FPS`;
    }
}

init();
