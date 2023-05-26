import { DEFAULT_HEIGHT, DEFAULT_WIDTH } from '../game';

export default class MainScene extends Phaser.Scene {
  private speed = 5;
  private tank1: Phaser.GameObjects.Sprite;
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;

  constructor() {
    super({ key: 'MainScene' });
  }
  preload() {
    this.load.image('tank1', 'assets/gold_ukrainian_tank.svg');
  }

  create() {
    this.tank1 = this.add.sprite(40, 80, 'tank1');

    if (this.input.keyboard) {
      // Enable keyboard input
      this.cursors = this.input.keyboard?.createCursorKeys();
    }
  }

  update() {
    if (this.cursors.left.isDown && this.tank1.x - this.speed > 0) {
      this.tank1.x -= this.speed;
      this.tank1.rotation = Phaser.Math.DegToRad(-90);
    }

    if (
      this.cursors.right.isDown &&
      this.tank1.x + this.speed < DEFAULT_WIDTH
    ) {
      this.tank1.x += this.speed;
      this.tank1.rotation = Phaser.Math.DegToRad(90);
    }

    if (this.cursors.up.isDown && this.tank1.y - this.speed > 0) {
      this.tank1.y -= this.speed;
      this.tank1.rotation = 0;
    }
    if (
      this.cursors.down.isDown &&
      this.tank1.y + this.speed < DEFAULT_HEIGHT
    ) {
      this.tank1.y += this.speed;
      this.tank1.rotation = Phaser.Math.DegToRad(180);
    }
  }
}
