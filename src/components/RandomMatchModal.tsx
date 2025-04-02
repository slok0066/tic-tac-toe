import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import { findRandomMatch, cancelRandomMatch, subscribeToMatchFound, subscribeToWaitingForMatch } from '../utils/socket';

interface RandomMatchModalProps {
  onMatchFound: (roomCode: string, isPlayerX: boolean) => void;
  onClose: () => void;
}

export const RandomMatchModal = ({ onMatchFound, onClose }: RandomMatchModalProps) => {
  const [isSearching, setIsSearching] = useState(false);
  const [searchTime, setSearchTime] = useState(0);

  useEffect(() => {
    let timer: number;
    if (isSearching) {
      timer = window.setInterval(() => {
        setSearchTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isSearching]);

  useEffect(() => {
    // Handle waiting for match
    const handleWaiting = () => {
      setIsSearching(true);
    };
    
    // Handle when a match is found
    const handleMatchFound = (data: any) => {
      const isPlayerX = data.players.find((p: any) => p.symbol === 'X')?.id === (window as any).socket?.id;
      onMatchFound(data.roomCode, isPlayerX);
    };
    
    subscribeToWaitingForMatch(handleWaiting);
    subscribeToMatchFound(handleMatchFound);
    
    return () => {
      if (isSearching) {
        cancelRandomMatch();
      }
    };
  }, [onMatchFound]);
  
  const handleStartSearch = () => {
    findRandomMatch();
  };
  
  const handleCancelSearch = () => {
    if (isSearching) {
      cancelRandomMatch();
      setIsSearching(false);
      setSearchTime(0);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl p-6 max-w-md w-full relative"
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
        >
          <X size={24} />
        </button>
        
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Find Random Opponent</h2>
        
        {isSearching ? (
          <div className="text-center py-8">
            <div className="flex justify-center mb-4">
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
            </div>
            <p className="text-gray-700 mb-2">Searching for opponent...</p>
            <p className="text-gray-500 mb-6">Time elapsed: {searchTime}s</p>
            <button
              onClick={handleCancelSearch}
              className="px-6 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 text-gray-700 font-medium"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-600 mb-6">
              Find a random opponent to play against. The matchmaking system will pair you with another player looking for a game.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleStartSearch}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl text-white font-semibold hover:from-blue-600 hover:to-blue-700 shadow-md"
            >
              Find Opponent
            </motion.button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};