import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from 'framer-motion';
import { Gamepad2, Users, Wifi, ArrowLeft, Globe, Settings as SettingsIcon } from 'lucide-react';
import { Board } from './components/Board';
import { DifficultyModal } from './components/DifficultyModal';
import { RoomModal } from './components/RoomModal';
import { RandomMatchModal } from './components/RandomMatchModal';
import { SettingsModal } from './components/SettingsModal';
import { checkWinner, getAIMove } from './utils/gameLogic';
import { GameState, GameMode, Player, Difficulty, RoomStatus, GameSettings } from './types';
import socket from './utils/socket';
import { getThemeClasses, applyTheme } from './utils/theme';
import { 
  initializeAudio, 
  playMoveSound, 
  playResultSound, 
  playClickSound,
  setSoundEnabled
} from './utils/sounds';

const initialGameState: GameState = {
  board: Array(9).fill(null),
  currentPlayer: 'X',
  winner: null,
  winningLine: null,
  theme: 'blue',
  showConfetti: false
};

const initialSettings: GameSettings = {
  theme: 'blue',
  darkMode: false,
  soundEnabled: true,
  volume: 80,
  showAnimations: true,
  animationSpeed: 'medium',
  showHints: true,
  hapticFeedback: false,
  showTimer: false
};

// Reusable Settings Button Component
const SettingsButton = ({ onClick, className = "" }: { onClick: () => void; className?: string }) => (
  <motion.button
    className={`p-2 ${className || 'bg-white/80 dark:bg-gray-700 text-gray-700 dark:text-white shadow-md hover:bg-white dark:hover:bg-gray-600'} backdrop-blur-sm rounded-full`}
    whileHover={{ scale: 1.1, rotate: 45 }}
    whileTap={{ scale: 0.9, rotate: 0 }}
    onClick={onClick}
    aria-label="Settings"
  >
    <SettingsIcon className="w-5 h-5" />
  </motion.button>
);

// Game Timer Component
const GameTimer = ({ enabled, darkMode, startTime }: { enabled: boolean; darkMode: boolean; startTime: Date | null }) => {
  const [seconds, setSeconds] = useState(0);
  
  useEffect(() => {
    if (enabled && startTime) {
      const interval = setInterval(() => {
        const elapsedSeconds = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);
        setSeconds(elapsedSeconds);
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [enabled, startTime]);
  
  // Reset seconds when startTime changes
  useEffect(() => {
    if (startTime) {
      setSeconds(0);
    }
  }, [startTime]);
  
  if (!enabled || !startTime) return null;
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`absolute top-0 right-0 m-2 px-3 py-1 rounded-full text-sm font-mono 
        ${darkMode ? 'bg-gray-800 text-white' : 'bg-white/80 text-gray-800'} shadow-md`}
    >
      {String(minutes).padStart(2, '0')}:{String(remainingSeconds).padStart(2, '0')}
    </motion.div>
  );
};

// Add this error boundary component
class ErrorBoundary extends React.Component<{ children: React.ReactNode, fallback: React.ReactNode }> {
  state = { hasError: false, error: null };
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// Check if we're likely on a low-end device
const isLowEndDevice = window.navigator.hardwareConcurrency 
  ? window.navigator.hardwareConcurrency <= 4
  : true; // Assume low-end if we can't detect

function App() {
  const [gameMode, setGameMode] = useState<GameMode | null>(null);
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const [settings, setSettings] = useState<GameSettings>(initialSettings);
  const [showDifficultyModal, setShowDifficultyModal] = useState(false);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [showRandomMatchModal, setShowRandomMatchModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [gameStartTime, setGameStartTime] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Reduce the number of background elements for low-end devices
  const bgElementCount = isLowEndDevice ? 2 : 5;

  // Initialize socket connection and audio when app loads
  useEffect(() => {
    try {
      // Socket is already initialized via the import
      console.log("App: Socket already initialized", socket.id);
      // Connect if not already connected
      if (!socket.connected) {
        socket.connect();
      }
      
      initializeAudio();
      
      return () => {
        // Clean up socket listeners
        socket.off();
      };
    } catch (err) {
      console.error("Failed to initialize app:", err);
      setError("Failed to initialize application. Please refresh the page.");
    }
  }, []);

  // Update sound enabled state when settings change
  useEffect(() => {
    try {
      setSoundEnabled(settings.soundEnabled);
    } catch (err) {
      console.error("Failed to update sound settings:", err);
    }
  }, [settings.soundEnabled]);

  // Subscribe to socket events for online play
  useEffect(() => {
    if (gameMode === 'online') {
      try {
        // Handle incoming moves from opponent
        const handleOpponentMove = (data: { position: number; symbol: string; board: any[]; currentTurn: string }) => {
          setGameState(prev => {
            try {
              const { winner, line } = checkWinner(data.board);
              
              // Play move sound
              playMoveSound(data.symbol as Player);
              
              // Remove confetti animation for wins
              const showConfetti = false; // Always set to false to disable win animation
              
              if (winner) {
                // Small delay to ensure sound plays after the move sound
                setTimeout(() => {
                  playResultSound(winner === 'draw' ? 'draw' : 'win');
                  console.log(`Online: Playing ${winner === 'draw' ? 'draw' : 'win'} sound`);
                }, 300);
              }
              
              return {
                ...prev,
                board: data.board,
                currentPlayer: data.currentTurn as Player,
                winner,
                winningLine: line,
                showConfetti
              };
            } catch (err) {
              console.error("Error in handleOpponentMove:", err);
              return prev;
            }
          });
        };

        // Handle game start event
        const handleGameStart = (data: any) => {
          try {
            setGameState(prev => ({
              ...prev,
              roomStatus: 'playing',
              playerSymbol: data.players.find((p: any) => p.id === (window as any).socket?.id)?.symbol || 'X',
              currentPlayer: 'X' // Game always starts with X
            }));
          } catch (err) {
            console.error("Error in handleGameStart:", err);
            setError("Error starting game. Please try again.");
          }
        };

        // Handle player leaving
        const handlePlayerLeft = () => {
          try {
            setGameState(prev => ({
              ...prev,
              roomStatus: 'ended'
            }));
            alert("Your opponent has left the game.");
          } catch (err) {
            console.error("Error in handlePlayerLeft:", err);
          }
        };

        // Handle connection errors
        const handleConnectionError = (err: any) => {
          console.error("Socket connection error:", err);
          setError("Connection error. Please check your internet connection and try again.");
        };

        // Subscribe to opponent moves
        socket.on('move_made', handleOpponentMove);
        
        // Handle game start event
        socket.on('game_start', (data: { roomCode: string; isPlayerX: boolean }) => {
          handleGameStart(data);
        });
        
        // Handle player disconnection
        socket.on('player_left', handlePlayerLeft);
        
        return () => {
          // Clean up socket listeners
          socket.off('move_made');
          socket.off('game_start');
          socket.off('player_left');
        };
      } catch (err) {
        console.error("Failed to subscribe to socket events:", err);
        setError("Connection to game server failed. Please try again.");
      }
    }
  }, [gameMode]);

  // Cleanup when leaving a room
  useEffect(() => {
    return () => {
      if (gameState.roomCode) {
        socket.emit('leave_room');
      }
    };
  }, [gameState.roomCode]);

  const handleCellClick = (index: number) => {
    if (gameState.board[index] || gameState.winner) return;

    // For online games, only allow moves for the current player
    if (gameMode === 'online' && gameState.currentPlayer !== gameState.playerSymbol) return;

    const newBoard = [...gameState.board];
    newBoard[index] = gameState.currentPlayer;
    
    // Play move sound
    playMoveSound(gameState.currentPlayer);
    
    const { winner, line } = checkWinner(newBoard);
    
    // Play result sound if there's a winner
    if (winner) {
      setTimeout(() => {
        playResultSound(winner === 'draw' ? 'draw' : 'win');
        console.log(`Playing ${winner === 'draw' ? 'draw' : 'win'} sound`);
      }, 300);
    }
    
    // Always set showConfetti to false to disable win animation
    const showConfetti = false;
    
    // Update local game state
    setGameState(prev => ({
      ...prev,
      board: newBoard,
      currentPlayer: prev.currentPlayer === 'X' ? 'O' : 'X',
      winner,
      winningLine: line,
      showConfetti
    }));

    // For online mode, emit move to socket
    if (gameMode === 'online') {
      socket.emit('make_move', {
        position: index,
        symbol: gameState.currentPlayer,
        board: newBoard
      });
    }
  };

  // AI move logic
  useEffect(() => {
    if (gameMode === 'ai' && gameState.currentPlayer === 'O' && !gameState.winner && gameState.difficulty) {
      const timer = setTimeout(() => {
        const aiMove = getAIMove(gameState.board, gameState.difficulty!);
        
        // Only make a move if aiMove is valid
        if (aiMove >= 0) {
        handleCellClick(aiMove);
        }
      }, 600);
      
      return () => clearTimeout(timer);
    }
  }, [gameState.currentPlayer, gameMode, gameState.board, gameState.difficulty, gameState.winner]);

  const resetGame = () => {
    playClickSound();
    
    // Reset timer if needed
    if (settings.showTimer) {
      setGameStartTime(new Date());
    }
    
    setGameState(prev => ({ 
      ...initialGameState, 
      difficulty: prev.difficulty,
      roomCode: prev.roomCode,
      playerSymbol: prev.playerSymbol,
      roomStatus: prev.roomStatus,
      theme: settings.theme
    }));
  };

  const handleGameModeSelect = (mode: GameMode) => {
    // Initialize audio on first user interaction
    initializeAudio();
    playClickSound();
    
    // Start timer for new game
    if (settings.showTimer) {
      setGameStartTime(new Date());
    }
    
    if (mode === 'ai') {
      setShowDifficultyModal(true);
    } else if (mode === 'online') {
      setShowRoomModal(true);
    } else if (mode === 'random') {
      setShowRandomMatchModal(true);
    } else {
      setGameMode(mode);
      resetGame();
    }
  };

  const handleDifficultySelect = (difficulty: Difficulty) => {
    playClickSound();
    setGameMode('ai');
    setGameState(prev => ({ ...prev, difficulty, theme: settings.theme }));
    setShowDifficultyModal(false);
  };

  const handleCreateRoom = (roomCode: string) => {
    playClickSound();
    socket.emit('create_room', { roomCode });
    setGameMode('online');
    setGameState(prev => ({
      ...prev,
      roomCode: roomCode,
      roomStatus: 'waiting',
      playerSymbol: 'X',
      theme: settings.theme
    }));
    setShowRoomModal(false);
  };

  const handleJoinRoom = (roomCode: string) => {
    playClickSound();
    socket.emit('join_room', { roomCode });
    setGameMode('online');
    setGameState(prev => ({
      ...prev,
      roomCode: roomCode,
      roomStatus: 'joining',
      playerSymbol: 'O',
      theme: settings.theme
    }));
    setShowRoomModal(false);
  };

  const handleRandomMatch = (roomCode: string, isPlayerX: boolean) => {
    playClickSound();
    setGameMode('online');
    setGameState(prev => ({
      ...prev,
      roomCode: roomCode,
      roomStatus: 'playing',
      playerSymbol: isPlayerX ? 'X' : 'O',
      theme: settings.theme
    }));
    setShowRandomMatchModal(false);
  };

  const handleSaveSettings = (newSettings: GameSettings) => {
    // Initialize audio if needed
    initializeAudio();
    playClickSound();
    setSettings(newSettings);
    setGameState(prev => ({
      ...prev,
      theme: newSettings.theme
    }));
  };

  const getGameStatus = () => {
    if (gameState.winner === 'draw') return "It's a draw!";
    if (gameState.winner) return `${gameState.winner} wins!`;
    if (gameState.roomStatus === 'waiting') return "Waiting for opponent...";
    if (gameState.roomStatus === 'joining') return "Joining game...";
    if (gameState.roomStatus === 'ended') return "Opponent left the game";
    return `${gameState.currentPlayer}'s turn`;
  };

  const handleBackToMenu = () => {
    playClickSound();
    // Clean up any ongoing games or connections
    if (gameState.roomCode) {
      socket.emit('leave_room');
    }
    setGameMode(null);
    setGameState({...initialGameState, theme: settings.theme});
  };

  // Dynamic classes based on dark mode setting
  const bgClass = settings.darkMode 
    ? "bg-gradient-to-br from-gray-900 to-gray-800" 
    : applyTheme(settings.theme, "bg-gradient-to-br", 'bg');
    
  const contentBgClass = settings.darkMode 
    ? "bg-gray-800/90 text-white" 
    : "bg-white/90";
    
  const buttonBgClass = settings.darkMode 
    ? "bg-gray-700 hover:bg-gray-600 text-white" 
    : "bg-white/80 text-gray-600 hover:text-gray-800";

  const primaryClass = getThemeClasses(settings.theme, 'primary');
  const secondaryClass = getThemeClasses(settings.theme, 'secondary');
  const gradientClass = getThemeClasses(settings.theme, 'gradient');

  // Error Handling UI
  if (error) {
    return (
      <div className={`min-h-screen ${bgClass} flex items-center justify-center p-4`}>
        <div className="bg-white/90 backdrop-blur-sm p-8 rounded-xl shadow-xl max-w-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-700 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-5 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Refresh Application
          </button>
        </div>
      </div>
    );
  }

  if (!gameMode) {
    return (
      <ErrorBoundary
        fallback={
          <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-blue-500 to-purple-600 text-white">
            <div className="bg-white/10 backdrop-blur-md p-8 rounded-xl shadow-xl max-w-md w-full">
              <h1 className="text-2xl font-bold mb-4">Oops! Something went wrong</h1>
              <p className="mb-6">We encountered an error while loading the game. Please try the following:</p>
              <ul className="list-disc pl-5 mb-6">
                <li className="mb-2">Refresh the page</li>
                <li className="mb-2">Clear your browser cache</li>
                <li className="mb-2">Try a different browser</li>
                <li>If the problem persists, please try again later</li>
              </ul>
              <button 
                onClick={() => window.location.reload()} 
                className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
              >
                Refresh Page
              </button>
            </div>
          </div>
        }
      >
        <div className={`min-h-screen ${bgClass} flex items-center justify-center p-4 relative overflow-hidden`}>
          {/* Subtle animated background for the game board - reduced for mobile */}
          <div className="absolute inset-0 overflow-hidden">
            {Array.from({ length: bgElementCount }).map((_, i) => (
              <motion.div
                key={i}
                className={`absolute rounded-full ${settings.darkMode ? 'bg-gray-600' : 'bg-white'} opacity-10`}
                initial={{
                  x: `${Math.random() * 100}vw`,
                  y: `${Math.random() * 100}vh`,
                  scale: Math.random() * 0.5 + 0.5,
                }}
                animate={settings.showAnimations && !isLowEndDevice ? {
                  y: [`${Math.random() * 100}vh`, `${Math.random() * 100}vh`],
                  x: [`${Math.random() * 100}vw`, `${Math.random() * 100}vw`],
                } : {}}
                transition={{
                  duration: Math.random() * 20 + 10,
                  repeat: Infinity,
                  repeatType: "reverse",
                }}
                style={{
                  width: `${Math.random() * 100 + 50}px`,
                  height: `${Math.random() * 100 + 50}px`,
                  filter: 'blur(8px)',
                }}
              />
            ))}
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: isLowEndDevice ? 10 : 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${contentBgClass} backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-white/50 relative`}
            transition={{ 
              duration: settings.animationSpeed === 'slow' ? 0.7 : 
                        settings.animationSpeed === 'medium' ? 0.5 : 0.3 
            }}
          >
            <div className="absolute top-4 right-4">
              <SettingsButton 
                onClick={() => setShowSettingsModal(true)} 
                className={`${settings.darkMode ? 'bg-gray-700/80 text-gray-200 hover:bg-gray-600 hover:text-white' : 'bg-white/80 text-gray-700 hover:bg-white hover:text-gray-900'} shadow-lg`}
              />
            </div>
            
            <motion.h1 
              className={`text-4xl sm:text-5xl font-bold mb-8 ${
                settings.darkMode ? 
                  'text-white' : 
                  `bg-gradient-to-r ${gradientClass} text-transparent bg-clip-text`
              }`}
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ 
                type: isLowEndDevice ? "tween" : "spring", 
                stiffness: settings.animationSpeed === 'slow' ? 200 : 
                          settings.animationSpeed === 'medium' ? 300 : 400, 
                damping: 20,
                duration: isLowEndDevice ? 0.3 : undefined
              }}
            >
              Tic Tac Toe
            </motion.h1>
            
            <div className="space-y-4">
              <motion.button
                whileHover={settings.showAnimations && !isLowEndDevice ? 
                  { scale: 1.03, x: 3, boxShadow: "0 15px 20px -5px rgba(0, 0, 0, 0.1), 0 8px 8px -5px rgba(0, 0, 0, 0.04)" } : 
                  { scale: 1 }
                }
                whileTap={{ scale: settings.showAnimations ? 0.97 : 1 }}
                transition={{ 
                  duration: settings.animationSpeed === 'slow' ? 0.3 : 
                            settings.animationSpeed === 'medium' ? 0.2 : 0.1 
                }}
                className={`w-72 p-4 bg-gradient-to-r ${primaryClass} rounded-xl shadow-lg flex items-center justify-center space-x-3 text-white hover:from-blue-600 hover:to-blue-700 transform transition-all`}
                onClick={() => handleGameModeSelect('friend')}
              >
                <Users className="w-6 h-6" />
                <span className="font-semibold text-lg">Play with Friend</span>
              </motion.button>
              <motion.button
                whileHover={settings.showAnimations && !isLowEndDevice ? 
                  { scale: 1.03, x: 3, boxShadow: "0 15px 20px -5px rgba(0, 0, 0, 0.1), 0 8px 8px -5px rgba(0, 0, 0, 0.04)" } : 
                  { scale: 1 }
                }
                whileTap={{ scale: settings.showAnimations ? 0.97 : 1 }}
                transition={{ 
                  duration: settings.animationSpeed === 'slow' ? 0.3 : 
                            settings.animationSpeed === 'medium' ? 0.2 : 0.1
                }}
                className={`w-72 p-4 bg-gradient-to-r ${secondaryClass} rounded-xl shadow-lg flex items-center justify-center space-x-3 text-white hover:from-purple-600 hover:to-purple-700 transform transition-all`}
                onClick={() => handleGameModeSelect('ai')}
              >
                <Gamepad2 className="w-6 h-6" />
                <span className="font-semibold text-lg">Play with AI</span>
              </motion.button>
              <motion.button
                whileHover={settings.showAnimations && !isLowEndDevice ? 
                  { scale: 1.03, x: 3, boxShadow: "0 15px 20px -5px rgba(0, 0, 0, 0.1), 0 8px 8px -5px rgba(0, 0, 0, 0.04)" } : 
                  { scale: 1 }
                }
                whileTap={{ scale: settings.showAnimations ? 0.97 : 1 }}
                transition={{ 
                  duration: settings.animationSpeed === 'slow' ? 0.3 : 
                            settings.animationSpeed === 'medium' ? 0.2 : 0.1
                }}
                className="w-72 p-4 bg-gradient-to-r from-pink-500 to-pink-600 rounded-xl shadow-lg flex items-center justify-center space-x-3 text-white hover:from-pink-600 hover:to-pink-700 transform transition-all"
                onClick={() => handleGameModeSelect('online')}
              >
                <Wifi className="w-6 h-6" />
                <span className="font-semibold text-lg">Create/Join Room</span>
              </motion.button>
              <motion.button
                whileHover={settings.showAnimations && !isLowEndDevice ? 
                  { scale: 1.03, x: 3, boxShadow: "0 15px 20px -5px rgba(0, 0, 0, 0.1), 0 8px 8px -5px rgba(0, 0, 0, 0.04)" } : 
                  { scale: 1 }
                }
                whileTap={{ scale: settings.showAnimations ? 0.97 : 1 }}
                transition={{ 
                  duration: settings.animationSpeed === 'slow' ? 0.3 : 
                            settings.animationSpeed === 'medium' ? 0.2 : 0.1
                }}
                className="w-72 p-4 bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg flex items-center justify-center space-x-3 text-white hover:from-green-600 hover:to-green-700 transform transition-all"
                onClick={() => handleGameModeSelect('random')}
              >
                <Globe className="w-6 h-6" />
                <span className="font-semibold text-lg">Random Match</span>
              </motion.button>
            </div>
          </motion.div>

          <AnimatePresence>
            {showDifficultyModal && (
              <DifficultyModal
                onSelect={handleDifficultySelect}
                onClose={() => setShowDifficultyModal(false)}
              />
            )}
            {showRoomModal && (
              <RoomModal
                onCreateRoom={handleCreateRoom}
                onJoinRoom={handleJoinRoom}
                onClose={() => setShowRoomModal(false)}
              />
            )}
            {showRandomMatchModal && (
              <RandomMatchModal
                onMatchFound={handleRandomMatch}
                onClose={() => setShowRandomMatchModal(false)}
              />
            )}
            {showSettingsModal && (
              <SettingsModal
                settings={settings}
                onSave={handleSaveSettings}
                onClose={() => setShowSettingsModal(false)}
              />
            )}
          </AnimatePresence>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-blue-500 to-purple-600 text-white">
          <div className="bg-white/10 backdrop-blur-md p-8 rounded-xl shadow-xl max-w-md w-full">
            <h1 className="text-2xl font-bold mb-4">Oops! Something went wrong</h1>
            <p className="mb-6">We encountered an error while loading the game. Please try the following:</p>
            <ul className="list-disc pl-5 mb-6">
              <li className="mb-2">Refresh the page</li>
              <li className="mb-2">Clear your browser cache</li>
              <li className="mb-2">Try a different browser</li>
              <li>If the problem persists, please try again later</li>
            </ul>
            <button 
              onClick={() => window.location.reload()} 
              className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      }
    >
      <div className={`min-h-screen ${bgClass} flex items-center justify-center p-4 relative overflow-hidden`}>
        {/* Subtle animated background for the game board */}
        <div className="absolute inset-0 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <motion.div
              key={i}
              className={`absolute rounded-full ${settings.darkMode ? 'bg-gray-600' : 'bg-white'} opacity-10`}
              initial={{
                x: `${Math.random() * 100}vw`,
                y: `${Math.random() * 100}vh`,
                scale: Math.random() * 0.5 + 0.5,
              }}
              animate={{
                y: [`${Math.random() * 100}vh`, `${Math.random() * 100}vh`],
                x: [`${Math.random() * 100}vw`, `${Math.random() * 100}vw`],
              }}
              transition={{
                duration: Math.random() * 20 + 10,
                repeat: Infinity,
                repeatType: "reverse",
              }}
              style={{
                width: `${Math.random() * 100 + 50}px`,
                height: `${Math.random() * 100 + 50}px`,
                filter: 'blur(8px)',
              }}
            />
          ))}
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${contentBgClass} backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-white/50 relative`}
          transition={{ 
            duration: settings.animationSpeed === 'slow' ? 0.7 : 
                      settings.animationSpeed === 'medium' ? 0.5 : 0.3 
          }}
        >
          {settings.showTimer && <GameTimer enabled={!!gameMode} darkMode={settings.darkMode} startTime={gameStartTime} />}
          
          <div className="text-center mb-6 relative h-10">
            <div className="absolute left-0 h-10 w-10 flex items-center justify-center">
            <motion.button
                whileHover={{ scale: settings.showAnimations ? 1.1 : 1 }}
                whileTap={{ scale: settings.showAnimations ? 0.9 : 1 }}
                className={`${buttonBgClass} p-2 rounded-full shadow-md`}
                onClick={handleBackToMenu}
              >
                <ArrowLeft className="w-5 h-5" />
            </motion.button>
            </div>
            
            <div className="absolute right-0 h-10 w-10 flex items-center justify-center">
              <SettingsButton 
                onClick={() => setShowSettingsModal(true)} 
                className={buttonBgClass}
              />
            </div>
            
            <div className="inline-block">
              <motion.h1 
                className={`text-3xl font-bold ${settings.darkMode ? 'text-white' : `bg-gradient-to-r ${gradientClass} text-transparent bg-clip-text`} mb-2`}
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
              Tic Tac Toe
              </motion.h1>
            </div>
          </div>
          
          <div className="text-center mb-4">
            {gameMode === 'ai' && (
              <motion.p 
                className={`text-lg ${settings.darkMode ? 'text-gray-300' : 'text-gray-600'}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                AI Difficulty: <span className={`font-semibold ${gameState.difficulty === 'god' ? 'text-red-500' : ''}`}>{gameState.difficulty}</span>
              </motion.p>
            )}
            {gameMode === 'online' && gameState.roomCode && (
              <motion.p 
                className={`text-lg ${settings.darkMode ? 'text-gray-300' : 'text-gray-600'}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                Room: <span className="font-mono font-semibold">{gameState.roomCode}</span>
                {gameState.playerSymbol && <span className="ml-2">(You: {gameState.playerSymbol})</span>}
              </motion.p>
            )}
            <motion.p 
              className={`text-lg ${settings.darkMode ? 'text-gray-300' : 'text-gray-600'}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {getGameStatus()}
            </motion.p>
          </div>

          <Board
            board={gameState.board}
            onCellClick={(index) => {
              // Try to trigger haptic feedback if enabled
              if (settings.hapticFeedback && 'navigator' in window && 'vibrate' in navigator) {
                try {
                  navigator.vibrate(50);
                } catch (e) {
                  console.log('Vibration not supported');
                }
              }
              handleCellClick(index);
            }}
            currentPlayer={gameState.currentPlayer}
            winningLine={gameState.winningLine}
            disabled={
              (gameMode === 'ai' && gameState.currentPlayer === 'O') ||
              (gameMode === 'online' && gameState.currentPlayer !== gameState.playerSymbol) ||
              gameState.roomStatus === 'waiting' || 
              gameState.roomStatus === 'joining' ||
              gameState.roomStatus === 'ended'
            }
            winner={gameState.winner}
            theme={settings.theme}
            settings={settings}
          />

          <motion.div 
            className="mt-6 flex justify-center space-x-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <motion.button
              whileHover={{ scale: settings.showAnimations ? 1.05 : 1, y: -2 }}
              whileTap={{ scale: settings.showAnimations ? 0.95 : 1, y: 0 }}
              className={`px-6 py-2 bg-gradient-to-r ${primaryClass} rounded-lg text-white hover:from-blue-600 hover:to-blue-700 font-semibold shadow-md`}
              onClick={resetGame}
            >
              New Game
            </motion.button>
          </motion.div>
        </motion.div>
        
        <AnimatePresence>
          {showSettingsModal && (
            <SettingsModal
              settings={settings}
              onSave={handleSaveSettings}
              onClose={() => setShowSettingsModal(false)}
            />
          )}
        </AnimatePresence>
      </div>
    </ErrorBoundary>
  );
}

export default App;