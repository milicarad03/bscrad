export type ThemeMode = 'dark' | 'light';

export interface ThemeStyles {
  isDark: boolean;
  background: string;
  cardBackground: string;
  cardBorder: string;
  cardShadow: string;
  backdropFilter: string;
  borderRadius: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  inputBg: string;
  inputBorder: string;
  inputColor: string;
  primaryColor: string;
  successColor: string;
  tableHeaderBg: string;
}

export const themes: Record<ThemeMode, ThemeStyles> = {
  dark: {
    isDark: true,
    background: '#0f172a',
    cardBackground: 'rgba(30, 41, 59, 0.7)',
    cardBorder: '1px solid rgba(255, 255, 255, 0.1)',
    cardShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(12px)',
    borderRadius: '12px',
    textPrimary: '#f8fafc',
    textSecondary: '#94a3b8',
    textMuted: '#64748b',
    inputBg: '#0f172a',
    inputBorder: '1px solid #334155',
    inputColor: '#f1f5f9',
    primaryColor: '#0ea5e9',
    successColor: '#10b981',
    tableHeaderBg: 'rgba(15, 23, 42, 0.6)',
  },
  light: {
    isDark: false,
    background: '#f8fafc',
    cardBackground: '#ffffff',
    cardBorder: '1px solid #e2e8f0',
    cardShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
    backdropFilter: 'none',
    borderRadius: '12px',
    textPrimary: '#0f172a',
    textSecondary: '#475569',
    textMuted: '#94a3b8',
    inputBg: '#f1f5f9',
    inputBorder: '1px solid #cbd5e1',
    inputColor: '#0f172a',
    primaryColor: '#2563eb',
    successColor: '#16a34a',
    tableHeaderBg: '#f1f5f9',
  },
};

export const getThemeStyles = (mode: ThemeMode = 'dark'): ThemeStyles => {
  return themes[mode] ?? themes.dark;
};
