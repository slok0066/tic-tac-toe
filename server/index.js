import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { nanoid } from 'nanoid';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? '*'  // Allow all origins in production to fix CORS issues
      : ["http://localhost:5173", "http://127.0.0.1:5173"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

const PORT = process.env.PORT || 3001;

// In production, serve the built React app
if (process.env.NODE_ENV === 'production') {
  // Serve static files from the React app
  const distPath = path.resolve(__dirname, '../dist');
  app.use(express.static(distPath));
  
  // For any route that doesn't match an API route, send the index.html
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Root route for health checks
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', serverTime: new Date().toISOString() });
});

// Test route for client connectivity
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is running!' });
});

// Game state
const rooms = new Map();
const waitingPlayers = [];

// Helper function to leave a room
const leaveRoom = (socket, roomCode) => {
  const room = rooms.get(roomCode);
  if (room) {
    // Notify the other player
    socket.to(roomCode).emit('player_left');
    
    // Clean up the room if both players have left
    const remainingPlayers = room.players.filter(p => p.id !== socket.id);
    if (remainingPlayers.length === 0) {
      rooms.delete(roomCode);
      console.log(`Room ${roomCode} deleted`);
    } else {
      // Update the room with remaining player
      rooms.set(roomCode, {
        ...room,
        players: remainingPlayers
      });
    }
    
    // Leave the socket.io room
    socket.leave(roomCode);
    console.log(`Player ${socket.id} left room ${roomCode}`);
  }
};

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);
  
  // Create a new room
  socket.on('create_room', (data) => {
    const roomCode = data.roomCode || nanoid(6).toUpperCase();
    
    rooms.set(roomCode, {
      players: [{ id: socket.id, symbol: 'X' }],
      currentTurn: 'X',
      board: Array(9).fill(null),
    });
    
    socket.join(roomCode);
    socket.emit('room_created', { roomCode });
    console.log(`Room created: ${roomCode}`);
  });
  
  // Join an existing room
  socket.on('join_room', (data) => {
    const roomCode = data.roomCode;
    
    if (!roomCode) {
      socket.emit('error', 'Room code is required');
      return;
    }
    
    const room = rooms.get(roomCode);
    
    if (!room) {
      socket.emit('error', 'Room not found');
      return;
    }
    
    if (room.players.length >= 2) {
      socket.emit('error', 'Room is full');
      return;
    }
    
    // Add the player to the room
    room.players.push({ id: socket.id, symbol: 'O' });
    socket.join(roomCode);
    
    // Notify both players that the game is starting
    io.to(roomCode).emit('game_start', {
      roomCode,
      isPlayerX: false,
      players: room.players.map(p => ({ id: p.id, symbol: p.symbol })),
      currentTurn: room.currentTurn
    });
    
    console.log(`Player ${socket.id} joined room ${roomCode}`);
  });
  
  // Make a move
  socket.on('make_move', (data) => {
    const { position, symbol, board } = data;
    const roomCode = Array.from(socket.rooms)[1]; // The second room is the game room
    
    if (!roomCode) {
      socket.emit('error', 'Not in any room');
      return;
    }
    
    const room = rooms.get(roomCode);
    if (!room) {
      socket.emit('error', 'Room not found');
      return;
    }
    
    const player = room.players.find(p => p.id === socket.id);
    if (!player) {
      socket.emit('error', 'Player not found in room');
      return;
    }
    
    // Validate that it's the player's turn
    if (room.currentTurn !== player.symbol) {
      socket.emit('error', 'Not your turn');
      return;
    }
    
    // Update the board
    if (position >= 0 && position < 9 && room.board[position] === null) {
      room.board[position] = player.symbol;
      room.currentTurn = player.symbol === 'X' ? 'O' : 'X';
      
      // Broadcast the move to all clients in the room
      io.to(roomCode).emit('move_made', {
        position,
        symbol: player.symbol,
        board: room.board,
        currentTurn: room.currentTurn
      });
      
      console.log(`Move made in room ${roomCode}: ${player.symbol} at position ${position}`);
    }
  });
  
  // Find a random match
  socket.on('find_random_match', () => {
    if (waitingPlayers.includes(socket.id)) return;
    
    if (waitingPlayers.length > 0) {
      const opponentId = waitingPlayers.shift();
      const roomCode = nanoid(6).toUpperCase();
      
      rooms.set(roomCode, {
        players: [
          { id: opponentId, symbol: 'X' },
          { id: socket.id, symbol: 'O' }
        ],
        currentTurn: 'X',
        board: Array(9).fill(null),
      });
      
      socket.join(roomCode);
      io.sockets.sockets.get(opponentId)?.join(roomCode);
      
      // Notify both players
      io.to(roomCode).emit('match_found', {
        roomCode,
        isPlayerX: false,
        players: rooms.get(roomCode).players.map(p => ({ id: p.id, symbol: p.symbol })),
        currentTurn: 'X',
      });
      
      console.log(`Random match created: ${roomCode}`);
    } else {
      waitingPlayers.push(socket.id);
      socket.emit('waiting_for_match');
      console.log(`Player ${socket.id} is waiting for a match`);
    }
  });
  
  // Cancel match finding
  socket.on('cancel_random_match', () => {
    const index = waitingPlayers.indexOf(socket.id);
    if (index !== -1) {
      waitingPlayers.splice(index, 1);
      console.log(`Player ${socket.id} canceled matchmaking`);
    }
  });
  
  // Leave room
  socket.on('leave_room', () => {
    // Find what room this socket is in
    const rooms = Array.from(socket.rooms);
    // First room is always the socket ID room
    if (rooms.length > 1) {
      const roomCode = rooms[1];
      leaveRoom(socket, roomCode);
    }
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    
    // Remove from waiting queue if present
    const index = waitingPlayers.indexOf(socket.id);
    if (index !== -1) {
      waitingPlayers.splice(index, 1);
    }
    
    // Handle leaving all rooms this socket is in
    for (const [roomCode, room] of rooms.entries()) {
      if (room.players.some(p => p.id === socket.id)) {
        leaveRoom(socket, roomCode);
      }
    }
  });
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 