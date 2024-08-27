# ThreeJS NPC Creator
A program to create NPC state machines using Blockly integrated with ThreeJS.
## Getting Started
The following instructions should be able to get the program hosted on your machine locally.
### Prerequisites
NodeJS was used to deploy this project originally however you may get it to work with other frameworks.
### Installing
Download or clone this repository and the Blockly repository and run the following commands on the terminal.
#### 1. NPM
```
npm install
```
#### 3. Install ThreeJS
```
npm install --save three
```
#### 3. Install vite
```
npm install vite
```
#### 4. Deploy
```
npx vite
```
You should get a local host link to host the program.
## How does it work?
### ThreeJS Scene
Currently an NPC and a Player is placed in the scene for testing purposes, More can be added inside the npcScene.js
### Blockly Workspace
More blocks can be added via the blocklyEditor.js. Blockly is being used here  however there are a few HTML elements:
* Play button - Executes the blocks inside the start block
* Stop button - Stops the code after the execution of the current block
* Reset button - Resets the position of the NPC
### NPC
More functions can be added inside the npc.js that are imported to blocklyEditor.js to make the blocks work.
## Sample images for reference
First Look:
![Image](https://github.com/user-attachments/assets/7960b137-71e0-41b3-9fd9-32520675c0a4)
Working sample(Character with the Yellow cursor is a "Player")
![npccreatorsample](https://github.com/user-attachments/assets/7f26d13c-bb05-42c5-b45c-38ca031de379)
## Built With
* [ThreeJS](https://github.com/mrdoob/three.js) - A Javascript 3D library
* [Blockly](https://github.com/google/blockly) - A Block-based Visual Programming library
## License
This project is licensed under the MIT License - see the LICENSE file for details.
