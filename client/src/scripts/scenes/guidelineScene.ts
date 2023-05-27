export default class GuidelineScene extends Phaser.Scene {
    constructor() {
      super({ key: 'GuidelineScene' })
    }
  
    preload() {
      this.load.image('tank1', '../../assets/gold tank.svg')
      this.load.image('heart', '../../assets/heart live.svg')
      this.load.image('brick', '../../assets/texture  brick.svg')
      this.load.image('cement', '../../assets/texture cement.svg')
      this.load.image('grass', '../../assets/texture grass.svg')
      this.load.image('water', '../../assets/texture water.svg')
      this.load.image('back', '../../assets/back button.svg')
    }
  
    create() {
      const backButton = this.add.text(100,50, ' back ', {fontSize: 30})
      backButton.setInteractive();
      backButton.on('pointerdown', () => {
        this.scene.start('PreloadScene');
      })

      //@ts-ignore
      this.add.text(400,100, 'Guideline', {fontSize: 60})

      this.add.sprite(300, 280, 'tank1');
      this.add.text(400, 280, 'tank icon.')
      this.add.sprite(300, 380, 'heart');
      this.add.text(400, 380, 'displays the number of lives the tank has left.')
      this.add.sprite(300, 480, 'brick');
      this.add.text(400, 480, 'brick - destructible obstacle.')
      this.add.sprite(300, 580, 'cement');
      this.add.text(400, 580, 'cement - impenetrable obstacle, it is impossible to  destroy and shoot through it.')
      this.add.sprite(300, 680, 'grass');
      this.add.text(400, 680, 'grass - penetrable obstacle, it is possible to shoot and go through it.')
      this.add.sprite(300, 780, 'water');
      this.add.text(400, 780, 'water - dangerous obstacle, once tank in the water, one life is taken away.')
    }
}