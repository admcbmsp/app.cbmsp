export type ThemeMode = 'light' | 'dark';

const themeStorageKey = 'cbmsp-theme';

export const getInitialTheme = (): ThemeMode => {
  let storedTheme: string | null = null;
  try {
    storedTheme = window.localStorage.getItem(themeStorageKey);
  } catch {
    // Storage can be unavailable in a restricted browser context; the system
    // preference remains a safe fallback for the prototype.
  }

  if (storedTheme === 'dark' || storedTheme === 'light') {
    return storedTheme;
  }

  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const applyTheme = (theme: ThemeMode) => {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  document.documentElement.style.colorScheme = theme;
  try {
    window.localStorage.setItem(themeStorageKey, theme);
  } catch {
    // The visual theme still applies when persistence is unavailable.
  }
};
