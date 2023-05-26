export default class MainScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainScene' });
  }
  preload() {
    this.load.image('tank1', 'assets/gold_ukrainian_tank.svg');
  }

  create() {
    this.add.sprite(40, 80, 'tank1');
  }

  update() {}
}
