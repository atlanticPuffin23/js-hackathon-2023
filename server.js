const server = require('express')();
const http = require('http').createServer(server);
const io = require('socket.io')(http, {  
  cors: {
  origin: ['http://localhost:8080','http://localhost:3000'],
  methods: ['GET', 'POST'],
},
});

const PORT = 3001;

/*
type GameState = {
    gameStatus: 'waiting' | 'countdown' | 'in-progress' | 'ended',
    players: {
      [playerId: string]: {
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
      },
    },
    obstacles: Array<{x: number, y: number}>,
    winnerId: string | null,
};
*/

const initialGameState = {
    gameStatus: 'waiting',
    players: {},
    obstacles: [],
    winnerId: null,
};
  
let gameState = {
    ...initialGameState
};  

server.get('/', (req, res) => {
  res.send('Server is running!');
});

io.on('connection', function (socket) {
  console.log('player [' + socket.id + '] connected')

  if (Object.keys(gameState.players).length < 2) {
    gameState.players[socket.id] = {
      playerId: socket.id,
      position: {
        x: 40,
        y: 80,
        rotation: 0,
      },
      lives: 3,
      direction: 'up',
      status: 'active',
      activeShots: [],
    };

    // if (Object.keys(gameState.players).length === 2) {
    //   gameState.gameStatus = 'countdown';

    //   setTimeout(() => {
    //     gameState.gameStatus = 'in-progress';
    //   }, 3000);
    // }
  } else {
    gameState.gameStatus = 'in-progress';
  }

  // TODO: split into separate events (gameStatus)
  socket.emit('currentPlayers', gameState.players);
  socket.broadcast.emit('playerConnected', gameState.players[socket.id]);
 
  socket.on('disconnect', function () {
    delete gameState.players[socket.id];
    console.log('player [' + socket.id + '] disconnected');
    // if (Object.keys(gameState.players).length === 1) {
    //   gameState.gameStatus = 'ended';
    //   gameState.winnerId = Object.keys(gameState.players)[0];
    // };

    io.emit('playerDisconnected', socket.id)
  })
  
  socket.on('playerMovement', function (movementData) {
    gameState.players[socket.id].x = movementData.x
    gameState.players[socket.id].y = movementData.y
    gameState.players[socket.id].rotation = movementData.rotation

    socket.broadcast.emit('playerMoved', gameState.players[socket.id])
  })
});

http.listen(PORT, function () {
    console.log('Server started!');
});