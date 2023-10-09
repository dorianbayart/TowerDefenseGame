// Basic Threejs variables
var scene;
var clock;
var camera;
var renderer;

//3D Cub
var cube;

// Benchmarking
var stats;
var fps;
var deltas = [];
var deltaSize = 400;
var quality = 1;
var latest = 0;

function init() {
    scene = new THREE.Scene();
    clock = new THREE.Clock();

    // ---------------- RENDERER ----------------

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio * quality);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement); // we add the HTML element to the HTML page

    // ---------------- CAMERA ----------------

    camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 10000);
    camera.position.set(-500, 400, -500);
    camera.lookAt(new THREE.Vector3(0, 0, 0));
    scene.add(camera);

    // ---------------- LIGHTS ----------------

    var ambientLight = new THREE.AmbientLight(0xcccccc, 0.2);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    scene.add(directionalLight);

    // ---------------- 3D CUBE ----------------

    const geometry = new THREE.BoxGeometry(150, 150, 150);
    const material = new THREE.MeshPhongMaterial({ color: 0x00ffff });
    cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

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
    fps = Math.floor(deltas.length / deltas.reduce((a, b) => (a + b)));




    // rotating the cube each render tick
    cube.rotation.x += .2 * delta;
    cube.rotation.y += .45 * delta;

    renderer.render(scene, camera); // We are rendering the 3D world

    stats.end();

    latest += delta;

    if (latest > 5) {
        latest -= 5;
        const statsDiv = document.getElementById('benchmarking');
        statsDiv.innerHTML = `${Math.floor(elapsed)} sec | ${renderer.info.render.triangles} triangles | ${fps} FPS`
    }
}

init();
