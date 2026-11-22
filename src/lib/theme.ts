export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'momentum_theme_mode_v1';

export const THEME_SURFACE_TOKENS: Record<
  ResolvedTheme,
  {
    canvasBg: string;
    surfaceBg: string;
    metaThemeColor: string;
    colorScheme: 'light' | 'dark';
    appleStatusBarStyle: 'default' | 'black-translucent';
  }
> = {
  light: {
    canvasBg: '#F5F5F7',
    surfaceBg: '#FFFFFF',
    metaThemeColor: '#F5F5F7',
    colorScheme: 'light',
    appleStatusBarStyle: 'default',
  },
  dark: {
    canvasBg: '#000000',
    surfaceBg: '#161618',
    metaThemeColor: '#000000',
    colorScheme: 'dark',
    appleStatusBarStyle: 'black-translucent',
  },
};

export const normalizeThemePreference = (value: unknown): ThemePreference => {
  if (value === 'dark' || value === 'light' || value === 'system') {
    return value;
  }
  return 'light';
};

export const resolveThemeMode = (
  preference: ThemePreference,
  systemPrefersDark: boolean
): ResolvedTheme => {
  if (preference === 'dark') return 'dark';
  if (preference === 'light') return 'light';
  return systemPrefersDark ? 'dark' : 'light';
};

export const toggleThemePreference = (
  _currentPreference: ThemePreference,
  currentResolved: ResolvedTheme
): ThemePreference => {
  return currentResolved === 'dark' ? 'light' : 'dark';
};

export const getThemeSurfaceTokens = (resolved: ResolvedTheme) => {
  return THEME_SURFACE_TOKENS[resolved];
};
