// npc.js
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { scene } from './npcScene';
import { action, player } from './player';
action

let isMoving = false;
let speed = 0.025;
let targetRotation = new THREE.Vector3();
let chanceOfIdle = 40;
let lookAroundTime = 0; // Timer for looking around
const maxLookAroundDuration = 3; // Max duration to look around (in seconds)

export function createNPCGroup(scene) {
    const npc = new THREE.Group();
    npc.position.y = 1.150; 
    scene.add(npc);

    const defaultPosition = npc.position;

    const loader = new GLTFLoader();
    const models = ['avatar_Idle.glb', 'avatar_Walk.glb', 'avatar_Waving.glb'];
    const animations = [];
    const avatars = [];

    const clock = new THREE.Clock();

    models.forEach((model, index) => {
        loader.load(`assets/${model}`, function (gltf) {
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
        }, undefined, function (error) {
            console.error(`Error loading model ${model}:`, error);
        });
    });

    npc.update = function (delta) {
        animations.forEach(mixer => mixer.update(delta));
    };

    npc.swap = function (index) {
        avatars.forEach((avatar, i) => {
            if (avatar) {
                avatar.visible = (i === index); 
            }
        });
    };

    // Function to get the index of the currently visible model
    npc.getCurrentAction = function () {
        for (let i = 0; i < avatars.length; i++) {
            if (avatars[i] && avatars[i].visible) {
                switch (i) {
                    case 0: return "idle"; break;
                    case 1: return "wandering"; break;
                    case 2: return "waving"; break;
                }
            }
        }
        return -1; // Return -1 if no model is visible
    };

    function hideAllModels() {
        npc.traverse(child => {
            if (child.isMesh) {
                child.visible = false; 
            }
        });
    }

    npc.reset = function () {
        npc.position.copy(new THREE.Vector3(0, npc.position.y, 0));
        npc.rotation.set(0, 0, 0); // Reset rotation
        npc.swap(0);
    }

    // Blocks
    
    npc.blockAction = async function (action, duration) {
        console.log(`Performing ${action.toUpperCase()} action`);
    
        // Immediately swap to the specified action
        switch (action) {
            case 'wave':
                setTimeout(() => {
                    npc.swap(2);
                }, 1);
                break;
            case 'wander':
                setTimeout(() => {
                    npc.swap(1);
                }, 1);
                npcWander(duration);
                break;
            case 'idle':
                setTimeout(() => {
                    npc.swap(0);
                }, 1);
                break; // Exit if idle
            default:
                console.log(`Unknown action: ${action.toUpperCase()}`);
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
                console.log(`${action.toUpperCase()} action was performed for ${Math.round(elapsedTime / 1000 * 10) / 10} second(s)`);
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
        await new Promise(resolve => {
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

    npc.blockMoveTarget = async function (direction, target) {
        setTimeout(() => {
            npc.swap(1);
        }, 1);
        if (direction == "towards") {
            if (target == "player") {
                while (true) {
                    // Calculate direction to the player
                    const directionVector = new THREE.Vector3().subVectors(player.position, npc.position).normalize();
                
                    // Create a quaternion representing the desired rotation
                    const targetQuaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), directionVector);
                    
                    // Smoothly interpolate the current quaternion towards the target quaternion
                    npc.quaternion.slerp(targetQuaternion, 0.1); // Adjust the factor for smoother rotation

                    if (npc.position.distanceTo(player.position) < 4) {
                        npc.swap(0);
                        break;
                    }
                
                    // Move the NPC towards the player
                    npc.position.lerp(player.position, 0.015);
                
                    // Yield control to allow smooth animation
                    await new Promise(requestAnimationFrame);
                }
            }
        }
        if (direction == "away") {
            if (target == "player") {
                while (true) {
                    // Calculate direction away from the player
                    const directionVector = new THREE.Vector3().subVectors(npc.position, player.position).normalize();
                    
                    // Create a quaternion to face away from the player
                    const targetQuaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), directionVector);
                    
                    // Smoothly interpolate the current quaternion towards the target quaternion
                    npc.quaternion.slerp(targetQuaternion, 0.1); // Adjust the factor for smoother rotation
                
                    // Smooth movement away from the player
                    npc.position.lerp(npc.position.clone().add(directionVector), 0.05);
                
                    // Stop if far enough
                    if (npc.position.distanceTo(player.position) > 10) {
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
                    if (await npc.position.distanceTo(player.position) <= 5) {
                        console.log("Checking if player is NEARBY");
                        // Execute the statement_if block if the condition is true
                        if (statement_if) {
                            await statement_if(); // Execute the statement as a function
                        }
                    }
                    break;
                case "idle":
                    if (await player.getCurrentAction() == "idle") {
                        console.log("Checking if player is IDLE");
                        if (statement_if) {
                            await statement_if(); // Execute the statement as a function
                        }
                    }
                    break;
                case "waving":
                    if (await player.getCurrentAction() == "waving") {
                        console.log("Checking if player is WAVING");
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
    }

    npc.blockIfElse = async function (character, action, statement_if, statement_else) {
        if (character === "player") {
            switch (action) {
                case "nearby":
                    if (await npc.position.distanceTo(player.position) <= 5) {
                        // Execute the statement_if block if the condition is true
                        if (statement_if) {
                            await statement_if(); // Execute the statement as a function
                        }
                    }
                    else {
                        if (statement_else) {
                            await statement_else();
                        }
                    }
                    break;
                case "idle":
                    if (await player.getCurrentAction() == "idle") {
                        console.log("sandkansdk")
                        if (statement_if) {
                            await statement_if(); // Execute the statement as a function
                        }
                    }
                    else {
                        if (statement_else) {
                            await statement_else();
                        }
                    }
                    break;
                case "waving":
                    if (await player.getCurrentAction() == "waving") {
                        console.log("sandkansdk")
                        if (statement_if) {
                            await statement_if(); // Execute the statement as a function
                        }
                    }
                    else {
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
    }

    npc.animate = function () {
        requestAnimationFrame(npc.animate);
        const delta = clock.getDelta(); // Get time delta for animation
        npc.update(delta); // Update NPC animations based on Blockly actions
    }

    npc.blockRun = async function () {
        // await npcGroup.blockAction('wander', 5);
        // await npcGroup.blockAction('wave', 5);
    };
    
    npc.blockRun();

    function npcWander(duration) {
        const startTime = performance.now();
        const speed = 0.03; // Speed for smooth movement
        let targetDirection = new THREE.Vector3(); // Current direction vector
        let isWandering = true;
        
        // Set a new random direction
        function setRandomDirection() {
            const angle = Math.random() * Math.PI * 2; // Random angle
            targetDirection.set(Math.cos(angle), 0, Math.sin(angle)).normalize();
        }
    
        // Update function
        function update() {
            const currentTime = performance.now();
            const elapsedTime = (currentTime - startTime) / 1000; // Convert to seconds
    
            if (elapsedTime < duration) {
                if (isWandering) {
                    // Move NPCs in the target direction
                    npc.position.add(targetDirection.clone().multiplyScalar(speed));
    
                    // Smoothly rotate towards the target direction
                    const targetRotation = Math.atan2(targetDirection.x, targetDirection.z);
                    npc.rotation.y = THREE.MathUtils.lerp(npc.rotation.y, targetRotation, 0.05); // Smooth rotation
    
                    // Randomly change direction
                    if (Math.random() < 0.01) {
                        setRandomDirection();
                    }
                }
    
                requestAnimationFrame(update); // Continue updating
            } else {
                isWandering = false; // Stop wandering after duration
            }
        }
    
        setRandomDirection(); // Initialize the first direction
        update(); // Start the update loop
    }
    

    return npc;
}
