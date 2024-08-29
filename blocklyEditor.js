import * as Blockly from 'blockly/core';
import {javascriptGenerator, Order} from 'blockly/javascript';
import { createNPCGroup } from './npc';
import { scene } from './npcScene';
//import { player } from './player';
// Define workspace at a higher scope
const npc = createNPCGroup(scene);
let iterations;
let maxIterations;
let stopExecution = false; // Flag to control execution

// Initialize Blockly JavaScript generator
document.addEventListener('DOMContentLoaded', () => {
    initializeBlockly();
    // Add event listener to the play button after Blockly is initialized
    document.getElementById('play-button').addEventListener('click', runCode);
    document.getElementById('stop-button').addEventListener('click', stopCode);
    document.getElementById('reset-button').addEventListener('click', resetPosition);
});

let foreverChecked;
/* 
Generated Code: async function start() {  while (true) {
   if (false == true) {true == false;
   return false;
  }  await npc.blockAction("wave", 1);
  }

} start();
*/

let workspace;
function initializeBlockly() {
    workspace = Blockly.inject('blockly-div', {
        toolbox: `
            <xml>
                <block type="startBlock"></block>
                <block type="loopBlock"></block>
                <block type="actionBlock"></block>
                <block type="moveTargetBlock"></block>
                <block type="ifBlock"></block>
                <block type="ifElseBlock"></block>
                <block type="numberBlock"></block>
            </xml>
        `,
        grid: {
            spacing: 20,
            length: 3,
            colour: '#ccc',
            snap: true,
        },
        move: {
            scrollbars: {
                horizontal: true,
                vertical: true
            },
            drag: true,
            wheel: false
        },
        zoom: {
            controls: true,
            wheel: true,
            startScale: 1.0,
            maxScale: 1.5,
            minScale: 0.5,
            scaleSpeed: 1.25,
            pinch: true
        },
        trashcan: true,
        theme: {
            startHats: true,
        },
        renderer: 'thrasos'
    });

    workspace.setResizesEnabled(true);
    workspace.resize();

    var block = workspace.newBlock('startBlock');
    block.moveBy(10, 10);
    block.initSvg();
    block.render();
}

const startBlock = {
    init: function() {
      Blockly.utils.colour.setHsvSaturation(1);
      Blockly.utils.colour.setHsvValue(1);
      this.appendEndRowInput('START')
        .appendField('Start');
      this.appendStatementInput('DO');
      this.setTooltip('All of the blocks inside the Start block can get executed');
      this.setHelpUrl('');
      this.setColour(50);
      
    }
    
  };
  Blockly.common.defineBlocks({startBlock: startBlock});

  javascriptGenerator.forBlock['startBlock'] = function(block) {
    const statement_do = javascriptGenerator.statementToCode(block, 'DO');
  
    // TODO: Assemble javascript into the code variable.
    const code = `async function start() {\n\n${statement_do}\n\n} start(); npc.swap(0);`;
    return code;
  }

  const loopBlock = {
    init: function() {
        Blockly.utils.colour.setHsvSaturation(0.9);
        Blockly.utils.colour.setHsvValue(1);
        
        this.appendDummyInput()
            .appendField("Loop");

        this.appendDummyInput("FOREVER_INPUT")
            .appendField(new Blockly.FieldCheckbox("TRUE"), "FOREVER_CHECKBOX")
            .appendField("Forever");

        this.appendValueInput("LOOP_COUNT")
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField("How many times:")
            .setVisible(false); // Initially hidden

        this.appendStatementInput("DO")

        this.setColour(38);
        this.setTooltip('The Loop block is used to repeat blocks. (Uncheck "Forever" to specify how many times)');
        this.setHelpUrl('');
        this.setPreviousStatement(true);  // Allow connection above
        this.setNextStatement(true);      // Allow connection below

        // Event listener for checkbox
        this.getField('FOREVER_CHECKBOX').setValidator(this.toggleTimesInput.bind(this));
    },

    toggleTimesInput: function(value) {
        const isChecked = value === 'TRUE';
        this.getInput('LOOP_COUNT').setVisible(!isChecked); // Show/hide based on checkbox
        this.render(); // Re-render the block to update the UI
        return value;
    }
};

Blockly.common.defineBlocks({loopBlock: loopBlock});
javascriptGenerator.forBlock['loopBlock'] = function(block) {
    const foreverChecked = block.getFieldValue('FOREVER_CHECKBOX') === 'TRUE';
    const loopCount = javascriptGenerator.valueToCode(block, 'LOOP_COUNT', Order.ATOMIC) || '1';
    const statement_do = javascriptGenerator.statementToCode(block, 'DO');

    // Directly execute the loop without wrapping in a function
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

// Define the "Action" block
const actionBlock = {
    init: function() {
        Blockly.utils.colour.setHsvSaturation(0.7);
        Blockly.utils.colour.setHsvValue(1);
        this.setPreviousStatement(true, null);
        this.appendDummyInput('ACTION')
            .appendField('Action: ')
            .appendField(new Blockly.FieldDropdown([
                ['Wave', 'wave'],
                ['Wander', 'wander'],
                ['Idle', 'idle']
            ]), 'ACTION');
        this.appendValueInput('DURATION')
            .setCheck('Number')
            .appendField('Duration (seconds):');
        this.setNextStatement(true, null);
        this.setTooltip('Select an action for the NPC to perform with a specified time.');
        this.setHelpUrl('');
        this.setColour(215);
    }
};

Blockly.common.defineBlocks({ actionBlock: actionBlock });

javascriptGenerator.forBlock['actionBlock'] = function(block) {
    let action = block.getFieldValue('ACTION');
    let duration = javascriptGenerator.valueToCode(block, 'DURATION', Order.ATOMIC) || '1';
    
    // Return code that directly awaits the action
    const code = `if (!stopExecution) { await npc.blockAction("${action}", ${duration}); }\n`;
    return code;
};

const moveTargetBlock = {
    init: function() {
        Blockly.utils.colour.setHsvSaturation(0.7);
        Blockly.utils.colour.setHsvValue(1);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.appendDummyInput()
            .appendField('Move')
            .appendField(new Blockly.FieldDropdown([
                ['Towards', 'towards'],
                ['Away from', 'away']
            ]), 'DIRECTION')
            .appendField('the')
            .appendField(new Blockly.FieldDropdown([
                ['Player', 'player'],
                ['NPC', 'npc']
            ]), 'TARGET');
        this.setTooltip('Move the NPC towards or away from the specified target.');
        this.setHelpUrl('');
        this.setColour(215);
    }
};

Blockly.common.defineBlocks({ moveTargetBlock: moveTargetBlock });

javascriptGenerator.forBlock['moveTargetBlock'] = function(block) {
    const direction = block.getFieldValue('DIRECTION');
    const target = block.getFieldValue('TARGET');

    // Generate code to move the NPC
    const code = `if (!stopExecution) { await npc.blockMoveTarget("${direction}", "${target}"); }\n`;
    return code;
};

const ifBlock = {
    init: function() {
        Blockly.utils.colour.setHsvSaturation(0.9);
        Blockly.utils.colour.setHsvValue(1);
      this.appendEndRowInput('as')
        .appendField('If')
        .appendField(new Blockly.FieldDropdown([
            ['Player', 'player'],
            ['NPC', 'npc']
          ]), 'CHARACTER')
        .appendField('is')
        .appendField(new Blockly.FieldDropdown([
            ['Nearby', 'nearby'],
            ['Idle', 'idle'],
            ['Waving', 'waving']
          ]), 'ACTION');
      this.appendStatementInput('IF');
      this.setInputsInline(false)
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setTooltip('The If block helps you set conditions for your NPC to perform certain actions.');
      this.setHelpUrl('');
      this.setColour(38);
    }
  };
  Blockly.common.defineBlocks({ifBlock: ifBlock});

  javascriptGenerator.forBlock['ifBlock'] = function(block) {
    const character = block.getFieldValue('CHARACTER');
    const action = block.getFieldValue('ACTION');
  
    const statement_if = javascriptGenerator.statementToCode(block, 'IF');
  
    // Assemble JavaScript code as an async function
    const code = `await npc.blockIf("${character}", "${action}", async () => { ${statement_if} });`;
    return code;
}

const ifElseBlock = {
    init: function() {
        Blockly.utils.colour.setHsvSaturation(0.9);
        Blockly.utils.colour.setHsvValue(1);
        this.appendEndRowInput('as')
            .appendField('If')
            .appendField(new Blockly.FieldDropdown([
                ['Player', 'player'],
                ['NPC', 'npc']
            ]), 'CHARACTER')
            .appendField('is')
            .appendField(new Blockly.FieldDropdown([
                ['Nearby', 'nearby'],
                ['Idle', 'idle'],
                ['Waving', 'waving']
            ]), 'ACTION');
        this.appendStatementInput('IF');
        this.appendDummyInput().appendField('else');
        this.appendStatementInput('ELSE');
        this.setInputsInline(false);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setTooltip('The If Else block helps you set conditions for your NPC to perform certain actions as well as make exceptions');
        this.setHelpUrl('');
        this.setColour(38);
    }
};
Blockly.common.defineBlocks({ifElseBlock: ifElseBlock});

javascriptGenerator.forBlock['ifElseBlock'] = function(block) {
    const character = block.getFieldValue('CHARACTER');
    const action = block.getFieldValue('ACTION');
  
    const statement_if = javascriptGenerator.statementToCode(block, 'IF');
    const statement_else = javascriptGenerator.statementToCode(block, 'ELSE');

    // Assemble JavaScript code as an async function
    const code = `await npc.blockIfElse("${character}", "${action}", async () => { ${statement_if} }, async () => { ${statement_else} });`;
    return code;
}
  

  const numberBlock = {
    init: function() {
        Blockly.utils.colour.setHsvSaturation(0.9);
        Blockly.utils.colour.setHsvValue(1);
        this.setOutput(true, null);
        this.appendDummyInput()
            .appendField("Number:")
            .appendField(new Blockly.FieldNumber(0, 0, 1000, 0.1), "NUMBER");

        this.appendDummyInput("RANDOM_INPUT")
            .appendField("Random")
            .appendField(new Blockly.FieldCheckbox("FALSE"), "RANDOM_CHECKBOX")
            .setAlign(Blockly.ALIGN_RIGHT);

        this.appendDummyInput("MIN_MAX_INPUT")
            .appendField("Minimum:")
            .appendField(new Blockly.FieldNumber(0, 0, 1000, 0.1), "MIN_VALUE")
            .appendField("Maximum:")
            .appendField(new Blockly.FieldNumber(0, 0, 1000, 0.1), "MAX_VALUE")
            .setVisible(false); // Initially hidden

        this.setColour(30);
        this.setTooltip('');
        this.setHelpUrl('');

        // Event listener for checkbox
        this.getField('RANDOM_CHECKBOX').setValidator(this.toggleMinMax.bind(this));
    },

    toggleMinMax: function(value) {
        const isChecked = value === 'TRUE';
        this.getInput('MIN_MAX_INPUT').setVisible(isChecked);
        this.getField('NUMBER').setVisible(!isChecked); // Hide number input if checkbox is checked
        this.render(); // Re-render the block to update the UI
        return value;
    }
};

Blockly.common.defineBlocks({numberBlock: numberBlock});

javascriptGenerator.forBlock['numberBlock'] = function(block) {
    const numberValue = block.getFieldValue('NUMBER');
    const randomChecked = block.getFieldValue('RANDOM_CHECKBOX') === 'TRUE';
    const minValue = block.getFieldValue('MIN_VALUE');
    const maxValue = block.getFieldValue('MAX_VALUE');

    // Assemble JavaScript into the code variable.
    let code;
    if (randomChecked) {
        code = `Math.round((Math.random() * (${maxValue} - ${minValue}) + ${minValue}) * 10) / 10\n`;
    } else {
        code = `${numberValue}`;
    }

    return [code, Order.NONE];
};

let isActionExecuted = false; // Flag to track if an action is executed

async function runCode() {
    stopExecution = false; // Reset the flag
    npc.reset();
    javascriptGenerator.addReservedWords('code');

    const startBlock = workspace.getAllBlocks().find(block => block.type === 'startBlock');

    if (!startBlock) {
        console.warn("No Start Block found. Please add a Start Block.");
        alert("Warning: No Start Block found. Please add a Start Block.");
        return;
    }

    const connectedBlocks = startBlock.getInput('DO').connection.targetBlock();
    if (!connectedBlocks) {
        console.warn("No blocks connected to Start Block. Please connect an action block.");
        alert("Warning: No blocks connected to Start Block. Please connect a block to the Start block.");
        return;
    }

    let loopBlocks = workspace.getAllBlocks().filter(block => block.type === 'loopBlock');
    for (let loopBlock of loopBlocks) {
        const innerConnectedBlocks = loopBlock.getInput('DO').connection.targetBlock();
        if (!innerConnectedBlocks) {
            console.warn("No blocks connected to Loop Block. Stopping execution.");
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

// Example of how to set isActionExecuted during an action
function executeAction() {
    isActionExecuted = true;
    // Perform the action logic here
}

async function stopCode() {
    console.warn("Reset initiated. Waiting for current block to finish executing...");
    stopExecution = true; // Set the flag to stop execution
}

async function resetPosition() {
    npc.reset();
}

npc.animate();
