import express from 'express';
import http from 'http';
import { Server } from 'socket.io';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const users = {};

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('joinRoom', ({ username, room }) => {
    socket.join(room);
    users[socket.id] = { username, room };

    socket.emit('message', { sender: 'Server', text: `Welcome ${username}!` });
    socket.to(room).emit('message', { sender: 'Server', text: `${username} joined.` });

    const roomUsers = Object.values(users)
      .filter(u => u.room === room)
      .map(u => u.username);
    io.to(room).emit('roomUsers', roomUsers);
  });

  socket.on('chatMessage', (message) => {
    const user = users[socket.id];
    if (user) {
      io.to(user.room).emit('message', { sender: user.username, text: message });
    }
  });

  socket.on('disconnect', () => {
    const user = users[socket.id];
    if (user) {
      socket.to(user.room).emit('message', { sender: 'Server', text: `${user.username} left.` });

      delete users[socket.id];

      const roomUsers = Object.values(users)
        .filter(u => u.room === user.room)
        .map(u => u.username);
      io.to(user.room).emit('roomUsers', roomUsers);
    }
    console.log('User disconnected:', socket.id);
  });
});

server.listen(3000, () => {
  console.log('Server running at http://localhost:3000');
});
