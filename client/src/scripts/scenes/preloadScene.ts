import { io } from "socket.io-client";

const SERVER_URL = "http://localhost:3001";
export const socket = io(SERVER_URL);

export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' })
  }

  preload() {
  }

  create() {
    socket.connect();
    
    this.scene.start('MainScene');
    
    // socket.on('gameState', (gameState) => {
    //   console.log('on game state', gameState)
    //   if(gameState.gameStatus === "waiting"){
    //    this.add.text(50, 100, "Waiting", { color: "#ff0000"});
    //   };
      
    //   if(gameState.gameStatus === "countdown"){
    //     this.add.text(100, 100, 'Your game will soon begin', { color: "#ff0000"});
    //   };
      
    //   if(gameState.gameStatus === "in-progress"){
    //     this.scene.start('MainScene')
    //   };
      
    //   if(gameState.gameStatus === "ended"){
    //     this.startNew = this.add.text(150, 100, "Start Over", { color: "#ff0000"});
    //     this.startNew.setInteractive();
        
    //     this.startNew.on('pointerdown', function () {
    //       socket.emit('newGame')
    //   })
       
    //   };
    // }

  }
}
