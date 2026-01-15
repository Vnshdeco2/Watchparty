import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const themes = {
  classic: {
    name: 'Classic Dark',
    bg: 'bg-neutral-900',
    panel: 'bg-neutral-800',
    text: 'text-white',
    accent: 'text-red-500', 
    accentBg: 'bg-red-600',
    border: 'border-neutral-700',
    button: 'hover:bg-neutral-700'
  },
  spotify: {
    name: 'Spotify Green',
    bg: 'bg-black',
    panel: 'bg-[#121212]',
    text: 'text-white',
    accent: 'text-[#1DB954]',
    accentBg: 'bg-[#1DB954]',
    border: 'border-[#282828]',
    button: 'hover:bg-[#282828]'
  },
  helloKitty: {
    name: 'Pink Hello Kitty',
    bg: 'bg-pink-50',
    panel: 'bg-pink-100',
    text: 'text-pink-900',
    accent: 'text-pink-600',
    accentBg: 'bg-pink-500',
    border: 'border-pink-200',
    button: 'hover:bg-pink-200'
  }
};

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState('classic');

  const theme = themes[currentTheme];

  return (
    <ThemeContext.Provider value={{ currentTheme, setCurrentTheme, theme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
