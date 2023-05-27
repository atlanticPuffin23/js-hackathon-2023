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
    this.add.text(540, 500, this.winnerId === socket.id ? 'You won!' : 'You lost!', { color: "#ffffff", fontSize: 40});
    
    this.startOverText = this.add.text(460, 700, 'Start Over', { color: "#ff0000", fontSize: 60});
    this.startOverText.setInteractive();
    
    this.startOverText.on('pointerdown',  () => {
      socket.emit('startOver');
      
      this.scene.start('PreloadScene');
    })
  }
}
