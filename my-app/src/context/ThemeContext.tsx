import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { getThemeStyles, type ThemeMode, type ThemeStyles } from '../theme/dashboardTheme';

interface ThemeContextType {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  styles: ThemeStyles;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
const supportedThemes: ThemeMode[] = ['dark', 'light'];

const borderColor = (border: string) =>
  border.replace(/^\d+px\s+\w+\s+/, '');

export const getApplicationThemeVariables = (
  styles: ThemeStyles,
): Record<string, string> => ({
  '--bg-dark': styles.background,
  '--bg-card': styles.cardBackground,
  '--bg-raised': styles.cardBackground,
  '--sidebar-bg': styles.cardBackground,
  '--input-bg': styles.inputBg,
  '--glass': styles.cardBackground,
  '--accent-neon': styles.primaryColor,
  '--accent-hover': styles.primaryColor,
  '--accent-success': styles.successColor,
  '--text-main': styles.textPrimary,
  '--text-dim': styles.textSecondary,
  '--text-muted': styles.textMuted,
  '--border-color': borderColor(styles.cardBorder),
  '--border-subtle': borderColor(styles.inputBorder),
  '--card-bg': styles.cardBackground,
  '--table-header-bg': styles.tableHeaderBg,
  '--table-hover-bg': styles.cardBackground,
  '--input-border': borderColor(styles.inputBorder),
  '--btn-border': borderColor(styles.inputBorder),
  '--badge-bg': styles.cardBackground,
  '--badge-border': borderColor(styles.inputBorder),
  '--badge-text': styles.textSecondary,
  '--dd-void': styles.background,
  '--dd-panel': styles.cardBackground,
  '--dd-panel-raised': styles.cardBackground,
  '--dd-border': borderColor(styles.cardBorder),
  '--dd-border-strong': borderColor(styles.inputBorder),
  '--dd-text': styles.textPrimary,
  '--dd-text-dim': styles.textSecondary,
  '--dd-text-faint': styles.textMuted,
  '--dd-signal': styles.primaryColor,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Učitava zapamćenu temu iz localStorage-a ili stavlja 'dark' kao podrazumevanu
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('dashboard_theme');
    return supportedThemes.includes(saved as ThemeMode)
      ? (saved as ThemeMode)
      : 'dark';
  });

  useEffect(() => {
    localStorage.setItem('dashboard_theme', themeMode);
  }, [themeMode]);

  const styles = useMemo(() => getThemeStyles(themeMode), [themeMode]);

  useEffect(() => {
    const root = document.documentElement;
    const variables = getApplicationThemeVariables(styles);

    root.dataset.appTheme = themeMode;
    root.style.colorScheme = styles.isDark ? 'dark' : 'light';
    Object.entries(variables).forEach(([name, value]) => {
      root.style.setProperty(name, value);
    });

    return () => {
      if (root.dataset.appTheme === themeMode) {
        delete root.dataset.appTheme;
      }
      root.style.removeProperty('color-scheme');
      Object.keys(variables).forEach((name) => {
        root.style.removeProperty(name);
      });
    };
  }, [styles, themeMode]);

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
