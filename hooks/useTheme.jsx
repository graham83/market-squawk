import { useState, useEffect, createContext, useContext } from 'react';

// Create theme context
const ThemeContext = createContext();

// Theme provider component
export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(true); // Default to dark theme

  // Load theme from localStorage on mount (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        setIsDark(savedTheme === 'dark');
      }
    }
  }, []);

  // Apply theme to document and save to localStorage (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const theme = isDark ? 'dark' : 'light';
      document.documentElement.classList.toggle('dark', isDark);
      
      if (window.localStorage) {
        localStorage.setItem('theme', theme);
      }
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(prev => !prev);
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use theme
export const useTheme = () => {
  const context = useContext(ThemeContext);
  
  // During SSR or if not within provider, return default values
  if (!context) {
    // Check if we're in SSR or missing provider
    if (typeof window === 'undefined') {
      // SSR - return default values
      return { 
        isDark: true, 
        toggleTheme: () => {} // no-op during SSR
      };
    } else {
      // Client-side missing provider - this is an error
      throw new Error('useTheme must be used within a ThemeProvider');
    }
  }
  return context;
};

export default useTheme;