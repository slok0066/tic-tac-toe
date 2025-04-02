import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Copy, Sparkles, Check } from 'lucide-react';
import { createRoom, joinRoom } from '../utils/socket';

interface RoomModalProps {
  onCreateRoom: (roomCode: string) => void;
  onJoinRoom: (roomCode: string) => void;
  onClose: () => void;
}

export const RoomModal = ({ onCreateRoom, onJoinRoom, onClose }: RoomModalProps) => {
  const [mode, setMode] = useState<'menu' | 'create' | 'join'>('menu');
  const [roomCode, setRoomCode] = useState<string>('');
  const [createdRoomCode, setCreatedRoomCode] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateRoom = async () => {
    setIsLoading(true);
    try {
      const code = await createRoom();
      setCreatedRoomCode(code);
      setMode('create');
      onCreateRoom(code);
    } catch (err) {
      setError('Failed to create room. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinRoom = () => {
    if (!roomCode || roomCode.length < 6) {
      setError('Please enter a valid room code');
      return;
    }
    
    setError(null);
    joinRoom(roomCode);
    onJoinRoom(roomCode);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(createdRoomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (mode === 'menu') {
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
          
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Play Online</h2>
          
          <div className="space-y-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full p-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center text-white font-semibold hover:from-blue-600 hover:to-blue-700"
              onClick={handleCreateRoom}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center w-full">
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Creating...
                </div>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  <span>Create New Room</span>
                </>
              )}
            </motion.button>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or</span>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full p-4 bg-white border-2 border-gray-200 rounded-xl text-gray-700 font-semibold hover:bg-gray-50"
              onClick={() => setMode('join')}
            >
              Join Existing Room
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  if (mode === 'create') {
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
          
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Room Created</h2>
          
          <p className="text-gray-600 mb-4">
            Share this code with a friend to play together:
          </p>
          
          <div className="flex items-center mb-6">
            <div className="bg-gray-100 px-4 py-3 rounded-l-lg font-mono text-lg flex-grow text-center font-semibold">
              {createdRoomCode}
            </div>
            <button 
              onClick={copyToClipboard}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-r-lg"
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
          
          <p className="text-gray-600 text-sm">
            Waiting for opponent to join...
          </p>
        </motion.div>
      </motion.div>
    );
  }

  if (mode === 'join') {
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
          
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Join a Room</h2>
          
          <p className="text-gray-600 mb-4">
            Enter the room code provided by your friend:
          </p>
          
          <div className="mb-4">
            <input
              type="text"
              maxLength={6}
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="ENTER CODE"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg font-mono text-center text-lg uppercase focus:border-blue-500 focus:outline-none"
            />
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </div>
          
          <div className="flex justify-between">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-4 py-2 bg-gray-200 rounded-lg text-gray-700 font-medium hover:bg-gray-300"
              onClick={() => setMode('menu')}
            >
              Back
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg text-white font-medium hover:from-blue-600 hover:to-blue-700"
              onClick={handleJoinRoom}
            >
              Join
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return null;
};