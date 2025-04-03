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
    origin: "*", // Allow all origins
    methods: ["GET", "POST"],
    credentials: true
  }
});

const PORT = process.env.PORT || 3001;

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
  socket.on('create_room', (data = {}) => {
    try {
      // Generate a room code if one wasn't provided
      const roomCode = data?.roomCode || nanoid(6).toUpperCase();
      console.log(`Creating room with code: ${roomCode}`);
      
      rooms.set(roomCode, {
        players: [{ id: socket.id, symbol: 'X' }],
        currentTurn: 'X',
        board: Array(9).fill(null),
      });
      
      socket.join(roomCode);
      // Important: Send back the room code to the client
      socket.emit('room_created', { roomCode });
      console.log(`Room created: ${roomCode}`);
    } catch (error) {
      console.error('Error creating room:', error);
      socket.emit('error', 'Failed to create room');
    }
  });
  
  // Join an existing room
  socket.on('join_room', (data) => {
    try {
      const roomCode = data?.roomCode;
      
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
    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit('error', 'Failed to join room');
    }
  });
  
  // Make a move
  socket.on('make_move', (data) => {
    try {
      if (!data) return;
      
      const { position, symbol, board } = data;
      const socketRooms = Array.from(socket.rooms);
      const roomCode = socketRooms.length > 1 ? socketRooms[1] : null; // The second room is the game room
      
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
    } catch (error) {
      console.error('Error making move:', error);
      socket.emit('error', 'Failed to make move');
    }
  });
  
  // Find a random match
  socket.on('find_random_match', () => {
    try {
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
        const opponentSocket = io.sockets.sockets.get(opponentId);
        if (opponentSocket) {
          opponentSocket.join(roomCode);
        }
        
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
    } catch (error) {
      console.error('Error finding match:', error);
      socket.emit('error', 'Failed to find match');
    }
  });
  
  // Cancel match finding
  socket.on('cancel_random_match', () => {
    try {
      const index = waitingPlayers.indexOf(socket.id);
      if (index !== -1) {
        waitingPlayers.splice(index, 1);
        console.log(`Player ${socket.id} canceled matchmaking`);
      }
    } catch (error) {
      console.error('Error canceling match:', error);
    }
  });
  
  // Leave room
  socket.on('leave_room', () => {
    try {
      // Find what room this socket is in
      const socketRooms = Array.from(socket.rooms);
      // First room is always the socket ID room
      if (socketRooms.length > 1) {
        const roomCode = socketRooms[1];
        leaveRoom(socket, roomCode);
      }
    } catch (error) {
      console.error('Error leaving room:', error);
    }
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    try {
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
    } catch (error) {
      console.error('Error handling disconnect:', error);
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