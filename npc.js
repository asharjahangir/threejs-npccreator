// NPC.JS CONTAINS ALL OF THE THREEJS CODE ORGANIZED BY THE BLOCKS, EDIT THE THREEJS INSIDE THE BLOCK FUNCTIONS WITH THE VR PANDA COMPATIBLE CODE WHEN IMPLEMENTING
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { action, player } from "./player";
action;

let targetRotation = new THREE.Vector3();
let distance = 3;
const speed = 0.03; // Speed for smooth movement

export function createNPCGroup(scene) {
    const npc = new THREE.Group();
    npc.position.y = 1.15;
    scene.add(npc);

    const defaultPosition = npc.position;

    const loader = new GLTFLoader();
    const models = ["avatar_Idle.glb", "avatar_Walk.glb", "avatar_Waving.glb"];
    const animations = [];
    const avatars = [];

    const clock = new THREE.Clock();

    models.forEach((model, index) => {
        loader.load(
            `assets/${model}`,
            function (gltf) {
                const avatar = gltf.scene;
                avatars[index] = avatar;
                npc.add(avatar);

                const clip = gltf.animations[0];
                if (clip) {
                    const mixer = new THREE.AnimationMixer(avatar);
                    const action = mixer.clipAction(clip);
                    action.play();
                    animations.push(mixer);
                }

                avatar.position.set(0, 0, 0);
                if (index !== 0) {
                    avatar.visible = false;
                }
            },
            undefined,
            function (error) {
                console.error(`Error loading model ${model}:`, error);
            }
        );
    });

    npc.update = function (delta) {
        animations.forEach((mixer) => mixer.update(delta));
    };

    npc.swap = function (index) {
        avatars.forEach((avatar, i) => {
            if (avatar) {
                avatar.visible = i === index;
            }
        });
    };

    // Function to get the index of the currently visible model
    npc.getCurrentAction = function () {
        for (let i = 0; i < avatars.length; i++) {
            if (avatars[i] && avatars[i].visible) {
                switch (i) {
                    case 0:
                        return "idle";
                        break;
                    case 1:
                        return "wandering";
                        break;
                    case 2:
                        return "waving";
                        break;
                }
            }
        }
        return -1; // Return -1 if no model is visible
    };

    function hideAllModels() {
        npc.traverse((child) => {
            if (child.isMesh) {
                child.visible = false;
            }
        });
    }

    npc.reset = function () {
        npc.position.copy(new THREE.Vector3(0, npc.position.y, 0));
        npc.rotation.set(0, 0, 0); // Reset rotation
        npc.swap(0);
    };

    // Blocks - EACH BLOCK HAS ITS OWN FUNCTION, IF THE BLOCK REQUIRES THREEJS IT WILL BE FOUND HERE HOWEVER FOR NUMBER BLOCK AND LOGIC BLOCKS, THEY ARE CONTAINED IN THE BLOCKLYEDITOR.JS

    npc.blockAction = async function (action, duration) {
        console.log(`Performing ${action.toUpperCase()} action`);
        logState(`Performing ${action.toUpperCase()} action`);

        // Immediately swap to the specified action
        switch (action) {
            case "wave":
                setTimeout(() => {
                    npc.swap(2);
                }, 1);
                break;
            case "wander":
                setTimeout(() => {
                    npc.swap(1);
                }, 1);
                npcWander(duration);
                break;
            case "idle":
                setTimeout(() => {
                    npc.swap(0);
                }, 1);
                break; // Exit if idle
            default:
                console.log(`Unknown action: ${action.toUpperCase()}`);
                logState(`Unknown action: ${action.toUpperCase()}`);
                return; // Exit if action is unknown
        }

        const actionStartTime = performance.now();
        let isActive = true;

        // This function will act as the update loop
        const update = (event) => {
            if (!isActive) return;

            const elapsedTime = performance.now() - actionStartTime;

            if (elapsedTime >= duration * 1000) {
                isActive = false; // Stop the update loop
                setTimeout(() => {
                    npc.swap(0);
                }, 1);
                console.log(
                    `${action.toUpperCase()} action was performed for ${
                        Math.round((elapsedTime / 1000) * 10) / 10
                    } second(s)`
                );
                logState(`${action.toUpperCase()} action was performed for ${Math.round((elapsedTime / 1000) * 10) / 10} second(s)`);
                return;
            }
        };

        // Start the update loop
        const frameUpdate = () => {
            update(); // Call the update function
            if (isActive) {
                requestAnimationFrame(frameUpdate); // Continue the loop if active
            }
        };

        requestAnimationFrame(frameUpdate); // Start the frame update loop

        // Wait until the action is no longer active
        await new Promise((resolve) => {
            const checkActive = () => {
                if (!isActive) {
                    resolve(); // Resolve the promise if inactive
                } else {
                    requestAnimationFrame(checkActive); // Continue checking
                }
            };

            requestAnimationFrame(checkActive); // Start checking active state
        });
    };

    npc.blockMove = async function (distance) {
        // Start the NPC's movement animation
        logState(`Moving ${distance} steps`);
        setTimeout(() => {
            npc.swap(1);
        }, 1);

        const startPosition = npc.position.clone(); // Store the starting position
        const directionVector = new THREE.Vector3(0, 0, 1)
            .applyQuaternion(npc.quaternion)
            .normalize(); // Get the forward direction

        let movedDistance = 0;

        while (movedDistance < distance) {
            // Move the NPC in the direction it is facing
            npc.position.add(directionVector.clone().multiplyScalar(speed));

            // Calculate the distance moved
            movedDistance = startPosition.distanceTo(npc.position);

            // Yield control to allow smooth animation
            await new Promise(requestAnimationFrame);
        }

        npc.swap(0); // Stop the NPC after moving
    };

    npc.blockMoveTarget = async function (direction, target) {
        logState(`Moving ${direction} the ${target}`);
        setTimeout(() => {
            npc.swap(1);
        }, 1);

        const fixedSpeed = speed; // Keep the speed constant

        if (direction === "towards") {
            if (target === "player") {
                while (true) {
                    // Calculate direction to the player
                    const directionVector = new THREE.Vector3()
                        .subVectors(player.position, npc.position)
                        .normalize();
                    const distanceToPlayer = npc.position.distanceTo(
                        player.position
                    );

                    // Stop if close enough
                    if (distanceToPlayer <= distance) {
                        npc.swap(0);
                        break;
                    }

                    // Smooth rotation
                    const targetQuaternion =
                        new THREE.Quaternion().setFromUnitVectors(
                            new THREE.Vector3(0, 0, 1),
                            directionVector
                        );
                    npc.quaternion.slerp(targetQuaternion, 0.1);

                    // Move the NPC towards the player at a fixed speed
                    npc.position.add(
                        directionVector.multiplyScalar(fixedSpeed)
                    );

                    // Yield control to allow smooth animation
                    await new Promise(requestAnimationFrame);
                }
            }
        }

        if (direction === "away") {
            if (target === "player") {
                while (true) {
                    // Calculate direction away from the player
                    const directionVector = new THREE.Vector3()
                        .subVectors(npc.position, player.position)
                        .normalize();
                    const distanceToPlayer = npc.position.distanceTo(
                        player.position
                    );

                    // Stop if far enough
                    if (distanceToPlayer >= 10) {
                        npc.swap(0);
                        break;
                    }

                    // Smooth rotation
                    const targetQuaternion =
                        new THREE.Quaternion().setFromUnitVectors(
                            new THREE.Vector3(0, 0, 1),
                            directionVector
                        );
                    npc.quaternion.slerp(targetQuaternion, 0.1);

                    // Move the NPC away from the player at a fixed speed
                    npc.position.add(
                        directionVector.multiplyScalar(fixedSpeed)
                    );

                    // Yield control to allow smooth animation
                    await new Promise(requestAnimationFrame);
                }
            }
        }
    };

    npc.blockRotate = async function (angleInDegrees) {
        logState(`Rotating ${angleInDegrees} degrees`);
        // Store the current quaternion
        const currentQuaternion = npc.quaternion.clone();

        // Convert angle from degrees to radians
        const angleInRadians = THREE.MathUtils.degToRad(angleInDegrees);

        // Create a rotation quaternion based on the input angle
        const rotationQuaternion = new THREE.Quaternion();
        rotationQuaternion.setFromAxisAngle(
            new THREE.Vector3(0, 1, 0),
            angleInRadians
        ); // Rotate around the Y-axis

        // Calculate the target quaternion: current * rotation
        const targetQuaternion = currentQuaternion
            .clone()
            .multiply(rotationQuaternion);

        // Smoothly rotate towards the target quaternion
        const rotationSpeed = 0.1; // Adjust this for faster/slower rotation

        while (currentQuaternion.angleTo(targetQuaternion) > 0.01) {
            // Slerp towards the target quaternion
            currentQuaternion.slerp(targetQuaternion, rotationSpeed);
            npc.quaternion.copy(currentQuaternion);

            // Yield control to allow smooth animation
            await new Promise(requestAnimationFrame);
        }

        // Ensure the NPC ends up exactly at the target quaternion
        npc.quaternion.copy(targetQuaternion);
    };

    npc.blockRotateTarget = async function (direction, target) {
        logState(`Rotating ${direction} the ${target}`);
        if (direction === "towards") {
            if (target === "player") {
                while (true) {
                    // Calculate direction to the player
                    const directionVector = new THREE.Vector3()
                        .subVectors(player.position, npc.position)
                        .normalize();

                    // Smooth rotation
                    const targetQuaternion =
                        new THREE.Quaternion().setFromUnitVectors(
                            new THREE.Vector3(0, 0, 1),
                            directionVector
                        );
                    npc.quaternion.slerp(targetQuaternion, 0.1);

                    // Check if facing the player
                    if (npc.quaternion.angleTo(targetQuaternion) < 0.1) {
                        npc.swap(0);
                        break;
                    }

                    // Yield control to allow smooth animation
                    await new Promise(requestAnimationFrame);
                }
            }
        }

        if (direction === "away") {
            if (target === "player") {
                while (true) {
                    // Calculate direction away from the player
                    const directionVector = new THREE.Vector3()
                        .subVectors(npc.position, player.position)
                        .normalize();

                    // Smooth rotation
                    const targetQuaternion =
                        new THREE.Quaternion().setFromUnitVectors(
                            new THREE.Vector3(0, 0, 1),
                            directionVector
                        );
                    npc.quaternion.slerp(targetQuaternion, 0.1);

                    // Check if facing away from the player
                    if (npc.quaternion.angleTo(targetQuaternion) < 0.1) {
                        npc.swap(0);
                        break;
                    }

                    // Yield control to allow smooth animation
                    await new Promise(requestAnimationFrame);
                }
            }
        }
    };

    npc.blockIf = async function (character, action, statement_if) {
        if (character === "player") {
            switch (action) {
                case "nearby":
                    console.log("Checking if player is NEARBY");
                    logState("Checking if player is NEARBY");
                    if (
                        (await npc.position.distanceTo(player.position)) <=
                        distance
                    ) {
                        logState(`${character} is ${action}`);
                        // Execute the statement_if block if the condition is true
                        if (statement_if) {
                            await statement_if(); // Execute the statement as a function
                        }
                    }
                    break;
                case "idle":
                    console.log("Checking if player is IDLE");
                    logState("Checking if player is IDLE");
                    if ((await player.getCurrentAction()) == "idle") {
                        logState(`${character} is ${action}`);
                        if (statement_if) {
                            await statement_if(); // Execute the statement as a function
                        }
                    }
                    break;
                case "waving":
                    console.log("Checking if player is WAVING");
                    logState("Checking if player is WAVING");
                    if ((await player.getCurrentAction()) == "waving") {
                        logState(`${character} is ${action}`);
                        if (statement_if) {
                            await statement_if(); // Execute the statement as a function
                        }
                    }
                    break;
            }
        }
        if (character === "npc") {
            switch (action) {
                case "nearby":
                    // Handle NPC nearby case
                    break;
                case "idle":
                    // Handle NPC idle case
                    break;
                case "waving":
                    // Handle NPC waving case
                    break;
            }
        }
    };

    npc.blockIfElse = async function (
        character,
        action,
        statement_if,
        statement_else
    ) {
        if (character === "player") {
            switch (action) {
                case "nearby":
                    console.log("The PLAYER is NEARBY");
                    logState("The PLAYER is NEARBY");
                    if (
                        (await npc.position.distanceTo(player.position)) <=
                        distance
                    ) {
                        logState(`${character} is ${action}`);
                        // Execute the statement_if block if the condition is true
                        if (statement_if) {
                            await statement_if(); // Execute the statement as a function
                        }
                    } else {
                        if (statement_else) {
                            await statement_else();
                        }
                    }
                    break;
                case "idle":
                    console.log("The PLAYER is IDLE");
                    logState("The PLAYER is IDLE");
                    if ((await player.getCurrentAction()) == "idle") {
                        logState(`${character} is ${action}`);
                        if (statement_if) {
                            await statement_if(); // Execute the statement as a function
                        }
                    } else {
                        if (statement_else) {
                            await statement_else();
                        }
                    }
                    break;
                case "waving":
                    console.log("The PLAYER is WAVING");
                    logState("The PLAYER is WAVING");
                    if ((await player.getCurrentAction()) == "waving") {
                        logState(`${character} is ${action}`);
                        if (statement_if) {
                            await statement_if(); // Execute the statement as a function
                        }
                    } else {
                        if (statement_else) {
                            await statement_else();
                        }
                    }
                    break;
            }
        }
        if (character === "npc") {
            switch (action) {
                case "nearby":
                    // Handle NPC nearby case
                    break;
                case "idle":
                    // Handle NPC idle case
                    break;
                case "waving":
                    // Handle NPC waving case
                    break;
            }
        }
    };

    npc.animate = function () {
        requestAnimationFrame(npc.animate);
        const delta = clock.getDelta(); // Get time delta for animation
        npc.update(delta); // Update NPC animations based on Blockly actions
    };

    npc.blockRun = async function () {
        // await npcGroup.blockAction('wander', 5);
        // await npcGroup.blockAction('wave', 5);
    };

    npc.blockRun();

    function npcWander(duration) {
        const startTime = performance.now();
        let targetDirection = new THREE.Vector3(); // Current direction vector
        let isWandering = true;
        const changeDirectionInterval = 3; // Time in seconds before changing direction
        let lastChangeTime = 0; // Time since last direction change

        // Set a new random direction
        function setRandomDirection() {
            const angle = Math.random() * Math.PI * 2; // Random angle
            targetDirection
                .set(Math.cos(angle), 0, Math.sin(angle))
                .normalize();
        }

        // Update function
        function update() {
            const currentTime = performance.now();
            const elapsedTime = (currentTime - startTime) / 1000; // Convert to seconds
            const deltaTime = (currentTime - lastChangeTime) / 1000; // Time since last change

            if (elapsedTime < duration) {
                if (isWandering) {
                    // Move NPC in the target direction
                    npc.position.add(
                        targetDirection.clone().multiplyScalar(speed)
                    );

                    // Smoothly rotate towards the target direction
                    const targetRotation = Math.atan2(
                        targetDirection.x,
                        targetDirection.z
                    ); // Corrected
                    npc.rotation.y = THREE.MathUtils.lerp(
                        npc.rotation.y,
                        targetRotation,
                        0.1
                    ); // Smooth rotation

                    // Change direction every `changeDirectionInterval` seconds
                    if (deltaTime > changeDirectionInterval) {
                        setRandomDirection();
                        lastChangeTime = currentTime; // Reset last change time
                    }
                }

                requestAnimationFrame(update); // Continue updating
            } else {
                isWandering = false; // Stop wandering after duration
            }
        }

        setRandomDirection(); // Initialize the first direction
        lastChangeTime = performance.now(); // Initialize last change time
        update(); // Start the update loop
    }

    return npc;
}

export function logState(state) {
    const stateWindow = document.getElementById("updated-states");

    // Create a new paragraph element
    const newLog = document.createElement("p");
    newLog.textContent = state;

    // Append the new log to the state window
    stateWindow.appendChild(newLog);

    // Scroll to the bottom of the updated-states div
    stateWindow.scrollTop = stateWindow.scrollHeight;
}
