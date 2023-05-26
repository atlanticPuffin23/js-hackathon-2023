const server = require('express')();
const http = require('http').createServer(server);
const io = require('socket.io')(http);

// type GameState = {
//     gameStatus: 'waiting' | 'countdown' | 'in-progress' | 'ended',
//     players: {
//       [playerId: string]: {
//         position: {
//           x: number,
//           y: number,
//         },
//         lives: number,
//         direction: 'up' | 'down' | 'left' | 'right',
//         status: 'active' | 'hit' | 'dead',
//         activeShots: Array<{
//           playerId: string,
//           position: {
//             x: number,
//             y: number,
//           },
//           direction: 'up' | 'down' | 'left' | 'right',
//         }>,
//       },
//     },
//     obstacles: Array<{x: number, y: number}>,
//     winnerId: string | null,
// };

const initialGameState = {
    gameStatus: 'waiting',
    players: {},
    obstacles: [],
    winnerId: null,
};
  
let gameState = {
    ...initialGameState
};  

io.on('connection', function (socket) {
  console.log('player [' + socket.id + '] connected')

  if (gameState.gameStatus === 'waiting') {
    gameState.players[socket.id] = {
      position: {
        x: 0,
        y: 0,
      },
      lives: 3,
      direction: 'up',
      status: 'active',
      activeShots: [],
    };

    if (Object.keys(gameState.players).length === 2) {
      gameState.gameStatus = 'countdown';

      setTimeout(() => {
        gameState.gameStatus = 'in-progress';
      }, 3000);
    }
  }

  // TODO: split into separate events (gameStatus)
  socket.emit('gameState', gameState);

  // socket.broadcast.emit('newPlayer', players[socket.id]) // ?
 
  socket.on('disconnect', function () {
    console.log('player [' + socket.id + '] disconnected')
    delete gameState.players[socket.id];

    if (Object.keys(gameState.players).length === 1) {
      gameState.gameStatus = 'ended';
      gameState.winnerId = Object.keys(gameState.players)[0];
    };

    io.emit('playerDisconnected', socket.id)
  })

  // socket.on('playerMovement', function (movementData) {
  //   players[socket.id].x = movementData.x
  //   players[socket.id].y = movementData.y
  //   players[socket.id].rotation = movementData.rotation

  //   socket.broadcast.emit('playerMoved', players[socket.id])
  // })
});

http.listen(3000, function () {
    console.log('Server started!');
});