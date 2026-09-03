import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ThemeProvider, useTheme } from './ThemeContext';

const ThemeConsumer = () => {
  const { themeMode, setThemeMode } = useTheme();

  return (
    <button type="button" onClick={() => setThemeMode('light')}>
      {themeMode}
    </button>
  );
};

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe('ThemeProvider', () => {
  it('applies the selected host theme to document variables', () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    );

    expect(document.documentElement.dataset.appTheme).toBe('dark');
    expect(
      document.documentElement.style.getPropertyValue('--bg-dark'),
    ).toBe('#0f172a');

    fireEvent.click(screen.getByRole('button', { name: 'dark' }));

    expect(document.documentElement.dataset.appTheme).toBe('light');
    expect(
      document.documentElement.style.getPropertyValue('--bg-dark'),
    ).toBe('#f8fafc');
    expect(localStorage.getItem('dashboard_theme')).toBe('light');
  });
});
