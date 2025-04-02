import { motion } from 'framer-motion';
import { Circle, X } from 'lucide-react';
import { BoardState, Player, Theme, GameSettings } from '../types';
import { getThemeClasses } from '../utils/theme';

interface BoardProps {
  board: BoardState;
  onCellClick: (index: number) => void;
  currentPlayer: Player;
  winningLine: number[] | null;
  disabled: boolean;
  winner: Player | 'draw' | null;
  theme: Theme;
  settings: GameSettings;
}

export const Board = ({ 
  board, 
  onCellClick, 
  currentPlayer, 
  winningLine, 
  disabled, 
  winner,
  theme,
  settings
}: BoardProps) => {
  const xColor = getThemeClasses(theme, 'xColor');
  const oColor = getThemeClasses(theme, 'oColor');
  const boardBg = settings.darkMode ? 'bg-gray-700' : getThemeClasses(theme, 'boardBg');
  
  // Animation settings
  const showAnimations = settings.showAnimations;
  const showHints = settings.showHints;
  
  // Animation speed based on settings
  const getAnimationDuration = () => {
    switch (settings.animationSpeed) {
      case 'slow': return 0.8;
      case 'fast': return 0.3;
      default: return 0.5;
    }
  };
  
  const cellBgClass = settings.darkMode 
    ? 'from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600' 
    : 'from-white to-gray-50 hover:from-gray-50 hover:to-gray-100';
    
  const winningCellClass = settings.darkMode
    ? 'from-green-700 to-green-800 ring-2 ring-green-500 shadow-green-900'
    : 'from-green-100 to-green-200 ring-2 ring-green-400 shadow-green-300';
    
  const resultBoxClass = settings.darkMode
    ? 'bg-gray-800 text-white'
    : 'bg-white text-gray-800';
  
  // Function to calculate line coordinates for each winning combination
  const getLineCoordinates = (winningLine: number[] | null) => {
    if (!winningLine || winningLine.length !== 3) return null;
    
    // Map winning combinations to line coordinates
    const coordinates = {
      // Rows
      '0,1,2': { x1: "10%", y1: "16.7%", x2: "90%", y2: "16.7%" },
      '3,4,5': { x1: "10%", y1: "50%",   x2: "90%", y2: "50%" },
      '6,7,8': { x1: "10%", y1: "83.3%", x2: "90%", y2: "83.3%" },
      
      // Columns
      '0,3,6': { x1: "16.7%", y1: "10%", x2: "16.7%", y2: "90%" },
      '1,4,7': { x1: "50%",   y1: "10%", x2: "50%",   y2: "90%" },
      '2,5,8': { x1: "83.3%", y1: "10%", x2: "83.3%", y2: "90%" },
      
      // Diagonals
      '0,4,8': { x1: "10%", y1: "10%", x2: "90%", y2: "90%" },
      '2,4,6': { x1: "90%", y1: "10%", x2: "10%", y2: "90%" }
    };
    
    const key = winningLine.join(',');
    return coordinates[key as keyof typeof coordinates] || null;
  };
  
  return (
    <div className="relative perspective-1000">
      <motion.div 
        className={`grid grid-cols-3 gap-3 p-4 rounded-xl ${boardBg} shadow-xl transform-style-3d`}
        initial={{ rotateX: showAnimations ? 25 : 0 }}
        animate={{ rotateX: 0 }}
        transition={{ 
          duration: getAnimationDuration(), 
          type: "spring", 
          damping: 20 
        }}
      >
        {board.map((cell, index) => (
          <motion.button
            key={index}
            className={`h-24 w-24 bg-gradient-to-br ${cellBgClass} rounded-xl shadow-md flex items-center justify-center
              ${disabled ? 'cursor-not-allowed' : ''}
              ${winningLine?.includes(index) ? winningCellClass : ''}
              transition-all duration-200`}
            onClick={() => onCellClick(index)}
            disabled={cell !== null || disabled}
            whileHover={cell === null && !disabled && showAnimations ? { 
              scale: 1.05, 
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
              y: -4 
            } : {}}
            whileTap={cell === null && !disabled && showAnimations ? { 
              scale: 0.95, 
              y: 0 
            } : {}}
            layout
            transition={{ 
              type: "spring", 
              stiffness: settings.animationSpeed === 'fast' ? 600 : 
                         settings.animationSpeed === 'medium' ? 500 : 400, 
              damping: 30 
            }}
          >
            {cell && (
              <motion.div
                initial={showAnimations ? { scale: 0, rotate: -180 } : { scale: 1 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 300, 
                  damping: 20, 
                  duration: getAnimationDuration() 
                }}
                className="w-full h-full flex items-center justify-center"
              >
                {cell === 'X' ? (
                  <motion.div
                    initial={showAnimations ? { pathLength: 0, opacity: 0 } : { pathLength: 1, opacity: 1 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ 
                      duration: getAnimationDuration(), 
                      ease: "easeInOut" 
                    }}
                  >
                    <X className={`w-12 h-12 ${xColor}`} strokeWidth={3} />
                  </motion.div>
                ) : (
                  <motion.div
                    initial={showAnimations ? { opacity: 0, scale: 0 } : { opacity: 1, scale: 1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ 
                      duration: getAnimationDuration() * 0.6, 
                      ease: "easeOut" 
                    }}
                  >
                    <Circle className={`w-12 h-12 ${oColor}`} strokeWidth={3} />
                  </motion.div>
                )}
              </motion.div>
            )}
            {!cell && !disabled && showHints && (
              <motion.div
                className="opacity-0 hover:opacity-40"
                initial={false}
                animate={{ 
                  scale: [0.8, 1, 0.8], 
                  opacity: [0, 0.3, 0] 
                }}
                transition={{ 
                  repeat: Infinity, 
                  repeatType: "loop", 
                  duration: settings.animationSpeed === 'slow' ? 3 : 
                             settings.animationSpeed === 'medium' ? 2 : 1.5, 
                  ease: "easeInOut" 
                }}
              >
                {currentPlayer === 'X' ? (
                  <X className={`w-12 h-12 ${xColor}`} strokeWidth={2} />
                ) : (
                  <Circle className={`w-12 h-12 ${oColor}`} strokeWidth={2} />
                )}
              </motion.div>
            )}
          </motion.button>
        ))}
      </motion.div>
      
      {winner && (
        <motion.div
          initial={showAnimations ? { scale: 0, opacity: 0 } : { scale: 1, opacity: 1 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: getAnimationDuration() }}
          className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 backdrop-blur-sm rounded-xl z-10"
        >
          <motion.div
            initial={showAnimations ? { y: -20, opacity: 0 } : { y: 0, opacity: 1 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 20, 
              duration: getAnimationDuration() 
            }}
            className={`${resultBoxClass} px-8 py-6 rounded-xl shadow-lg`}
          >
            <motion.h2 
              className={`text-3xl font-bold ${
                settings.darkMode ? 'text-white' : `bg-gradient-to-r ${getThemeClasses(theme, 'gradient')} text-transparent bg-clip-text`
              }`}
              animate={showAnimations ? { scale: [1, 1.1, 1] } : { scale: 1 }}
              transition={{ 
                duration: settings.animationSpeed === 'slow' ? 2 : 
                           settings.animationSpeed === 'medium' ? 1.5 : 1, 
                repeat: Infinity, 
                repeatType: "loop" 
              }}
            >
              {winner === 'draw' ? "It's a Draw!" : `${winner} Wins!`}
            </motion.h2>
          </motion.div>
        </motion.div>
      )}
      
      {/* Add winning line animation */}
      {winningLine && winningLine.length > 0 && showAnimations && (
        <motion.div 
          className="absolute inset-0 pointer-events-none z-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <svg className="w-full h-full absolute" style={{ zIndex: 2 }}>
            {(() => {
              const coords = getLineCoordinates(winningLine);
              if (!coords) return null;
              
              return (
                <motion.line
                  x1={coords.x1}
                  y1={coords.y1}
                  x2={coords.x2}
                  y2={coords.y2}
                  stroke={settings.darkMode ? '#ffffff' : `var(--${theme}-500)`}
                  strokeWidth="4"
                  strokeLinecap="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.8 }}
                  transition={{ 
                    duration: getAnimationDuration() * 1.6, 
                    ease: "easeOut" 
                  }}
                />
              );
            })()}
          </svg>
        </motion.div>
      )}
    </div>
  );
};