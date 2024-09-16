import * as THREE from "three";
import { scene } from "./npcScene";
import { createNPCGroup } from "./npc";

const clock = new THREE.Clock();
export const player = createNPCGroup(scene);

player.position.x += 5;
export let action = "idle";

// Create the diamond shape (upside down)
const diamondGeometry = new THREE.ConeGeometry(0.5, 1, 4);
const diamondMaterial = new THREE.MeshBasicMaterial({
    color: 0xffff00,
    transparent: true,
    opacity: 0.7,
});
const diamond = new THREE.Mesh(diamondGeometry, diamondMaterial);

// Position the diamond above the player
diamond.position.y = 2;
diamond.rotation.x = Math.PI; // Turn it upside down
player.add(diamond);

// Movement variables
const speed = 0.1; // Movement speed

// Animate function to rotate the diamond and handle movement
function animate() {
    requestAnimationFrame(animate);
    player.update(clock.getDelta());
    // Rotate the diamond around the Y axis
    diamond.rotation.y += 0.01;

    // Handle keyboard input for movement
    handleMovement();

    // Render the scene if needed
    // renderer.render(scene, camera);
}

// Function to handle player movement
function handleMovement() {
    const direction = new THREE.Vector3();

    if (keys["w"]) {
        // Forward
        direction.z = -1;
    }
    if (keys["s"]) {
        // Backward
        direction.z = 1;
    }
    if (keys["a"]) {
        // Left
        direction.x = -1;
    }
    if (keys["d"]) {
        // Right
        direction.x = 1;
    }

    if (keys["1"]) {
        player.swap(2);
        action = "waving";
        console.log(action);
    }

    // Normalize and apply movement
    if (direction.length() > 0) {
        direction.normalize(); // Ensure consistent speed
        player.position.add(direction.multiplyScalar(speed));
        player.swap(1);

        // Calculate the rotation towards the movement direction
        const angle = Math.atan2(direction.x, direction.z); // Calculate angle
        player.rotation.y = angle; // Set player's rotation to face the direction
    }
}

// Key press tracking
const keys = {};
window.addEventListener("keydown", (event) => {
    keys[event.key] = true;
});
window.addEventListener("keyup", (event) => {
    player.swap(0);
    action = "idle";
    console.log(action);
    keys[event.key] = false;
});

animate(); // Start the animation loop

player.getCurrentAction = function () {
    return action;
};
