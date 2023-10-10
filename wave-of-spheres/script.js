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
// Wave configuration
var gridSize = 40;
var polygonSize = 8;
var wavespeed = 1;
var wavewidth = 75;
var waveheight = polygonSize * 2;
var objects_margin = 15;
//Array
var waveobjects = new Array();

function init() {
    scene = new THREE.Scene();
    clock = new THREE.Clock();

    // ---------------- RENDERER ----------------

    renderer = new THREE.WebGLRenderer({ antialias: false });
    renderer.setPixelRatio(window.devicePixelRatio * quality);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement); // we add the HTML element to the HTML page

    // ---------------- CAMERA ----------------

    if (window.innerWidth > window.innerHeight) {
        camera = new THREE.PerspectiveCamera(
            (40 * window.devicePixelRatio * window.innerHeight) / 850,
            window.innerWidth / window.innerHeight,
            1,
            10000
        );
    } else {
        camera = new THREE.PerspectiveCamera(
            (40 * window.devicePixelRatio * window.innerWidth) / 450,
            window.innerWidth / window.innerHeight,
            1,
            10000
        );
    }
    camera.position.set(0, gridSize * objects_margin, -(gridSize * objects_margin));
    camera.lookAt(new THREE.Vector3(0, 0, 0));
    scene.add(camera);

    // ---------------- LIGHTS ----------------

    var ambientLight = new THREE.AmbientLight(0xcccccc, 0.2);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.85);
    scene.add(directionalLight);

    // ---------------- 3D POLYGON ----------------

    for (var x = 0; x < gridSize; x++) {
        for (var z = 0; z < gridSize; z++) {
            const geometry = new THREE.SphereGeometry(polygonSize, 12, 12);
            const material = new THREE.MeshPhongMaterial({ color: 0x00ffff });
            const polygon = new THREE.Mesh(geometry, material);
            polygon.position.x = x * objects_margin - (gridSize * objects_margin) / 2; // POSITION X
            polygon.position.y = 0;
            polygon.position.z = z * objects_margin - (gridSize * objects_margin) / 2; //POSITION Z
            scene.add(polygon);
            waveobjects.push(polygon);
        }
    }

    // ---------------- STARTING THE RENDER LOOP ----------------

    render();
}

function render() {
    var delta = clock.getDelta();
    var elapsed = clock.elapsedTime;

    for (var i = 0; i < waveobjects.length; i++) {
        // waveobjects[i].rotation.x += 0.3 * delta;
        // waveobjects[i].rotation.y += 0.5 * delta;
        waveobjects[i].position.y =
            Math.cos(
                (elapsed + (waveobjects[i].position.x / wavewidth) * 1.2 + waveobjects[i].position.z / wavewidth) *
                    wavespeed
            ) * waveheight;
    }

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

    requestAnimationFrame(render); // we are calling render() again,  to loop
}

init();
