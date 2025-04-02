import { BoardState, Player, Difficulty } from '../types';

export const WINNING_COMBINATIONS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
  [0, 4, 8], [2, 4, 6] // Diagonals
];

export const checkWinner = (board: BoardState): { winner: Player | 'draw' | null; line: number[] | null } => {
  for (const combo of WINNING_COMBINATIONS) {
    const [a, b, c] = combo;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line: combo };
    }
  }

  if (board.every(cell => cell !== null)) {
    return { winner: 'draw', line: null };
  }

  return { winner: null, line: null };
};

// Minimax algorithm with alpha-beta pruning for efficiency
const minimax = (board: BoardState, depth: number, isMaximizing: boolean, alpha: number = -Infinity, beta: number = Infinity): number => {
  const { winner } = checkWinner(board);
  
  if (winner === 'O') return 10 - depth;
  if (winner === 'X') return depth - 10;
  if (winner === 'draw') return 0;

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (let i = 0; i < board.length; i++) {
      if (board[i] === null) {
        board[i] = 'O';
        const evalScore = minimax(board, depth + 1, false, alpha, beta);
        board[i] = null;
        maxEval = Math.max(maxEval, evalScore);
        alpha = Math.max(alpha, evalScore);
        if (beta <= alpha) break; // Alpha-beta pruning
      }
    }
    return maxEval;
  } else {
    let minEval = Infinity;
  for (let i = 0; i < board.length; i++) {
    if (board[i] === null) {
        board[i] = 'X';
        const evalScore = minimax(board, depth + 1, true, alpha, beta);
      board[i] = null;
        minEval = Math.min(minEval, evalScore);
        beta = Math.min(beta, evalScore);
        if (beta <= alpha) break; // Alpha-beta pruning
      }
    }
    return minEval;
  }
};

export const getAIMove = (board: BoardState, difficulty: Difficulty): number => {
  const availableMoves = board.reduce<number[]>((acc, cell, index) => {
    if (cell === null) acc.push(index);
    return acc;
  }, []);

  // If no moves available, return -1 (invalid move)
  if (availableMoves.length === 0) return -1;

  // Easy: Random moves
  if (difficulty === 'easy') {
    return availableMoves[Math.floor(Math.random() * availableMoves.length)];
  }

  // Medium: Mix of smart and random moves
  if (difficulty === 'medium') {
    if (Math.random() > 0.7) {
      return availableMoves[Math.floor(Math.random() * availableMoves.length)];
    }
  }

  // For Medium, Hard & God: Try to win or block
  for (const move of availableMoves) {
    // Check if AI can win
    const testBoard = [...board];
    testBoard[move] = 'O';
    if (checkWinner(testBoard).winner === 'O') {
      return move;
    }

    // Check if need to block player
    testBoard[move] = 'X';
    if (checkWinner(testBoard).winner === 'X') {
      return move;
    }
  }

  // God: Perfect play using minimax with no randomness
  if (difficulty === 'god') {
    let bestScore = -Infinity;
    let bestMove = availableMoves[0];

    for (const move of availableMoves) {
      const testBoard = [...board];
      testBoard[move] = 'O';
      const score = minimax(testBoard, 0, false);
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }
    return bestMove;
  }

  // Hard: Use minimax but occasionally make non-optimal moves
  if (difficulty === 'hard') {
    // 80% of the time, play optimally
    if (Math.random() < 0.8) {
      let bestScore = -Infinity;
      let bestMove = availableMoves[0];

      for (const move of availableMoves) {
        const testBoard = [...board];
        testBoard[move] = 'O';
        const score = minimax(testBoard, 0, false);
        if (score > bestScore) {
          bestScore = score;
          bestMove = move;
        }
      }
      return bestMove;
    }
  }

  // If center is available, take it
  if (board[4] === null) return 4;

  // Otherwise, choose random corner or side
  return availableMoves[Math.floor(Math.random() * availableMoves.length)];
};