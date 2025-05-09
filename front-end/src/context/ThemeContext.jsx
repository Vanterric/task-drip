import { createContext, useEffect, useState } from "react";

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
  const storedTheme = localStorage.getItem('theme');
  if (storedTheme === 'dark') return true;
  if (storedTheme === 'light') return false;

  // No stored theme — fallback to system preference
  return window.matchMedia &&
         window.matchMedia('(prefers-color-scheme: dark)').matches;
});


  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  return (
    <ThemeContext.Provider value={{ isDarkMode, setIsDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};
