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
        initialPosition: {
          x: 100,
          y: 140,
        },
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
        initialPosition: {
          x: 1200,
          y: 1200,
        },
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

    io.emit('gameOver', {winner: gameState.winnerId, loser: deadPlayerId});
  });
  
  socket.on('playerHitted', function(playerId){
    gameState.players[playerId].status = 'hit';
    gameState.players[playerId].lives -= 1;

    io.emit('livesChanged', {playerId, lives: gameState.players[playerId].lives})
   });

  socket.on('startOver', function () {
    gameState = { ...initialGameState, players: {} };
  });
});

http.listen(PORT, function () {
  console.log('Server started!');
});
