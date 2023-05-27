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
  direction: Direction,
  status: 'active' | 'hit' | 'dead',
  activeShots: Array<{
    playerId: string,
    position: {
      x: number,
      y: number,
    },
    direction: Direction,
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

  private currentPlayer: Phaser.GameObjects.Sprite;
  private otherPlayers: Array<Phaser.GameObjects.Sprite> = [];

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
      this.spaceBar = this.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.SPACE
      );
      this.enterKey = this.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.ENTER
      );
    }
  }

  addPlayer(player) {
    const { position } = player;

    this.currentPlayer = this.add.sprite(position.x, position.y, 'tank1');
    this.currentPlayer.rotation = position.rotation;
    this.currentPlayer.setData('direction', Direction.up);

    // Create the bullet sprite
    this.bullet = this.add.sprite(0, 0, 'bullet');
    this.bullet.setVisible(false); // Hide the bullet initially

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

  update() {
    if (this.currentPlayer) {
      this.moveTank();

      if (
        Phaser.Input.Keyboard.JustDown(this.spaceBar) ||
        Phaser.Input.Keyboard.JustDown(this.enterKey)
      ) {
        this.shootBullet();
      }
      this.moveBullet();
    }
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
      this.currentPlayer.rotation = this.leftDirectionRotation;
      this.currentPlayer.setData('direction', Direction.left);

      if (this.currentPlayer.x - this.distanceToBorder > 0) {
        this.currentPlayer.x -= this.speed;
      }
    }

    if (this.cursors.right.isDown) {
      this.currentPlayer.rotation = this.rightDirectionRotation;
      this.currentPlayer.setData('direction', Direction.right);

      if (this.currentPlayer.x + this.distanceToBorder < DEFAULT_WIDTH) {
        this.currentPlayer.x += this.speed;
      }
    }

    if (this.cursors.up.isDown) {
      this.currentPlayer.rotation = this.upDirectionRotation;
      this.currentPlayer.setData('direction', Direction.up);

      if (this.currentPlayer.y - this.distanceToBorder > 0) {
        this.currentPlayer.y -= this.speed;
      }
    }
    if (this.cursors.down.isDown) {
      this.currentPlayer.rotation = this.downDirectionRotation;
      this.currentPlayer.setData('direction', Direction.down);

      if (this.currentPlayer.y + this.distanceToBorder < DEFAULT_HEIGHT) {
        this.currentPlayer.y += this.speed;
      }
    }

    socket.emit('playerMovement', { x: this.currentPlayer.x, y: this.currentPlayer.y, rotation: this.currentPlayer.rotation });
  }

  shootBullet() {
    if (!this.bullet.visible) {
      this.bullet.setPosition(this.currentPlayer.x, this.currentPlayer.y);
      this.bullet.setVisible(true);
      const direction: Direction = this.currentPlayer.getData('direction');
      this.bullet.rotation = this.getRotationValue(direction);
      this.bullet.setData('direction', direction);
      this.bullet.setData('start_x', this.currentPlayer.x);
      this.bullet.setData('start_y', this.currentPlayer.y);
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
