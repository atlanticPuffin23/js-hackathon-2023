import { DEFAULT_HEIGHT, DEFAULT_WIDTH } from '../game';
import { socket } from './preloadScene';

type Player = {
  playerId: string,
  position: {
    x: number,
    y: number,
    rotation: number,
  },
  lives: number,
  direction: 'up' | 'down' | 'left' | 'right',
  status: 'active' | 'hit' | 'dead',
  activeShots: Array<{
    playerId: string,
    position: {
      x: number,
      y: number,
    },
    direction: 'up' | 'down' | 'left' | 'right',
  }>,
};

type GameState = {
    gameStatus: 'waiting' | 'countdown' | 'in-progress' | 'ended',
    players: {
      [playerId: string]: Player,
    },
    obstacles: Array<{x: number, y: number}>,
    winnerId: string | null,
};

export default class MainScene extends Phaser.Scene {
  private speed = 5;
  private distanceToBorder = 25;
  private gameStatus: Phaser.GameObjects.Text;

  private currentPlayer: Phaser.GameObjects.Sprite;
  private otherPlayers: Array<Phaser.GameObjects.Sprite> = [];

  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;

  constructor() {
    super({ key: 'MainScene' });
  }

  preload() {
    this.load.image('tank1', 'assets/gold_ukrainian_tank.svg');
  }

  create() { 
    this.gameStatus = this.add.text(10, 10, '', {color: '#ff0000'})

    socket.on('gameState', (gameState: GameState) => {
      const { players } = gameState;
      this.gameStatus.setText(gameState.gameStatus);
      console.log('gameState', gameState);

      Object.keys(players).forEach((playerId) => {
        const player = players[playerId];

        if (playerId === socket.id) {
          this.addPlayer(player);
        } else {
          this.addOtherPlayers(player);
        }
      });
    });

    socket.on("playerMoved", (playerInfo) => {
      this.otherPlayers.forEach((otherPlayer) => {
        if (playerInfo.playerId === otherPlayer.getData('playerId')) {
          otherPlayer.setPosition(playerInfo.x, playerInfo.y);
          otherPlayer.rotation = playerInfo.rotation;
        }
      });
    });
    
    socket.on("playerDisconnected", (playerId) => {
      this.otherPlayers.forEach((otherPlayer) => {
        if (playerId === otherPlayer.getData('playerId')) {
          otherPlayer.destroy();
        }
      });
    });

    // Enable keyboard input
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard?.createCursorKeys();
    }   
  }

  addPlayer(player) {
    const { position } = player;
    this.currentPlayer = this.add.sprite(position.x, position.y, 'tank1');
    this.currentPlayer.rotation = position.rotation;
    this.distanceToBorder = this.currentPlayer.width / 2;
  }

  addOtherPlayers(player) {
    const { position } = player;
    const otherPlayer = this.add.sprite(
      position.x + 40,
      position.y + 40,
      "tank1"
    );
    otherPlayer.rotation = position.rotation;
    otherPlayer.setData('playerId', player.playerId);

    this.otherPlayers.push(otherPlayer);
  }

  moveTank() {
    if (this.cursors.left.isDown) {
      this.currentPlayer.rotation = Phaser.Math.DegToRad(-90);
      if (this.currentPlayer.x - this.distanceToBorder > 0) {
        this.currentPlayer.x -= this.speed;
      }
    }

    if (this.cursors.right.isDown) {
      this.currentPlayer.rotation = Phaser.Math.DegToRad(90);
      if (this.currentPlayer.x + this.distanceToBorder < DEFAULT_WIDTH) {
        this.currentPlayer.x += this.speed;
      }
    }

    if (this.cursors.up.isDown) {
      this.currentPlayer.rotation = 0;
      if (this.currentPlayer.y - this.distanceToBorder > 0) {
        this.currentPlayer.y -= this.speed;
      }
    }

    if (this.cursors.down.isDown) {
      this.currentPlayer.rotation = Phaser.Math.DegToRad(180);
      if (this.currentPlayer.y + this.distanceToBorder < DEFAULT_HEIGHT) {
        this.currentPlayer.y += this.speed;
      }
    }

    socket.emit('playerMovement', { x: this.currentPlayer.x, y: this.currentPlayer.y, rotation: this.currentPlayer.rotation });
  }

  update() {
    if (this.currentPlayer) {
      this.moveTank();
    }
  }
}
