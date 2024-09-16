import * as Blockly from "blockly/core";
import { javascriptGenerator, Order } from "blockly/javascript";
import { FieldMultilineInput } from "@blockly/field-multilineinput";
import { createNPCGroup } from "./npc";
import { scene } from "./npcScene";

let workspace;
// Define workspace at a higher scope
const npc = createNPCGroup(scene);
let stopExecution = false; // Flag to control execution

let lastFrameTime = performance.now();
let frameCount = 0;
let fps = 0;

const eventColour = "#ffd400";
const logicColour = "#ffab1a";
const activityColour = "#4d97ff";
const inputColour = "#ff9f1a";
const outputColour = "#9966ff";

// Initialize Blockly JavaScript generator
document.addEventListener("DOMContentLoaded", () => {
    initializeBlockly();

    // Add event listener to the play button after Blockly is initialized
    document.getElementById("play-button").addEventListener("click", runCode);
    document.getElementById("stop-button").addEventListener("click", stopCode);
    document
        .getElementById("reset-button")
        .addEventListener("click", resetPosition);

    // Storage for saved states
    const savedStates = {};

    // Modal handling
    const saveModal = document.getElementById("save-modal");
    const behaviourNameInput = document.getElementById("behaviour-name");
    const modalSaveButton = document.getElementById("modal-save-button");
    const modalCancelButton = document.getElementById("modal-cancel-button");
    const closeButton = document.querySelector(".close-button");

    // Show modal when save button is clicked
    document.getElementById("save-button").addEventListener("click", () => {
        saveModal.style.display = "block";
    });

    // Save action
    modalSaveButton.addEventListener("click", () => {
        const behaviourName = behaviourNameInput.value;
        if (behaviourName) {
            const state = Blockly.serialization.workspaces.save(workspace);
            const sanitizedName = behaviourName
                .toLowerCase()
                .replace(/\s+/g, "_");

            // Save the state in the object
            savedStates[sanitizedName] = state;

            // Add the option to the dropdown
            const dropdown = document.getElementById("behaviour-dropdown");
            const newOption = document.createElement("option");
            newOption.value = sanitizedName; // Use sanitized name as value
            newOption.textContent = behaviourName;
            dropdown.appendChild(newOption);
            saveModal.style.display = "none"; // Hide modal after saving
            behaviourNameInput.value = ""; // Clear input
        }
    });

    // Cancel action
    modalCancelButton.addEventListener("click", () => {
        saveModal.style.display = "none"; // Hide modal
        behaviourNameInput.value = ""; // Clear input
    });

    // Close modal when close button is clicked
    closeButton.addEventListener("click", () => {
        saveModal.style.display = "none"; // Hide modal
    });

    // Close modal when clicking outside of it
    window.addEventListener("click", (event) => {
        if (event.target === saveModal) {
            saveModal.style.display = "none"; // Hide modal
        }
    });

    // Add event listener for dropdown selection
    document
        .getElementById("behaviour-dropdown")
        .addEventListener("change", (event) => {
            const selectedValue = event.target.value;
            const stateToLoad = savedStates[selectedValue];

            if (stateToLoad) {
                Blockly.serialization.workspaces.load(stateToLoad, workspace);
            }
        });
});

function initializeBlockly() {
    workspace = Blockly.inject("blockly-div", {
        toolbox: `
            <xml>
                <category name="Event" colour="${eventColour}">
                    <block type="startBlock"></block>
                </category>
                <category name="Logic" colour="${logicColour}">
                    <block type="loopBlock"></block>
                    <block type="ifBlock"></block>
                    <block type="ifElseBlock"></block>
                </category>
                <category name="Activity" colour="${activityColour}">
                    <block type="actionBlock"></block>
                    <block type="moveBlock"></block>
                    <block type="moveTargetBlock"></block>
                    <block type="rotateBlock"></block>
                    <block type="rotateTargetBlock"></block>
                </category>
                <category name="Input" colour="${inputColour}">
                    <block type="numberBlock"></block>
                    <block type="textBlock"></block>
                </category>
                <category name="Output" colour="${outputColour}">
                    <block type="showTextBlock"></block>
                </category>
            </xml>
        `,
        grid: {
            spacing: 20,
            length: 3,
            colour: "#ccc",
            snap: true,
        },
        move: {
            scrollbars: {
                horizontal: true,
                vertical: true,
            },
            drag: true,
            wheel: false,
        },
        zoom: {
            controls: true,
            wheel: true,
            startScale: 1.0,
            maxScale: 1.5,
            minScale: 0.5,
            scaleSpeed: 1.25,
            pinch: true,
        },
        trashcan: true,
        theme: {
            startHats: true,
        },
        renderer: "thrasos",
    });

    workspace.setResizesEnabled(true);
    workspace.resize();

    var block = workspace.newBlock("startBlock");
    block.moveBy(
        workspace.getWidth() / 2 - 50,
        workspace.toolbox_.getHeight() / 2 - 50
    );
    block.initSvg();
    block.render();
}

const startBlock = {
    init: function () {
        this.appendEndRowInput("START").appendField("Start");
        this.appendStatementInput("DO");
        this.setTooltip(
            "All of the blocks inside the Start block can get executed"
        );
        this.setHelpUrl("");
        this.setColour(eventColour);
    },
};
Blockly.common.defineBlocks({ startBlock: startBlock });

javascriptGenerator.forBlock["startBlock"] = function (block) {
    const statement_do = javascriptGenerator.statementToCode(block, "DO");

    const code = `async function start() {\n\n${statement_do}\n\n} start(); npc.swap(0);`;
    return code;
};

const loopBlock = {
    init: function () {
        this.appendDummyInput().appendField("Loop");

        this.appendDummyInput("FOREVER_INPUT")
            .appendField(new Blockly.FieldCheckbox("TRUE"), "FOREVER_CHECKBOX")
            .appendField("Forever");

        this.appendValueInput("LOOP_COUNT")
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField("How many times:")
            .setVisible(false); // Initially hidden

        this.appendStatementInput("DO");

        this.setColour(logicColour);
        this.setTooltip(
            'The Loop block is used to repeat blocks. (Uncheck "Forever" to specify how many times)'
        );
        this.setHelpUrl("");
        this.setPreviousStatement(true); // Allow connection above
        this.setNextStatement(true); // Allow connection below

        // Event listener for checkbox
        this.getField("FOREVER_CHECKBOX").setValidator(
            this.toggleTimesInput.bind(this)
        );
    },

    toggleTimesInput: function (value) {
        const isChecked = value === "TRUE";
        this.getInput("LOOP_COUNT").setVisible(!isChecked); // Show/hide based on checkbox
        this.render(); // Re-render the block to update the UI
        return value;
    },
};

Blockly.common.defineBlocks({ loopBlock: loopBlock });
javascriptGenerator.forBlock["loopBlock"] = function (block) {
    const foreverChecked = block.getFieldValue("FOREVER_CHECKBOX") === "TRUE";
    const loopCount =
        javascriptGenerator.valueToCode(block, "LOOP_COUNT", Order.ATOMIC) ||
        "1";
    const statement_do = javascriptGenerator.statementToCode(block, "DO");
    const randomValue = Math.random() * 100;
    if (foreverChecked) {
        return `while (!stopExecution) {
            ${statement_do}
            await new Promise(resolve => setTimeout(resolve, 0)); // Yield control to prevent crashes
        }\n`;
    } else {
        return `for (let i = 0; i < ${loopCount} && !stopExecution; i++) {
            ${statement_do}
            await new Promise(resolve => setTimeout(resolve, 0)); // Yield control to prevent crashes
        }\n`;
    }
};

const ifBlock = {
    init: function () {
        this.appendEndRowInput("as")
            .appendField("If")
            .appendField(
                new Blockly.FieldDropdown([
                    ["Player", "player"],
                    ["NPC", "npc"],
                ]),
                "CHARACTER"
            )
            .appendField("is")
            .appendField(
                new Blockly.FieldDropdown([
                    ["Nearby", "nearby"],
                    ["Idle", "idle"],
                    ["Waving", "waving"],
                ]),
                "ACTION"
            );
        this.appendStatementInput("IF");
        this.setInputsInline(false);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setTooltip(
            "The If block helps you set conditions for your NPC to perform certain actions."
        );
        this.setHelpUrl("");
        this.setColour(logicColour);
    },
};
Blockly.common.defineBlocks({ ifBlock: ifBlock });

javascriptGenerator.forBlock["ifBlock"] = function (block) {
    const character = block.getFieldValue("CHARACTER");
    const action = block.getFieldValue("ACTION");

    const statement_if = javascriptGenerator.statementToCode(block, "IF");

    // Assemble JavaScript code as an async function
    const code = `await npc.blockIf("${character}", "${action}", async () => { ${statement_if} });`;
    return code;
};

const ifElseBlock = {
    init: function () {
        this.appendEndRowInput("as")
            .appendField("If")
            .appendField(
                new Blockly.FieldDropdown([
                    ["Player", "player"],
                    ["NPC", "npc"],
                ]),
                "CHARACTER"
            )
            .appendField("is")
            .appendField(
                new Blockly.FieldDropdown([
                    ["Nearby", "nearby"],
                    ["Idle", "idle"],
                    ["Waving", "waving"],
                ]),
                "ACTION"
            );
        this.appendStatementInput("IF");
        this.appendDummyInput().appendField("else");
        this.appendStatementInput("ELSE");
        this.setInputsInline(false);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setTooltip(
            "The If Else block helps you set conditions for your NPC to perform certain actions as well as make exceptions"
        );
        this.setHelpUrl("");
        this.setColour(logicColour);
    },
};
Blockly.common.defineBlocks({ ifElseBlock: ifElseBlock });

javascriptGenerator.forBlock["ifElseBlock"] = function (block) {
    const character = block.getFieldValue("CHARACTER");
    const action = block.getFieldValue("ACTION");

    const statement_if = javascriptGenerator.statementToCode(block, "IF");
    const statement_else = javascriptGenerator.statementToCode(block, "ELSE");

    // Assemble JavaScript code as an async function
    const code = `await npc.blockIfElse("${character}", "${action}", async () => { ${statement_if} }, async () => { ${statement_else} });`;
    return code;
};

// Define the "Action" block
const actionBlock = {
    init: function () {
        this.setPreviousStatement(true, null);
        this.appendDummyInput("ACTION")
            .appendField("Action: ")
            .appendField(
                new Blockly.FieldDropdown([
                    ["Wave", "wave"],
                    ["Wander", "wander"],
                    ["Idle", "idle"],
                ]),
                "ACTION"
            );
        this.appendValueInput("DURATION")
            .setCheck("Number")
            .appendField("Duration (seconds):");
        this.setNextStatement(true, null);
        this.setTooltip(
            "Select an action for the NPC to perform with a specified time."
        );
        this.setHelpUrl("");
        this.setColour(activityColour);
    },
};

Blockly.common.defineBlocks({ actionBlock: actionBlock });

javascriptGenerator.forBlock["actionBlock"] = function (block) {
    let action = block.getFieldValue("ACTION");
    let duration =
        javascriptGenerator.valueToCode(block, "DURATION", Order.ATOMIC) || "1";

    // Return code that directly awaits the action
    const code = `if (!stopExecution) { await npc.blockAction("${action}", ${duration}); }\n`;
    return code;
};

const moveBlock = {
    init: function () {
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.appendValueInput("DISTANCE")
            .setCheck("Number")
            .appendField("Move forward by");
        this.setTooltip("Move forward by the specified number of units.");
        this.setHelpUrl("");
        this.setColour(activityColour);
    },
};

// Define the block in Blockly
Blockly.common.defineBlocks({ moveBlock });

// Generate JavaScript code for the block
javascriptGenerator.forBlock["moveBlock"] = function (block) {
    const distance =
        javascriptGenerator.valueToCode(
            block,
            "DISTANCE",
            javascriptGenerator.ORDER_ATOMIC
        ) || "1";

    // Generate code to move forward
    const code = `if (!stopExecution) { await npc.blockMove(${distance}); }\n`;
    return code;
};

const moveTargetBlock = {
    init: function () {
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.appendDummyInput()
            .appendField("Move")
            .appendField(
                new Blockly.FieldDropdown([
                    ["Towards", "towards"],
                    ["Away from", "away"],
                ]),
                "DIRECTION"
            )
            .appendField("the")
            .appendField(
                new Blockly.FieldDropdown([
                    ["Player", "player"],
                    ["NPC", "npc"],
                ]),
                "TARGET"
            );
        this.setTooltip(
            "Move the NPC towards or away from the specified target."
        );
        this.setHelpUrl("");
        this.setColour(activityColour);
    },
};

Blockly.common.defineBlocks({ moveTargetBlock: moveTargetBlock });

javascriptGenerator.forBlock["moveTargetBlock"] = function (block) {
    const direction = block.getFieldValue("DIRECTION");
    const target = block.getFieldValue("TARGET");

    // Generate code to move the NPC
    const code = `if (!stopExecution) { await npc.blockMoveTarget("${direction}", "${target}"); }\n`;
    return code;
};

const rotateBlock = {
    init: function () {
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.appendValueInput("UNIT")
            .setCheck("Number")
            .appendField("Rotate by (degrees)");
        this.setTooltip("Rotate by the specified number of units.");
        this.setHelpUrl("");
        this.setColour(activityColour);
    },
};

// Define the block in Blockly
Blockly.common.defineBlocks({ rotateBlock });

// Generate JavaScript code for the block
javascriptGenerator.forBlock["rotateBlock"] = function (block) {
    const unit =
        javascriptGenerator.valueToCode(
            block,
            "UNIT",
            javascriptGenerator.ORDER_ATOMIC
        ) || "0";

    // Generate code to move forward
    const code = `if (!stopExecution) { await npc.blockRotate(${unit}); }\n`;
    return code;
};

const rotateTargetBlock = {
    init: function () {
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.appendDummyInput()
            .appendField("Rotate")
            .appendField(
                new Blockly.FieldDropdown([
                    ["Towards", "towards"],
                    ["Away from", "away"],
                ]),
                "DIRECTION"
            )
            .appendField("the")
            .appendField(
                new Blockly.FieldDropdown([
                    ["Player", "player"],
                    ["NPC", "npc"],
                ]),
                "TARGET"
            );
        this.setTooltip(
            "Rotate the NPC towards or away from the specified target."
        );
        this.setHelpUrl("");
        this.setColour(activityColour);
    },
};

Blockly.common.defineBlocks({ rotateTargetBlock: rotateTargetBlock });

javascriptGenerator.forBlock["rotateTargetBlock"] = function (block) {
    const direction = block.getFieldValue("DIRECTION");
    const target = block.getFieldValue("TARGET");

    // Generate code to rotate the NPC
    const code = `if (!stopExecution) { await npc.blockRotateTarget("${direction}", "${target}"); }\n`;
    return code;
};

const numberBlock = {
    init: function () {
        this.setOutput(true, null);
        this.appendDummyInput()
            .appendField("Number:")
            .appendField(
                new Blockly.FieldNumber(0, -1000, 1000, 0.1),
                "NUMBER"
            );

        this.appendDummyInput("RANDOM_INPUT")
            .appendField("Random")
            .appendField(new Blockly.FieldCheckbox("FALSE"), "RANDOM_CHECKBOX")
            .setAlign(Blockly.ALIGN_RIGHT);

        this.appendDummyInput("MIN_MAX_INPUT")
            .appendField("Minimum:")
            .appendField(
                new Blockly.FieldNumber(0, -1000, 1000, 0.1),
                "MIN_VALUE"
            )
            .appendField("Maximum:")
            .appendField(
                new Blockly.FieldNumber(0, -1000, 1000, 0.1),
                "MAX_VALUE"
            )
            .setVisible(false); // Initially hidden

        this.setTooltip("");
        this.setHelpUrl("");
        this.setColour(inputColour);

        // Event listener for checkbox
        this.getField("RANDOM_CHECKBOX").setValidator(
            this.toggleMinMax.bind(this)
        );
    },

    toggleMinMax: function (value) {
        const isChecked = value === "TRUE";
        this.getInput("MIN_MAX_INPUT").setVisible(isChecked);
        this.getField("NUMBER").setVisible(!isChecked); // Hide number input if checkbox is checked
        this.render(); // Re-render the block to update the UI
        return value;
    },
};

Blockly.common.defineBlocks({ numberBlock: numberBlock });

javascriptGenerator.forBlock["numberBlock"] = function (block) {
    const numberValue = block.getFieldValue("NUMBER");
    const randomChecked = block.getFieldValue("RANDOM_CHECKBOX") === "TRUE";
    const minValue = block.getFieldValue("MIN_VALUE");
    const maxValue = block.getFieldValue("MAX_VALUE");

    // Assemble JavaScript into the code variable.
    let code;
    if (randomChecked) {
        code = `Math.round((Math.random() * (${maxValue} - ${minValue}) + ${minValue}) * 10) / 10\n`;
    } else {
        code = `${numberValue}`;
    }

    return [code, Order.NONE];
};

const textBlock = {
    init: function () {
        this.setOutput(true, null);
        this.appendDummyInput()
            .appendField("Text:")
            .appendField(new FieldMultilineInput("Enter text here."), "TEXT");
        this.setTooltip("Displays the entered text");
        this.setHelpUrl("");
        this.setColour(inputColour);
    },
};

Blockly.common.defineBlocks({ textBlock: textBlock });

javascriptGenerator.forBlock["textBlock"] = function (block) {
    const text = block.getFieldValue("TEXT");

    // Assemble JavaScript code to display the text.
    const code = `${text}`;
    return code;
};

const showTextBlock = {
    init: function () {
        this.appendValueInput("CONTENT").appendField("Show");
        this.setPreviousStatement(true);
        this.setNextStatement(true);
        this.setTooltip("Displays text");
        this.setHelpUrl("");
        this.setColour(outputColour);
    },
};

Blockly.common.defineBlocks({ showTextBlock: showTextBlock });

javascriptGenerator.forBlock["showTextBlock"] = function (block) {
    const content = javascriptGenerator.valueToCode(block, "CONTENT");

    // Assemble JavaScript code to display the text.
    const code = `console.log("${content}");\n`;
    return code;
};

async function runCode() {
    stopExecution = false; // Reset the flag
    npc.reset();
    javascriptGenerator.addReservedWords("code");

    const startBlock = workspace
        .getAllBlocks()
        .find((block) => block.type === "startBlock");

    if (!startBlock) {
        console.warn("No Start Block found. Please add a Start Block.");
        alert("Warning: No Start Block found. Please add a Start Block.");
        return;
    }

    const connectedBlocks = startBlock.getInput("DO").connection.targetBlock();
    if (!connectedBlocks) {
        console.warn(
            "No blocks connected to Start Block. Please connect an action block."
        );
        alert(
            "Warning: No blocks connected to Start Block. Please connect a block to the Start block."
        );
        return;
    }

    let loopBlocks = workspace
        .getAllBlocks()
        .filter((block) => block.type === "loopBlock");
    for (let loopBlock of loopBlocks) {
        const innerConnectedBlocks = loopBlock
            .getInput("DO")
            .connection.targetBlock();
        if (!innerConnectedBlocks) {
            console.warn(
                "No blocks connected to Loop Block. Stopping execution."
            );
            stopCode(); // Call reset if no blocks are connected
            return;
        }
    }

    let code = javascriptGenerator.workspaceToCode(Blockly.getMainWorkspace());
    console.log("Generated Code:\n", code); // Log generated code

    if (code) {
        try {
            await eval(code); // Execute the generated code
        } catch (error) {
            console.error("Execution Error:", error);
        }
    } else {
        console.warn("No executable code generated.");
    }
}

async function stopCode() {
    console.warn(
        "Reset initiated. Waiting for current block to finish executing..."
    );
    stopExecution = true; // Set the flag to stop execution
}

async function resetPosition() {
    npc.reset();
}

function getFPS() {
    requestAnimationFrame(getFPS);

    const currentTime = performance.now();
    frameCount++;

    // Calculate FPS every second
    if (currentTime - lastFrameTime >= 1000) {
        fps = frameCount;
        frameCount = 0;
        lastFrameTime = currentTime;
        return fps;
    }
}

npc.animate();
