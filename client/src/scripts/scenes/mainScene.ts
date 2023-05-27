import { DEFAULT_HEIGHT, DEFAULT_WIDTH } from '../game';
import { socket } from './preloadScene';

enum Direction {
  up = 'up',
  down = 'down',
  right = 'right',
  left = 'left',
}

export default class MainScene extends Phaser.Scene {
  private speed = 5;
  private distanceToBorder = 25;
  private gameStatus: Phaser.GameObjects.Text;
  private tank1: Phaser.GameObjects.Sprite;
  private bullet: Phaser.GameObjects.Sprite;
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private spaceBar: Phaser.Input.Keyboard.Key;
  private enterKey: Phaser.Input.Keyboard.Key;

  private leftDirectionRotation = Phaser.Math.DegToRad(-90);
  private rightDirectionRotation = Phaser.Math.DegToRad(90);
  private upDirectionRotation = 0;
  private downDirectionRotation = Phaser.Math.DegToRad(180);

  private normalRangeOfProjectile = 300;

  constructor() {
    super({ key: 'MainScene' });
  }
  preload() {
    this.load.image('tank1', 'assets/gold_ukrainian_tank.svg');
    this.load.image('bullet', 'assets/bullet.svg');
  }

  create() {
    this.gameStatus = this.add.text(10, 10, '', { color: '#ff0000' });

    socket.on('gameState', (gameState) => {
      this.gameStatus.setText(gameState.gameStatus);
    });

    this.tank1 = this.add.sprite(40, 80, 'tank1');
    this.tank1.setData('direction', Direction.up);
    // Create the bullet sprite
    this.bullet = this.add.sprite(0, 0, 'bullet');
    this.bullet.setVisible(false); // Hide the bullet initially

    this.distanceToBorder = this.tank1.width / 2;

    // Enable keyboard input
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard?.createCursorKeys();
      this.spaceBar = this.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.SPACE
      );
      this.enterKey = this.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.ENTER
      );
    }
  }

  update() {
    this.moveTank();
    if (
      Phaser.Input.Keyboard.JustDown(this.spaceBar) ||
      Phaser.Input.Keyboard.JustDown(this.enterKey)
    ) {
      this.shootBullet();
    }
    this.moveBullet();
  }

  getRotationValue(direction: Direction) {
    switch (direction) {
      case Direction.up: {
        return this.upDirectionRotation;
      }
      case Direction.down: {
        return this.downDirectionRotation;
      }
      case Direction.left: {
        return this.leftDirectionRotation;
      }
      case Direction.right: {
        return this.rightDirectionRotation;
      }
    }
  }

  moveTank() {
    if (this.cursors.left.isDown) {
      this.tank1.rotation = this.leftDirectionRotation;
      this.tank1.setData('direction', Direction.left);

      if (this.tank1.x - this.distanceToBorder > 0) {
        this.tank1.x -= this.speed;
      }
    }

    if (this.cursors.right.isDown) {
      this.tank1.rotation = this.rightDirectionRotation;
      this.tank1.setData('direction', Direction.right);

      if (this.tank1.x + this.distanceToBorder < DEFAULT_WIDTH) {
        this.tank1.x += this.speed;
      }
    }

    if (this.cursors.up.isDown) {
      this.tank1.rotation = this.upDirectionRotation;
      this.tank1.setData('direction', Direction.up);

      if (this.tank1.y - this.distanceToBorder > 0) {
        this.tank1.y -= this.speed;
      }
    }
    if (this.cursors.down.isDown) {
      this.tank1.rotation = this.downDirectionRotation;
      this.tank1.setData('direction', Direction.down);

      if (this.tank1.y + this.distanceToBorder < DEFAULT_HEIGHT) {
        this.tank1.y += this.speed;
      }
    }
  }

  shootBullet() {
    if (!this.bullet.visible) {
      this.bullet.setPosition(this.tank1.x, this.tank1.y);
      this.bullet.setVisible(true);
      const direction: Direction = this.tank1.getData('direction');
      this.bullet.rotation = this.getRotationValue(direction);
      this.bullet.setData('direction', direction);
      this.bullet.setData('start_x', this.tank1.x);
      this.bullet.setData('start_y', this.tank1.y);
    }
  }

  moveBullet() {
    if (this.bullet.visible) {
      switch (this.bullet.getData('direction')) {
        case Direction.up: {
          if (
            this.bullet.getData('start_y') - this.bullet.y ===
            this.normalRangeOfProjectile
          ) {
            this.stopShooting();
            return;
          }
          this.bullet.y -= this.speed;
          break;
        }
        case Direction.down: {
          if (
            this.bullet.y - this.bullet.getData('start_y') ===
            this.normalRangeOfProjectile
          ) {
            this.stopShooting();
            return;
          }
          this.bullet.y += this.speed;
          break;
        }
        case Direction.left: {
          if (
            this.bullet.getData('start_x') - this.bullet.x ===
            this.normalRangeOfProjectile
          ) {
            this.stopShooting();
          }
          this.bullet.x -= this.speed;
          break;
        }
        case Direction.right: {
          if (
            this.bullet.x - this.bullet.getData('start_x') ===
            this.normalRangeOfProjectile
          ) {
            this.stopShooting();
            return;
          }
          this.bullet.x += this.speed;
          break;
        }
      }
    }
  }

  stopShooting() {
    this.bullet.setPosition(0, 0);
    this.bullet.setVisible(false);
  }
}
