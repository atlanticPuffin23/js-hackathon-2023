const server = require('express')();
const http = require('http').createServer(server);
const io = require('socket.io')(http, {
  cors: {
    origin: ['http://localhost:8080', 'http://localhost:3000'],
    methods: ['GET', 'POST'],
  },
});

const PORT = 3001;

const initialGameState = {
  gameStatus: 'waiting',
  players: {},
  winnerId: null,
};

let gameState = {
  ...initialGameState,
  players: { ...initialGameState.players },
};

server.get('/', (req, res) => {
  res.send('Server is running!');
});

io.on('connection', function (socket) {
  console.log('player [' + socket.id + '] connected')
  
socket.on('startNewGame', ()=> {
  switch (Object.keys(gameState.players).length) {
    case 0:
      gameState.players[socket.id] = {
        playerId: socket.id,
        position: {
          x: 100,
          y: 140,
          rotation: 0,
        },
        lives: 3,
        direction: 'up',
        status: 'active'
      };
      break;
    case 1:
      gameState.players[socket.id] = {
        playerId: socket.id,
        position: {
          x: 1200,
          y: 1200,
          rotation: 0,
        },
        lives:   3,
        direction: 'down',
        status: 'active'
      };
      io.emit('startCompetition');
      break;
    default:
      gameState.gameStatus = 'in-progress';
  }

  socket.emit('currentPlayers', gameState.players);
  socket.broadcast.emit('playerConnected', gameState.players[socket.id]);
})
 
  socket.on('disconnect', function () {
    delete gameState.players[socket.id];
    console.log('player [' + socket.id + '] disconnected');
    // if (Object.keys(gameState.players).length === 1) {
    //   gameState.gameStatus = 'ended';
    //   gameState.winnerId = Object.keys(gameState.players)[0];
    // };

    io.emit('playerDisconnected', socket.id);
  });

  socket.on('playerMovement', function (movementData) {
    if (!gameState.players[socket.id]) {
      return;
    }
    gameState.players[socket.id].x = movementData.x;
    gameState.players[socket.id].y = movementData.y;
    gameState.players[socket.id].rotation = movementData.rotation;

    socket.broadcast.emit('playerMoved', gameState.players[socket.id]);
  });

  socket.on('bulletShoot', function (bulletInfo) {
    io.emit('bulletFired', bulletInfo);
  });

  socket.on('playerDied', function ({ playerId, deadPlayerId }) {
    gameState.players[deadPlayerId].status = 'dead';
    gameState.winnerId = playerId;
    gameState.gameStatus = 'ended';

    io.emit('gameOver', gameState.winnerId);
  });

  socket.on('startOver', function () {
    gameState = { ...initialGameState, players: {} };
  });
});

http.listen(PORT, function () {
  console.log('Server started!');
});
