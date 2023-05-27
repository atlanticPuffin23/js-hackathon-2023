import { DEFAULT_HEIGHT, DEFAULT_WIDTH } from '../game';
import { socket } from './preloadScene';

export default class MainScene extends Phaser.Scene {
  private speed = 5;
  private distanceToBorder = 25;
  private gameStatus: Phaser.GameObjects.Text;
  private tank1: Phaser.GameObjects.Sprite;
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;

  constructor() {
    super({ key: 'MainScene' });
  }
  preload() {
    this.load.image('tank1', 'assets/gold_ukrainian_tank.svg');
  }

  create() { 
    this.gameStatus = this.add.text(10,10, '', {color: '#ff0000'})
    
    socket.on('gameState', (gameState) => {
      this.gameStatus.setText(gameState.gameStatus);
    });
    
    this.tank1 = this.add.sprite(40, 80, 'tank1');
    this.distanceToBorder = this.tank1.width / 2;
    console.log(this.tank1);

    // Enable keyboard input
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard?.createCursorKeys();
    }   
  }

  moveTank() {
    if (this.cursors.left.isDown) {
      this.tank1.rotation = Phaser.Math.DegToRad(-90);
      if (this.tank1.x - this.distanceToBorder > 0) {
        this.tank1.x -= this.speed;
      }
    }

    if (this.cursors.right.isDown) {
      this.tank1.rotation = Phaser.Math.DegToRad(90);
      if (this.tank1.x + this.distanceToBorder < DEFAULT_WIDTH) {
        this.tank1.x += this.speed;
      }
    }

    if (this.cursors.up.isDown) {
      this.tank1.rotation = 0;
      if (this.tank1.y - this.distanceToBorder > 0) {
        this.tank1.y -= this.speed;
      }
    }
    if (this.cursors.down.isDown) {
      this.tank1.rotation = Phaser.Math.DegToRad(180);
      if (this.tank1.y + this.distanceToBorder < DEFAULT_HEIGHT) {
        this.tank1.y += this.speed;
      }
    }
  }

  update() {
    this.moveTank();
  }
}
