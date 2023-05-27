import { socket } from './preloadScene';

export default class GameOverScene extends Phaser.Scene {
  private startOverText: Phaser.GameObjects.Text;
  private winnerId: string
  private loserId: string
  
  constructor() {
    super({ key: 'GameOverScene' })
  }

  init(data) {
    console.log('data', data);
    this.winnerId = data.winner;
    this.loserId = data.loser;
  }

  create() {
    let text = 'Game over!';
    if (this.winnerId === socket.id) {
      text = 'You won!';
    } else if (this.loserId === socket.id) {
      text = 'You lost!';
    };

    this.add.text(540, 500, text, { color: "#ffffff", fontSize: 40});
    
    this.startOverText = this.add.text(460, 700, 'Start Over', { color: "#ff0000", fontSize: 60});
    this.startOverText.setInteractive();
    
    this.startOverText.on('pointerdown',  () => {
      socket.emit('startOver');
      
      this.scene.start('PreloadScene');
    })
  }
}
