export type Player = 'X' | 'O';
export type BoardState = (Player | null)[];
export type GameMode = 'ai' | 'friend' | 'online' | 'random';
export type Difficulty = 'easy' | 'medium' | 'hard' | 'god';
export type RoomStatus = 'creating' | 'joining' | 'waiting' | 'playing' | 'ended' | 'searching';
export type Theme = 'blue' | 'purple' | 'green' | 'pink' | 'orange';
export type AnimationSpeed = 'slow' | 'medium' | 'fast';

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