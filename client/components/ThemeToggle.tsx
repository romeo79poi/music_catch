import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className = '',
  size = 'md',
  showLabel = false,
}) => {
  const { theme, actualTheme, toggleTheme } = useTheme();

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const getIcon = () => {
    switch (theme) {
      case 'light':
        return Sun;
      case 'dark':
        return Moon;
      case 'system':
        return Monitor;
      default:
        return Monitor;
    }
  };

  const getLabel = () => {
    switch (theme) {
      case 'light':
        return 'Light Mode';
      case 'dark':
        return 'Dark Mode';
      case 'system':
        return 'System';
      default:
        return 'System';
    }
  };

  const Icon = getIcon();

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleTheme}
        className={`${sizeClasses[size]} rounded-full bg-purple-dark/50 dark:bg-purple-dark/50 light:bg-white light:border light:border-purple-primary/20 backdrop-blur-sm flex items-center justify-center border border-purple-primary/30 hover:border-purple-primary/50 transition-all duration-300 theme-transition group`}
        title={`Current: ${getLabel()}. Click to cycle themes.`}
      >
        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={theme}
              initial={{ opacity: 0, rotate: -180, scale: 0.5 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: 180, scale: 0.5 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className={`${iconSizes[size]} text-white dark:text-white light:text-purple-primary group-hover:text-purple-accent transition-colors duration-300`}
            >
              <Icon className="w-full h-full" />
            </motion.div>
          </AnimatePresence>

          {/* Glow effect for active theme */}
          <motion.div
            animate={{
              opacity: [0.5, 1, 0.5],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className={`absolute inset-0 ${iconSizes[size]} text-purple-primary opacity-30 pointer-events-none`}
          >
            <Icon className="w-full h-full" />
          </motion.div>
        </div>

        {/* Theme indicator dots */}
        <div className="absolute -bottom-1 -right-1 flex space-x-0.5">
          <div
            className={`w-1 h-1 rounded-full transition-colors duration-300 ${
              actualTheme === 'light' ? 'bg-yellow-400' : 'bg-gray-500'
            }`}
          />
          <div
            className={`w-1 h-1 rounded-full transition-colors duration-300 ${
              actualTheme === 'dark' ? 'bg-blue-400' : 'bg-gray-500'
            }`}
          />
        </div>
      </motion.button>

      {showLabel && (
        <motion.span
          key={theme}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 10 }}
          className="text-sm font-medium text-white dark:text-white light:text-gray-700 transition-colors duration-300"
        >
          {getLabel()}
        </motion.span>
      )}
    </div>
  );
};

export default ThemeToggle;
