import React, { createContext, useContext, useState, useEffect } from 'react';
import { getThemeStyles, type ThemeMode, type ThemeStyles } from '../theme/dashboardTheme';

interface ThemeContextType {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  styles: ThemeStyles;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Učitava zapamćenu temu iz localStorage-a ili stavlja 'dark' kao podrazumevanu
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('dashboard_theme');
    return (saved as ThemeMode) || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('dashboard_theme', themeMode);
  }, [themeMode]);

  const styles = getThemeStyles(themeMode);

  return (
    <ThemeContext.Provider value={{ themeMode, setThemeMode, styles }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}