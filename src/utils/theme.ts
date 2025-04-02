import { Theme } from '../types';

interface ThemeColors {
  primary: string;
  secondary: string;
  bg: string;
  text: string;
  xColor: string;
  oColor: string;
  hoverBg: string;
  boardBg: string;
  gradient: string;
}

const THEMES: Record<Theme, ThemeColors> = {
  blue: {
    primary: 'from-blue-500 to-blue-600',
    secondary: 'from-purple-500 to-purple-600',
    bg: 'from-blue-50 via-purple-50 to-pink-50',
    text: 'text-blue-600',
    xColor: 'text-blue-500',
    oColor: 'text-purple-500',
    hoverBg: 'hover:bg-blue-50',
    boardBg: 'bg-blue-50',
    gradient: 'from-blue-600 to-purple-600'
  },
  purple: {
    primary: 'from-purple-500 to-purple-600',
    secondary: 'from-indigo-500 to-indigo-600',
    bg: 'from-purple-50 via-indigo-50 to-pink-50',
    text: 'text-purple-600',
    xColor: 'text-purple-500',
    oColor: 'text-indigo-500',
    hoverBg: 'hover:bg-purple-50',
    boardBg: 'bg-purple-50',
    gradient: 'from-purple-600 to-indigo-600'
  },
  green: {
    primary: 'from-green-500 to-green-600',
    secondary: 'from-teal-500 to-teal-600',
    bg: 'from-green-50 via-teal-50 to-blue-50',
    text: 'text-green-600',
    xColor: 'text-green-500',
    oColor: 'text-teal-500',
    hoverBg: 'hover:bg-green-50',
    boardBg: 'bg-green-50',
    gradient: 'from-green-600 to-teal-600'
  },
  pink: {
    primary: 'from-pink-500 to-pink-600',
    secondary: 'from-red-500 to-red-600',
    bg: 'from-pink-50 via-red-50 to-orange-50',
    text: 'text-pink-600',
    xColor: 'text-pink-500',
    oColor: 'text-red-500',
    hoverBg: 'hover:bg-pink-50',
    boardBg: 'bg-pink-50',
    gradient: 'from-pink-600 to-red-600'
  },
  orange: {
    primary: 'from-orange-500 to-orange-600',
    secondary: 'from-amber-500 to-amber-600',
    bg: 'from-orange-50 via-amber-50 to-yellow-50',
    text: 'text-orange-600',
    xColor: 'text-orange-500',
    oColor: 'text-amber-500',
    hoverBg: 'hover:bg-orange-50',
    boardBg: 'bg-orange-50',
    gradient: 'from-orange-600 to-amber-600'
  }
};

// Helper function to get CSS classes for a theme
export const getThemeClasses = (theme: Theme, type: keyof ThemeColors): string => {
  return THEMES[theme][type];
};

// Apply theme to an element class string
export const applyTheme = (theme: Theme, baseClasses: string, themeType: keyof ThemeColors): string => {
  // Remove any existing theme classes that might be in the baseClasses
  const classesToRemove = Object.values(THEMES).map(t => t[themeType]);
  let cleanedClasses = baseClasses;
  
  classesToRemove.forEach(classToRemove => {
    // Use regex to match the exact class
    cleanedClasses = cleanedClasses.replace(new RegExp(`\\b${classToRemove}\\b`, 'g'), '');
  });
  
  // Add the new theme class
  return `${cleanedClasses.trim()} ${THEMES[theme][themeType]}`.trim();
};

// Get a theme color without the TailwindCSS class prefix
export const getThemeColor = (theme: Theme, type: keyof ThemeColors): string => {
  const themeClass = THEMES[theme][type];
  
  // Extract the main color from classes like "from-blue-500"
  const colorMatch = themeClass.match(/-([\w-]+)-\d+/);
  return colorMatch ? colorMatch[1] : 'blue';
};