// THIS IS A SAMPLE THREEJS SCENE AND SHOULD BE REPLACED WITH THE VR PANDA EDITOR 3D SCENE WHEN IMPLEMENTED TO VR PANDA.
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"; // Import OrbitControls

// Create scene, camera, and renderer
export const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setClearColor(0xeeeeee, 1);
document.getElementById("threejs-container").appendChild(renderer.domElement);
//const npc = createNPCGroup(scene);
// Add ambient light
const ambientLight = new THREE.AmbientLight(0xffffff, 2);
scene.add(ambientLight);

// Create a gradient skybox with a sharper transition
const skyboxGeometry = new THREE.SphereGeometry(500, 32, 32);
const skyboxMaterial = new THREE.MeshBasicMaterial({
    side: THREE.BackSide,
    vertexColors: true,
});

// Create vertices for the gradient
const skyboxVertices = skyboxGeometry.attributes.position.array;
const colors = new Float32Array(skyboxVertices.length * 3); // RGB for each vertex

const transitionHeight = 0; // Define the height of the transition

for (let i = 0; i < skyboxVertices.length / 3; i++) {
    const y = skyboxVertices[i * 3 + 1];
    // Define sharp transition
    if (y > transitionHeight) {
        colors[i * 3] = 0.529; // R (Blue)
        colors[i * 3 + 1] = 0.807; // G (Blue)
        colors[i * 3 + 2] = 0.98; // B (Blue)
    } else {
        colors[i * 3] = 0.5; // R (Gray)
        colors[i * 3 + 1] = 0.5; // G (Gray)
        colors[i * 3 + 2] = 0.5; // B (Gray)
    }
}

skyboxGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
const skybox = new THREE.Mesh(skyboxGeometry, skyboxMaterial);
scene.add(skybox);

// Create a floor for the avatar
const floorGeometry = new THREE.PlaneGeometry(100, 100);
const floorMaterial = new THREE.MeshBasicMaterial({
    color: 0x888888,
    side: THREE.DoubleSide,
});
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2; // Rotate the floor to be horizontal
floor.position.y = -0.01; // Slightly below the avatar
scene.add(floor);

// Create a clock to manage time
const clock = new THREE.Clock();

// Set camera position
camera.position.set(0, 2, 5); // Adjusted height and distance

// Initialize OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
controls.dampingFactor = 0.25;
controls.screenSpacePanning = false; // Prevent panning off the floor
controls.maxPolarAngle = Math.PI / 2; // Prevent flipping

// Handle window resize
function resize() {
    const threejsContainer = document.getElementById("threejs-container");
    const width = threejsContainer.clientWidth;
    const height = threejsContainer.clientHeight;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
}

// Resize initially
resize();

// Make resize function globally accessible
window.onWindowResize = resize;

// Add resize event listener
window.addEventListener("resize", resize);

// Animation loop
export function animate() {
    requestAnimationFrame(animate);

    controls.update(); // Update controls

    renderer.render(scene, camera);
}
animate();
