import { io } from 'socket.io-client';

// Determine the server URL based on environment
const getServerUrl = () => {
  if (import.meta.env.PROD) {
    // In production, use the current domain (Vercel deployment)
    return window.location.origin;
  }
  // In development, use localhost with port
  return 'http://localhost:3002';
};

// Initialize socket with the appropriate URL
const socket = io(getServerUrl(), { 
  autoConnect: false,
  transports: ['websocket', 'polling'] 
});

// Export the socket instance for global use
export { socket };

export const initializeSocket = () => {
  if (!socket.connected) {
    socket.connect();
  }

  socket.on('connect', () => {
    console.log('Connected to game server');
  });

  socket.on('disconnect', () => {
    console.log('Disconnected from game server');
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
};

export const createRoom = () => {
  socket.emit('createRoom');
  return new Promise<string>((resolve) => {
    socket.once('roomCreated', (roomCode: string) => {
      resolve(roomCode);
    });
  });
};

export const joinRoom = (roomCode: string) => {
  socket.emit('joinRoom', roomCode);
};

export const findRandomMatch = () => {
  socket.emit('findMatch');
};

export const cancelRandomMatch = () => {
  socket.emit('cancelMatch');
};

export const leaveRoom = (roomCode: string) => {
  socket.emit('leaveRoom', roomCode);
};

export const makeMove = (roomCode: string, position: number) => {
  socket.emit('makeMove', { roomCode, position });
};

export const subscribeToMoves = (callback: (data: { position: number, symbol: string, board: any[], currentTurn: string }) => void) => {
  socket.on('moveMade', callback);
};

export const subscribeToGameStart = (callback: (data: any) => void) => {
  socket.on('gameStart', callback);
};

export const subscribeToMatchFound = (callback: (data: any) => void) => {
  socket.on('matchFound', callback);
};

export const subscribeToWaitingForMatch = (callback: () => void) => {
  socket.on('waitingForMatch', callback);
};

export const subscribeToPlayerLeft = (callback: () => void) => {
  socket.on('playerLeft', callback);
};

export const cleanup = () => {
  socket.off('connect');
  socket.off('disconnect');
  socket.off('error');
  socket.off('moveMade');
  socket.off('gameStart');
  socket.off('matchFound');
  socket.off('waitingForMatch');
  socket.off('playerLeft');
  socket.disconnect();
};