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
  try {
    const context = useContext(ThemeContext);
    
    // If context exists, return it
    if (context) {
      return context;
    }
    
    // If no context, provide default values (for SSR or before hydration)
    return { 
      isDark: true, 
      toggleTheme: () => {} // no-op during SSR/initial render
    };
  } catch (error) {
    // If useContext throws (shouldn't happen in React 18+), provide defaults
    return { 
      isDark: true, 
      toggleTheme: () => {}
    };
  }
};

export default useTheme;