import { socket } from './preloadScene';

export default class GameOverScene extends Phaser.Scene {
  private startOverText: Phaser.GameObjects.Text;
  private winnerId: string
  
  constructor() {
    super({ key: 'GameOverScene' })
  }

  init(data){
    this.winnerId = data.winnerId;
  }

  preload() {
  }

  create() {
    this.add.text(100, 100, this.winnerId === socket.id ? 'You won!' : 'You lost :(', { color: "#ff0000"});
    
    this.startOverText = this.add.text(300, 300, 'Start Over', { color: "#ff0000"});
    this.startOverText.setInteractive();
    
    this.startOverText.on('pointerdown',  () => {
      socket.emit('startOver');
      
      this.scene.start('PreloadScene');
    })
  }
}
