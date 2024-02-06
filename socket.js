const http = require('http');
const { Server } = require('socket.io');
const app = require('./index')

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: 'https://atlas-game.netlify.app',
    methods: ['GET', 'POST']
  }
});

io.on("connection", (socket) => {
  console.log('user connected', socket.id);

  socket.on('send_message', (data) => {
    socket.to(data.room).emit('receive_message', {guesses: data.guesses, guess: data.guess})
  });
  

  socket.on('join_room', (room) => {
    let roomSize = io.sockets.adapter.rooms.get(room) ? io.sockets.adapter.rooms.get(room).size : 0;
    console.log(roomSize)
    if (roomSize < 2) {
      socket.join(room);
      console.log('user joined with id', socket.id, 'joined room', room);
    } else {
      console.log('room is full!');
    }
  });


  socket.on('disconnect', () => {
    console.log('user disconnected', socket.id);
  });

  socket.on('resign', (room) => {
    socket.to(room).emit('lost', room)
  })
});

module.exports = server