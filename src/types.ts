export type Player = 'X' | 'O';
export type BoardState = (Player | null)[];
export type GameMode = 'ai' | 'friend' | 'online' | 'random' | 'infinity';
export type Difficulty = 'easy' | 'medium' | 'hard' | 'god';
export type RoomStatus = 'creating' | 'joining' | 'waiting' | 'playing' | 'ended' | 'searching';
export type Theme = 'blue' | 'purple' | 'green' | 'pink' | 'orange';
export type AnimationSpeed = 'slow' | 'medium' | 'fast';

// Track move history for Infinity mode (each player can only have 3 symbols)
export interface MoveInfo {
  player: Player;
  position: number;
  timestamp: number;
}

export interface GameState {
  board: BoardState;
  currentPlayer: Player;
  winner: Player | 'draw' | null;
  winningLine: number[] | null;
  difficulty?: Difficulty;
  roomCode?: string;
  playerSymbol?: Player;
  roomStatus?: RoomStatus;
  theme: Theme;
  showConfetti: boolean;
  // For Infinity mode - track moves in sequential order to know which one to remove
  moveHistory: MoveInfo[];
  // Symbols that are about to be removed (for fading effect)
  fadingSymbols: number[];
}

export interface GameSettings {
  theme: Theme;
  darkMode: boolean;
  soundEnabled: boolean;
  volume: number;
  showAnimations: boolean;
  animationSpeed: AnimationSpeed;
  showHints: boolean;
  hapticFeedback: boolean;
  showTimer: boolean;
}