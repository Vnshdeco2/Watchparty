const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // For production, replace with your frontend URL
    methods: ["GET", "POST"]
  }
});

// Store room state in memory
// roomID -> { password, users: [{id, name, ready}], active: bool }
const rooms = {};

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // --- Room Management ---

  socket.on('create-room', ({ roomId, password, userName }, callback) => {
    if (rooms[roomId]) {
      return callback({ success: false, message: "Room ID already exists." });
    }
    
    rooms[roomId] = {
      password,
      users: [{ id: socket.id, name: userName, ready: false, fileLoaded: false }],
      chatHistory: []
    };
    
    socket.join(roomId);
    callback({ success: true, room: rooms[roomId] });
  });

  socket.on('join-room', ({ roomId, password, userName }, callback) => {
    const room = rooms[roomId];

    if (!room) {
      return callback({ success: false, message: "Room not found." });
    }

    if (room.password && room.password !== password) {
      return callback({ success: false, message: "Incorrect password." });
    }

    // Auto-fix: Handle "Ghost Users" (Reconnections)
    // If a user with the same name joins, assume it's the same person reconnecting and remove the old entry.
    const existingIdx = room.users.findIndex(u => u.name === userName);
    if (existingIdx !== -1) {
       const oldUser = room.users[existingIdx];
       // 1. Remove old user from room state
       room.users.splice(existingIdx, 1);
       // 2. Notify clients (so they remove the old peer video/state)
       io.to(roomId).emit('user-left', { userId: oldUser.id, userName: oldUser.name });
    }

    if (room.users.length >= 2) {
      // Allow reconnect if IP/session matches? For now, hard limit to 2 active sockets.
      // A robust reconnect system would use persistent user IDs. 
      // Simplified: Just 2 active sockets.
      return callback({ success: false, message: "Room is full." });
    }

    room.users.push({ id: socket.id, name: userName, ready: false, fileLoaded: false });
    socket.join(roomId);
    
    // Notify others
    socket.to(roomId).emit('user-joined', { userName, userId: socket.id });
    
    callback({ 
      success: true, 
      room: { ...room, users: room.users } // Send current state
    });
  });

  // --- Status Updates ---

  socket.on('status-update', ({ roomId, type, value }) => {
    // type: 'fileLoaded' | 'ready'
    const room = rooms[roomId];
    if (!room) return;

    const user = room.users.find(u => u.id === socket.id);
    if (user) {
      user[type] = value;
      // Broadcast update
      io.to(roomId).emit('room-update', { users: room.users });
    }
  });

  // --- Sync Events ---

  socket.on('sync-action', (data) => {
    // data: { roomId, action, currentTime, isPlaying, playbackRate, ... }
    const { roomId } = data;
    // Broadcast to everyone else in the room
    socket.to(roomId).emit('sync-action', { ...data, senderId: socket.id });
  });

  // --- Chat ---

  socket.on('send-message', ({ roomId, message, userName }) => {
    const chatMsg = {
      id: Date.now() + Math.random(),
      text: message,
      senderId: socket.id,
      senderName: userName,
      timestamp: new Date().toISOString()
    };
    
    if (rooms[roomId]) {
      rooms[roomId].chatHistory.push(chatMsg);
       // Limited history
      if (rooms[roomId].chatHistory.length > 50) rooms[roomId].chatHistory.shift();
    }

    io.to(roomId).emit('receive-message', chatMsg);
  });

  // --- Disconnect ---

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // Find room and remove user
    for (const roomId in rooms) {
      const room = rooms[roomId];
      const userIndex = room.users.findIndex(u => u.id === socket.id);
      
      if (userIndex !== -1) {
        const user = room.users[userIndex];
        room.users.splice(userIndex, 1);
        
        io.to(roomId).emit('user-left', { userId: socket.id, userName: user.name });
        
        // If room empty, delete it after a timeout (to allow reconnects in real app, but here immediate or delayed)
        if (room.users.length === 0) {
          delete rooms[roomId];
        }
        break;
      }
    }
  });
});

const PORT = 8080;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
