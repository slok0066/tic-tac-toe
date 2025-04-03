import { motion } from 'framer-motion';
import { X, Volume2, VolumeX, Zap, Sparkles, Clock, Shield, Moon, Sun, Palette } from 'lucide-react';
import { useState } from 'react';
import { Theme, GameSettings } from '../types';

interface SettingsModalProps {
  settings: GameSettings;
  onSave: (settings: GameSettings) => void;
  onClose: () => void;
}

// Settings section component for visual grouping
const SettingsSection = ({ 
  title, 
  icon, 
  children, 
  delay = 0 
}: { 
  title: string; 
  icon: React.ReactNode; 
  children: React.ReactNode; 
  delay?: number 
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.3, type: "spring", stiffness: 300 }}
    className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-5 shadow-lg border border-white/20 dark:border-gray-700/30"
    whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
  >
    <h3 className="flex items-center gap-2 font-medium text-gray-800 dark:text-gray-200 mb-4 text-lg">
      {icon}
      {title}
    </h3>
    <div className="space-y-4">
      {children}
    </div>
  </motion.div>
);

// Toggle switch component for consistency
const ToggleSwitch = ({ 
  enabled, 
  onChange, 
  activeColor = 'bg-green-500',
  size = 'normal' 
}: { 
  enabled: boolean; 
  onChange: () => void; 
  activeColor?: string;
  size?: 'small' | 'normal'
}) => (
  <motion.button
    onClick={onChange}
    className={`${size === 'small' ? 'w-12 h-6' : 'w-14 h-7'} rounded-full transition-colors flex items-center px-0.5 ${
      enabled ? `${activeColor} justify-end` : 'bg-gray-300 dark:bg-gray-600 justify-start'
    } shadow-inner touch-manipulation`}
    whileTap={{ scale: 0.95 }}
    layout
    aria-checked={enabled}
    role="switch"
  >
    <motion.div 
      layout
      className={`${size === 'small' ? 'w-5 h-5' : 'w-6 h-6'} bg-white rounded-full shadow-md`}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
    />
  </motion.button>
);

export const SettingsModal = ({ settings, onSave, onClose }: SettingsModalProps) => {
  const [currentSettings, setCurrentSettings] = useState<GameSettings>({...settings});
  
  const themeOptions: { value: Theme; label: string; color: string }[] = [
    { value: 'blue', label: 'Blue', color: 'bg-blue-500' },
    { value: 'purple', label: 'Purple', color: 'bg-purple-500' },
    { value: 'green', label: 'Green', color: 'bg-green-500' },
    { value: 'pink', label: 'Pink', color: 'bg-pink-500' },
    { value: 'orange', label: 'Orange', color: 'bg-orange-500' },
  ];

  const handleSave = () => {
    onSave(currentSettings);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`fixed inset-0 bg-black bg-opacity-60 backdrop-blur-md flex items-center justify-center p-4 z-50 ${currentSettings.darkMode ? 'dark' : ''}`}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 25 }}
        className={`${currentSettings.darkMode ? 'bg-gray-900/90 text-white' : 'bg-white/95 text-gray-800'} backdrop-blur-sm rounded-2xl p-4 sm:p-6 max-w-md w-full relative overflow-y-auto max-h-[90vh] shadow-2xl border ${currentSettings.darkMode ? 'border-gray-700' : 'border-gray-200'}`}
      >
        <motion.button
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          onClick={onClose}
          className={`absolute right-3 top-3 sm:right-4 sm:top-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 ${currentSettings.darkMode ? 'bg-gray-800' : 'bg-gray-100'} p-2 rounded-full z-10 touch-manipulation`}
          aria-label="Close settings"
        >
          <X size={18} />
        </motion.button>
        
        <motion.h2 
          className={`text-xl sm:text-2xl font-bold ${currentSettings.darkMode ? 'text-white' : 'text-gray-800'} mb-4 sm:mb-6`}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          Game Settings
        </motion.h2>

        <div className="space-y-4 sm:space-y-6">
          {/* Appearance Settings */}
          <SettingsSection 
            title="Appearance" 
            icon={<Palette className="w-5 h-5 text-purple-500" />}
            delay={0.1}
          >
            {/* Display Mode */}
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-2 text-sm sm:text-base">
                {currentSettings.darkMode ? 
                  <Moon className="w-5 h-5 text-blue-400" /> : 
                  <Sun className="w-5 h-5 text-yellow-500" />
                }
                {currentSettings.darkMode ? "Dark Mode" : "Light Mode"}
              </span>
              <ToggleSwitch 
                enabled={currentSettings.darkMode} 
                onChange={() => setCurrentSettings(prev => ({ ...prev, darkMode: !prev.darkMode }))}
                activeColor="bg-indigo-500"
              />
            </div>
            
            {/* Theme Selection */}
          <div>
              <label className="block text-sm font-medium mb-2">Theme Color</label>
              <div className="grid grid-cols-5 gap-2">
                {themeOptions.map((theme, idx) => (
                <motion.button
                    key={theme.value}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 + idx * 0.05 }}
                    onClick={() => setCurrentSettings(prev => ({ ...prev, theme: theme.value }))}
                    className={`h-10 sm:h-12 rounded-lg transition-all ${theme.color} ${
                      currentSettings.theme === theme.value 
                        ? 'ring-2 ring-offset-2 dark:ring-offset-gray-900 scale-110 shadow-lg' 
                        : 'opacity-60 hover:opacity-100 hover:shadow-md'
                    } touch-manipulation`}
                    aria-label={`${theme.label} theme`}
                    whileHover={{ y: -2, scale: 1.05 }}
                    whileTap={{ y: 0 }}
                  />
              ))}
            </div>
          </div>
          </SettingsSection>
          
          {/* Animation Settings */}
          <SettingsSection 
            title="Animation & Visual Effects" 
            icon={<Sparkles className="w-5 h-5 text-yellow-500" />}
            delay={0.2}
          >
            {/* Animations Toggle */}
            <div className="flex justify-between items-center">
              <div className="flex-1 mr-3">
                <span className="flex items-center gap-2 text-sm sm:text-base">
                  <Sparkles className="w-5 h-5 text-yellow-500" />
                  Animations
                </span>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Show visual animations during gameplay</p>
              </div>
              <ToggleSwitch 
                enabled={currentSettings.showAnimations} 
                onChange={() => setCurrentSettings(prev => ({ ...prev, showAnimations: !prev.showAnimations }))}
              />
            </div>
            
            {/* Animation Speed (only show if animations are enabled) */}
            {currentSettings.showAnimations && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="ml-7 mt-2"
              >
                <div className="flex justify-between text-sm mb-2">
                  <span>Animation Speed</span>
                  <span className="font-medium">
                    {currentSettings.animationSpeed === 'slow' ? 'Slow' : 
                     currentSettings.animationSpeed === 'medium' ? 'Medium' : 'Fast'}
                  </span>
                </div>
                <div className="flex space-x-2">
                  {['slow', 'medium', 'fast'].map((speed, idx) => (
                    <motion.button
                      key={speed}
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.1 + idx * 0.05 }}
                      onClick={() => setCurrentSettings(prev => ({ ...prev, animationSpeed: speed }))}
                      className={`flex-1 py-2 px-2 rounded-lg text-xs font-medium transition-all ${
                        currentSettings.animationSpeed === speed
                          ? `${currentSettings.darkMode ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700'}`
                          : `${currentSettings.darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`
                      } touch-manipulation`}
                      whileHover={{ y: -2 }}
                      whileTap={{ y: 0 }}
                    >
                      {speed.charAt(0).toUpperCase() + speed.slice(1)}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
            
            {/* Hints Toggle */}
            <div className="flex justify-between items-center">
              <div className="flex-1 mr-3">
                <span className="flex items-center gap-2 text-sm sm:text-base">
                  <Zap className="w-5 h-5 text-amber-500" />
                  Show Hints
                </span>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Show move indicators during gameplay</p>
              </div>
              <ToggleSwitch 
                enabled={currentSettings.showHints} 
                onChange={() => setCurrentSettings(prev => ({ ...prev, showHints: !prev.showHints }))}
              />
            </div>
          </SettingsSection>
          
          {/* Sound & Feedback */}
          <SettingsSection
            title="Sound & Feedback"
            icon={<Volume2 className="w-5 h-5 text-green-500" />}
            delay={0.3}
          >
            {/* Sound Toggle */}
            <div className="flex justify-between items-center">
              <div className="flex-1 mr-3">
                <span className="flex items-center gap-2 text-sm sm:text-base">
                  {currentSettings.soundEnabled ? 
                    <Volume2 className="w-5 h-5 text-green-500" /> : 
                    <VolumeX className="w-5 h-5 text-gray-500" />
                  }
                  Sound Effects
                </span>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Play sounds during gameplay</p>
              </div>
              <ToggleSwitch 
                enabled={currentSettings.soundEnabled} 
                onChange={() => setCurrentSettings(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }))}
              />
              </div>
            
            {/* Volume Slider (only show if sound is enabled) */}
            {currentSettings.soundEnabled && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="ml-7 mt-2"
              >
                <label className="flex items-center justify-between text-sm mb-1">
                  <span>Volume</span>
                  <span className="font-medium">{currentSettings.volume}%</span>
                </label>
                <div className="relative pt-1">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={currentSettings.volume}
                    onChange={(e) => setCurrentSettings(prev => ({ ...prev, volume: parseInt(e.target.value) }))}
                    className="w-full appearance-none rounded-lg h-4 outline-none cursor-pointer touch-manipulation"
                    style={{
                      background: `linear-gradient(to right, #10b981 0%, #10b981 ${currentSettings.volume}%, ${currentSettings.darkMode ? '#374151' : '#e5e7eb'} ${currentSettings.volume}%, ${currentSettings.darkMode ? '#374151' : '#e5e7eb'} 100%)`
                    }}
                  />
                  <div className="absolute -bottom-3 left-0 right-0 flex justify-between px-1 text-xs text-gray-500">
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>
              </motion.div>
            )}
            
            {/* Haptic Feedback */}
            <div className="flex justify-between items-center">
              <div className="flex-1 mr-3">
                <span className="flex items-center gap-2 text-sm sm:text-base">
                  <Shield className="w-5 h-5 text-blue-500" />
                  Haptic Feedback
                </span>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Vibration on mobile devices</p>
              </div>
              <ToggleSwitch 
                enabled={currentSettings.hapticFeedback} 
                onChange={() => setCurrentSettings(prev => ({ ...prev, hapticFeedback: !prev.hapticFeedback }))}
              />
            </div>
          </SettingsSection>
          
          {/* Game Features */}
          <SettingsSection
            title="Game Features"
            icon={<Clock className="w-5 h-5 text-rose-500" />}
            delay={0.4}
          >
            {/* Game Timer */}
            <div className="flex justify-between items-center">
              <div className="flex-1 mr-3">
                <span className="flex items-center gap-2 text-sm sm:text-base">
                  <Clock className="w-5 h-5 text-rose-500" />
                  Game Timer
                </span>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Display a timer during gameplay</p>
              </div>
              <ToggleSwitch 
                enabled={currentSettings.showTimer} 
                onChange={() => setCurrentSettings(prev => ({ ...prev, showTimer: !prev.showTimer }))}
              />
          </div>
          </SettingsSection>
        </div>

        <motion.div 
          className="mt-6 sm:mt-8 flex justify-end space-x-3 sm:space-x-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <motion.button
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={onClose}
            className={`px-4 sm:px-5 py-3 rounded-lg ${
              currentSettings.darkMode ? 
                'bg-gray-700 text-gray-200 hover:bg-gray-600' : 
                'bg-gray-200 text-gray-700 hover:bg-gray-300'
            } font-medium shadow-md touch-manipulation`}
          >
            Cancel
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleSave}
            className={`px-4 sm:px-5 py-3 rounded-lg bg-blue-500 text-white font-medium hover:bg-blue-600 shadow-md touch-manipulation`}
            transition={{
              type: "spring",
              stiffness: 500,
              damping: 15
            }}
          >
            Save
          </motion.button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};