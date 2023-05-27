import 'phaser'
import MainScene from './scenes/mainScene'
import PreloadScene from './scenes/preloadScene'
import GuidelineScene from './scenes/guidelineScene'

export const DEFAULT_WIDTH = 1300
export const DEFAULT_HEIGHT = 1300

const config = {
  type: Phaser.AUTO,
  backgroundColor: '#000000',
  scale: {
    parent: 'app',
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT
  },
  scene: [PreloadScene, MainScene, GuidelineScene],
}

window.addEventListener('load', () => {
  const game = new Phaser.Game(config)
})
