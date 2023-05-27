import { DEFAULT_HEIGHT, DEFAULT_WIDTH } from '../game';
import { socket } from './preloadScene';

enum Direction {
  up = 'up',
  down = 'down',
  right = 'right',
  left = 'left',
}

type Player = {
  playerId: string;
  position: {
    x: number;
    y: number;
    rotation: number;
  };
  lives: number;
  direction: Direction;
  status: 'active' | 'hit' | 'dead';
};

type Players = {
  [playerId: string]: Player;
};

type BulletInfo = {
  playerId: string;
  x: number;
  y: number;
  direction: Direction;
  rotation: number;
  visible: boolean;
  isTankMoved: boolean;
};

const cementPositions = [
  { x: 200, y: 700 },
  { x: 800, y: 300 },
  { x: 500, y: 500 },
  { x: 1200, y: 400 },
  { x: 250, y: 1200 },
  { x: 924, y: 1179 },
  { x: 400, y: 800 },
  { x: 700, y: 100 },
  { x: 1100, y: 900 },
];

const grassPositions = [
  { x: 350, y: 400 },
  { x: 250, y: 500 },
  { x: 750, y: 600 },
  { x: 850, y: 700 },
  { x: 550, y: 800 },
  { x: 650, y: 200 },
  { x: 450, y: 1000 },
  { x: 1050, y: 1100 },
  { x: 924, y: 1260 },
  { x: 1005, y: 1260 },
  { x: 1005, y: 1179 },
  { x: 1150, y: 300 },
];

const waterPositions = [
  { x: 520, y: 40 },
  { x: 460, y: 40 },
  { x: 380, y: 40 },
  { x: 300, y: 40 },
  { x: 843, y: 1260 },
  { x: 762, y: 1260 },
  { x: 681, y: 1260 },
  { x: 600, y: 1260 },
];

const currentPlayerLivesPosition = {x: 40, y: 60}
const otherPlayerLivesPosition = {x: 1200, y: 60}

export default class MainScene extends Phaser.Scene {
  private speed = 5;
  private distanceToBorder = 25;
  
  private currentPlayerLives: Array<Phaser.Physics.Arcade.Sprite> = [];
  private otherPlayerLives: Array<Phaser.Physics.Arcade.Sprite> = [];

  private currentPlayer: Phaser.Physics.Arcade.Sprite;
  private otherPlayer: Phaser.Physics.Arcade.Sprite;

  private bullets: Phaser.Physics.Arcade.Group;

  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private spaceBar: Phaser.Input.Keyboard.Key;
  private enterKey: Phaser.Input.Keyboard.Key;

  private cementGroup: Phaser.Physics.Arcade.Group;
  private grassGroup: Phaser.Physics.Arcade.Group;
  private waterGroup: Phaser.Physics.Arcade.Group;

  private leftDirectionRotation = Phaser.Math.DegToRad(-90);
  private rightDirectionRotation = Phaser.Math.DegToRad(90);
  private upDirectionRotation = 0;
  private downDirectionRotation = Phaser.Math.DegToRad(180);

  private normalRangeOfProjectile = 650;
  private normalShotDelay = 1000;

  private hasAddedCollider = false;

  private overlay: Phaser.GameObjects.Rectangle;
  private overlayText!: Phaser.GameObjects.Text;
  private countdown: Phaser.Time.TimerEvent | null = null;
  private countdownDuration: number = 4000;
  private countdownRemainingTime: number = this.countdownDuration;

  private disabled = true;

  constructor() {
    super({ key: 'MainScene' });
  }

  preload() {
    this.load.image('tank1', 'assets/gold_ukrainian_tank.svg');
    this.load.image('bullet', 'assets/bullet.svg');
    this.load.image('cement', 'assets/texture cement.svg');
    this.load.image('grass', 'assets/texture grass.svg');
    this.load.image('water', 'assets/texture water.svg');
    this.load.image('heart', 'assets/heart_live.svg');
  }

  create() {
    this.physics.world.setBounds(0, 0, DEFAULT_HEIGHT, DEFAULT_HEIGHT);

    socket.emit('startNewGame');

    this.cementGroup = this.physics.add.group({
      key: 'cement',
      immovable: true,
      quantity: 10,
    });

    this.grassGroup = this.physics.add.group({
      key: 'grass',
      quantity: 10,
    });

    this.waterGroup = this.physics.add.group({
      key: 'water',
      quantity: 10,
    });

    cementPositions.forEach((pos) => {
      let cement = this.physics.add.sprite(pos.x, pos.y, 'cement');
      this.cementGroup.add(cement);
    });

    grassPositions.forEach((pos) => {
      let grass = this.physics.add.sprite(pos.x, pos.y, 'grass');
      grass.setDepth(10);
      this.grassGroup.add(grass);
    });

    waterPositions.forEach((pos) => {
      let water = this.physics.add.sprite(pos.x, pos.y, 'water');
      this.waterGroup.add(water);
    });

    this.bullets = this.physics.add.group({
      classType: Phaser.Physics.Arcade.Sprite,
    });
  
    socket.on('currentPlayers', (players: Players) => {
      Object.keys(players).forEach((playerId) => {
        const player = players[playerId];

        if (playerId === socket.id) {
          this.addPlayer(player);
        } else {
          this.addOtherPlayer(player);
        }
      });
    });

    socket.on('playerConnected', (player) => {
      if (player) {
        this.addOtherPlayer(player);
      }
    });

    socket.on('startCompetition', () => {
      console.log('startCompetition');
      if (!this.overlay) {
        this.addOverlay('');
      }
      this.startCountdown();
    });

    socket.on('playerMoved', (playerInfo) => {
      if (playerInfo.playerId === this.otherPlayer?.getData('playerId')) {
        this.otherPlayer.setPosition(playerInfo.x, playerInfo.y);
        this.otherPlayer.rotation = playerInfo.rotation;
      }
    });

    socket.on('bulletFired', (bulletInfo: BulletInfo) =>
      this.addBullet(bulletInfo)
    );

    this.physics.add.collider(this.bullets, this.cementGroup, (bullet) => {
      bullet.destroy();
    });

    socket.on('playerDisconnected', (playerId) => {
      if (playerId === this.otherPlayer?.getData('playerId')) {
        this.addOverlay('Please wait until another user joins...');
        this.disabled = true;
        this.otherPlayer.destroy();
      }
    });

    socket.on('gameOver', ({ winner, loser }) => {
      this.scene.start('GameOverScene', { winner, loser });
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

    this.addOverlay('Please wait until another user joins...');
  }

  addPlayer(player) {
    const { position, lives} = player;

    this.currentPlayer = this.physics.add.sprite(
      position.x,
      position.y,
      'tank1'
    );
    this.currentPlayer.rotation = position.rotation;
    this.currentPlayer.setData('direction', Direction.up);
    this.currentPlayer.setData('lives', lives);
    
    this.distanceToBorder = this.currentPlayer.width / 2;

    this.physics.add.collider(this.currentPlayer, this.cementGroup);
    
    this.drawLives( this.currentPlayer , this.currentPlayerLives, currentPlayerLivesPosition);
    this.add.text(10, 5, 'Your lives:', {fontSize: 20})
  }

  addOtherPlayer(player) {
    const { position, lives} = player;
    this.otherPlayer = this.physics.add.sprite(
      position.x + 40,
      position.y + 40,
      'tank1'
    );

    this.otherPlayer.rotation = position.rotation;
    this.otherPlayer.setData('playerId', player.playerId);
    this.otherPlayer.setData('lives', lives);
    
    this.drawLives(this.otherPlayer , this.otherPlayerLives, otherPlayerLivesPosition);
  }

  addBullet(bulletInfo: BulletInfo) {
    const { playerId, x, y, direction, rotation, isTankMoved } = bulletInfo;

    const bullet: Phaser.Physics.Arcade.Image = this.bullets.get(
      x,
      y,
      'bullet'
    );
    bullet.setVisible(true);
    bullet.rotation = rotation;
    bullet.setData('direction', direction);
    bullet.setData('start_x', x);
    bullet.setData('start_y', y);
    bullet.setData('playerId', playerId);
    bullet.setData('isTankMoved', isTankMoved);

    if (bullet.getData('playerId') === socket.id) {
      this.physics.add.overlap(bullet, this.otherPlayer, () => {
        socket.emit('playerDied', {
          playerId: socket.id,
          deadPlayerId: this.otherPlayer.getData('playerId'),
        });
      });
    }
  }
  
  drawLives(player, playerLives, { x, y }) {
    for (let i = 0; i < player.getData('lives'); i++) {
     playerLives.push(this.add.sprite(x + i * 30, y, 'heart'));
    }
  }

  update() {
    if (this.currentPlayer && this.otherPlayer && !this.disabled) {
      if (!this.hasAddedCollider) {
        console.log('currentPlayer', this.currentPlayer);
        this.currentPlayer.setPushable(false);
        this.otherPlayer.setPushable(false);

        this.physics.add.collider(this.currentPlayer, this.otherPlayer);
        this.physics.add.collider(this.currentPlayer, this.waterGroup, () => {
          socket.emit('playerDied', {
            playerId: this.otherPlayer.getData('playerId'),
            deadPlayerId: socket.id,
          });
        });

        this.hasAddedCollider = true;
      }

      this.moveTank();

      if (
        Phaser.Input.Keyboard.JustDown(this.spaceBar) ||
        Phaser.Input.Keyboard.JustDown(this.enterKey)
      ) {
        this.shootBullet();
      }

      this.bullets
        .getChildren()
        // @ts-ignore
        .forEach((bullet: Phaser.Physics.Arcade.Sprite) => {
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
    this.currentPlayer.setVelocity(0);

    if (this.cursors.left.isDown) {
      this.currentPlayer.rotation = this.leftDirectionRotation;
      this.currentPlayer.setData('direction', Direction.left);

      if (this.currentPlayer.x - this.distanceToBorder > 0) {
        this.currentPlayer.setVelocityX(-this.speed * 50);
      }
    } else if (this.cursors.right.isDown) {
      this.currentPlayer.rotation = this.rightDirectionRotation;
      this.currentPlayer.setData('direction', Direction.right);

      if (this.currentPlayer.x + this.distanceToBorder < DEFAULT_WIDTH) {
        this.currentPlayer.setVelocityX(this.speed * 50);
      }
    } else if (this.cursors.up.isDown) {
      this.currentPlayer.rotation = this.upDirectionRotation;
      this.currentPlayer.setData('direction', Direction.up);

      if (this.currentPlayer.y - this.distanceToBorder > 0) {
        this.currentPlayer.setVelocityY(-this.speed * 50);
      }
    } else if (this.cursors.down.isDown) {
      this.currentPlayer.rotation = this.downDirectionRotation;
      this.currentPlayer.setData('direction', Direction.down);

      if (this.currentPlayer.y + this.distanceToBorder < DEFAULT_HEIGHT) {
        this.currentPlayer.setVelocityY(this.speed * 50);
      }
    }

    socket.emit('playerMovement', {
      x: this.currentPlayer.x,
      y: this.currentPlayer.y,
      rotation: this.currentPlayer.rotation,
    });
  }

  shootBullet() {
    this.delayNextShot();
    const bulletDirection: Direction = this.currentPlayer.getData('direction');

    const bulletInfo = {
      playerId: socket.id,
      x: this.currentPlayer.x,
      y: this.currentPlayer.y,
      direction: bulletDirection,
      rotation: this.getRotationValue(bulletDirection),
      visible: true,
      isTankMoved:
        this.cursors.left.isDown ||
        this.cursors.right.isDown ||
        this.cursors.up.isDown ||
        this.cursors.down.isDown,
    };

    socket.emit('bulletShoot', bulletInfo);
  }

  delayNextShot() {
    this.enterKey.enabled = false;
    this.spaceBar.enabled = false;

    setTimeout(() => {
      this.enterKey.enabled = true;
      this.spaceBar.enabled = true;
    }, this.normalShotDelay);
  }

  moveBullet(bullet: Phaser.GameObjects.Sprite) {
    if (bullet.visible) {
      const isTankMoved =
        bullet.getData('isTankMoved') ||
        this.cursors.left.isDown ||
        this.cursors.right.isDown ||
        this.cursors.up.isDown ||
        this.cursors.down.isDown;
      const bulletMoveSpeed = isTankMoved ? 2 * this.speed : this.speed;
      const bulletNormalRangeOfProjectile = isTankMoved
        ? 2 * this.normalRangeOfProjectile
        : this.normalRangeOfProjectile;

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

  addOverlay(initialText = 'Please, wait...') {
    this.overlay = this.add.rectangle(
      DEFAULT_WIDTH / 2,
      DEFAULT_HEIGHT / 2,
      DEFAULT_WIDTH,
      DEFAULT_HEIGHT,
      0x000000,
      0.8
    );
    this.overlay?.setDepth(10);

    this.overlayText = this.add.text(
      DEFAULT_WIDTH / 2,
      DEFAULT_HEIGHT / 2,
      initialText,
      {
        fontFamily: 'VT323',
        // @ts-ignore
        fontWeight: 'bold',
        fontSize: '40px',
        fill: '#ffffff',
      }
    );
    this.overlayText?.setDepth(11);
    this.overlayText?.setOrigin(0.5);
  }

  destroyOverlay() {
    this.overlay?.destroy();
    this.overlayText?.destroy();
    console.log('overlay', this.overlay);
  }

  startCountdown(initialText = 'Game is about to start...') {
    this.overlayText?.setText(initialText);

    this.countdown = this.time.addEvent({
      delay: 1000,
      callback: this.updateCountdown,
      callbackScope: this,
      loop: true,
    });
  }

  updateCountdown() {
    this.countdownRemainingTime -= 1000;
    const seconds = Math.ceil(this.countdownRemainingTime / 1000);
    this.overlayText?.setText(seconds.toString());

    if (this.countdownRemainingTime <= 0) {
      this.destroyOverlay();
      this.disabled = false;
      this.countdown?.remove();
    }
  }
}
