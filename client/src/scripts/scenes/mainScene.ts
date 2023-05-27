import { DEFAULT_HEIGHT, DEFAULT_WIDTH } from '../game';
import { socket } from './preloadScene';

enum Direction {
  up = 'up',
  down = 'down',
  right = 'right',
  left = 'left',
}

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
};

type Players = {
  [playerId: string]: Player,
};

type BulletInfo = {
  playerId: string,
  x: number,
  y: number,
  direction: Direction,
  rotation: number,
  visible: boolean,
  isTankMoved: boolean,
};

type GameState = {
    gameStatus: 'waiting' | 'countdown' | 'in-progress' | 'ended',
    players: Players,
    obstacles: Array<{x: number, y: number}>,
    winnerId: string | null,
};

export default class MainScene extends Phaser.Scene {
  private speed = 5;
  private distanceToBorder = 25;
  private gameStatus: Phaser.GameObjects.Text;

  private currentPlayer: Phaser.GameObjects.Sprite;
  private otherPlayers: Array<Phaser.GameObjects.Sprite> = [];

  private bullets: Array<Phaser.GameObjects.Sprite> = [];

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
    socket.emit('startMewGame');
    
    socket.on('currentPlayers', (players: Players) => {
      console.log('players', players);

      Object.keys(players).forEach((playerId) => {
        const player = players[playerId];

        if (playerId === socket.id) {
          this.addPlayer(player);
        } else {
          this.addOtherPlayers(player);
        }
      });
    });

    socket.on("playerConnected", (player) => {
      if (player) {
        this.addOtherPlayers(player);
      }
    });

    socket.on("playerMoved", (playerInfo) => {
      this.otherPlayers.forEach((otherPlayer) => {
        if (playerInfo.playerId === otherPlayer.getData('playerId')) {
          otherPlayer.setPosition(playerInfo.x, playerInfo.y);
          otherPlayer.rotation = playerInfo.rotation;
        }
      });
    });

    socket.on('bulletFired', (bulletInfo: BulletInfo) => this.addBullet(bulletInfo));
    
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

  addBullet(bulletInfo: BulletInfo) {
    const { playerId, x, y, direction, rotation, isTankMoved } = bulletInfo;
    
    const bullet = this.add.sprite(x, y, 'bullet');
    bullet.setVisible(true);
    bullet.rotation = rotation;
    bullet.setData('direction', direction);
    bullet.setData('start_x', x);
    bullet.setData('start_y', y);
    bullet.setData('playerId', playerId);
    bullet.setData('isTankMoved', isTankMoved);
    
    this.bullets.push(bullet);
  }

  update() {
    if (this.currentPlayer) {
      // TO DO: Use gameStatus
      if(this.currentPlayer && this.otherPlayers.length){ 
        this.moveTank(); 
      }

      if (
        Phaser.Input.Keyboard.JustDown(this.spaceBar) ||
        Phaser.Input.Keyboard.JustDown(this.enterKey)
      ) {
        this.shootBullet();
      }

      this.bullets.forEach((bullet) => {
        this.moveBullet(bullet);
      });
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
    } else if (this.cursors.right.isDown) {
      this.currentPlayer.rotation = this.rightDirectionRotation;
      this.currentPlayer.setData('direction', Direction.right);

      if (this.currentPlayer.x + this.distanceToBorder < DEFAULT_WIDTH) {
        this.currentPlayer.x += this.speed;
      }
    } else if (this.cursors.up.isDown) {
      this.currentPlayer.rotation = this.upDirectionRotation;
      this.currentPlayer.setData('direction', Direction.up);

      if (this.currentPlayer.y - this.distanceToBorder > 0) {
        this.currentPlayer.y -= this.speed;
      }
    } else if (this.cursors.down.isDown) {
      this.currentPlayer.rotation = this.downDirectionRotation;
      this.currentPlayer.setData('direction', Direction.down);

      if (this.currentPlayer.y + this.distanceToBorder < DEFAULT_HEIGHT) {
        this.currentPlayer.y += this.speed;
      }
    }

    socket.emit('playerMovement', { x: this.currentPlayer.x, y: this.currentPlayer.y, rotation: this.currentPlayer.rotation });
  }

  shootBullet() {
    const bulletDirection: Direction = this.currentPlayer.getData('direction');

    const bulletInfo = {
      playerId: this.currentPlayer.getData('playerId'),
      x: this.currentPlayer.x,
      y: this.currentPlayer.y,
      direction: bulletDirection,
      rotation: this.getRotationValue(bulletDirection),
      visible: true,
      isTankMoved: this.cursors.left.isDown || this.cursors.right.isDown  || this.cursors.up.isDown || this.cursors.down.isDown,
    };
    
    socket.emit('bulletShoot', bulletInfo);
  }

  moveBullet(bullet: Phaser.GameObjects.Sprite) {
    if (bullet.visible) {
      const isTankMoved = bullet.getData('isTankMoved') || this.cursors.left.isDown || this.cursors.right.isDown  || this.cursors.up.isDown || this.cursors.down.isDown;
      const bulletMoveSpeed = isTankMoved ? 2 * this.speed : this.speed;
      const bulletNormalRangeOfProjectile = isTankMoved ? 2 * this.normalRangeOfProjectile : this.normalRangeOfProjectile
      
      switch (bullet.getData('direction')) {
        case Direction.up: {
          if (
            bullet.getData('start_y') - bullet.y ===
            bulletNormalRangeOfProjectile
          ) {
            bullet.setPosition(0, 0);
            bullet.setVisible(false);
            return;
          }
          bullet.y -= bulletMoveSpeed;
          break;
        }
        case Direction.down: {
          if (
            bullet.y - bullet.getData('start_y') ===
            bulletNormalRangeOfProjectile
          ) {
            bullet.setPosition(0, 0);
            bullet.setVisible(false);
            return;
          }
          bullet.y += bulletMoveSpeed;
          break;
        }
        case Direction.left: {
          if (
            bullet.getData('start_x') - bullet.x ===
            bulletNormalRangeOfProjectile
          ) {
            bullet.setPosition(0, 0);
            bullet.setVisible(false);
          }
          bullet.x -= bulletMoveSpeed;
          break;
        }
        case Direction.right: {
          if (
            bullet.x - bullet.getData('start_x') ===
            bulletNormalRangeOfProjectile
          ) {
            bullet.setPosition(0, 0);
            bullet.setVisible(false);
            return;
          }
          bullet.x += bulletMoveSpeed;
          break;
        }
      }
    }
  }

  // stopShooting() {
  //   this.bullet.setPosition(0, 0);
  //   this.bullet.setVisible(false);
  // }
}
