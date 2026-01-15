import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const themes = {
  classic: {
    id: 'classic',
    name: 'Classic Dark',
    bg: 'bg-neutral-900',
    panel: 'bg-neutral-800',
    text: 'text-white',
    textSecondary: 'text-neutral-400',
    accent: 'text-red-500', 
    accentBg: 'bg-red-600',
    border: 'border-neutral-700',
    buttonBg: 'bg-neutral-700',
    buttonHover: 'hover:bg-neutral-600',
    inputBg: 'bg-neutral-900',
    chatBubbleSelf: 'bg-red-600',
    chatBubbleOther: 'bg-neutral-700',
    className: 'dark' // specific class if needed
  },
  spotify: {
    id: 'spotify',
    name: 'Spotify Green',
    bg: 'bg-black',
    panel: 'bg-[#121212]',
    text: 'text-white',
    textSecondary: 'text-[#B3B3B3]',
    accent: 'text-[#1DB954]',
    accentBg: 'bg-[#1DB954]',
    border: 'border-[#282828]',
    buttonBg: 'bg-[#282828]',
    buttonHover: 'hover:bg-[#3E3E3E]',
    inputBg: 'bg-[#242424]',
    chatBubbleSelf: 'bg-[#1DB954]',
    chatBubbleOther: 'bg-[#282828]',
    className: 'dark'
  },
  helloKitty: {
    id: 'helloKitty',
    name: 'Pink Hello Kitty',
    bg: 'bg-pink-50',
    panel: 'bg-pink-100',
    text: 'text-pink-900',
    textSecondary: 'text-pink-700',
    accent: 'text-pink-600',
    accentBg: 'bg-pink-500',
    border: 'border-pink-300',
    buttonBg: 'bg-pink-200',
    buttonHover: 'hover:bg-pink-300',
    inputBg: 'bg-white',
    chatBubbleSelf: 'bg-pink-500',
    chatBubbleOther: 'bg-pink-200',
    className: 'light'
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
