import { useThemeStore } from '@/stores/themeStore';

export const useTheme = () => {
  const theme = useThemeStore((state) => state.theme);
  const setThemeStore = useThemeStore((state) => state.setTheme);

  const toggleTheme = () => {
    if (theme === 'light') {
      setThemeStore('dark');
    } else if (theme === 'dark') {
      setThemeStore('system');
    } else {
      setThemeStore('light');
    }
  };

  return {
    theme,
    setTheme: setThemeStore,
    toggleTheme,
    isDark:
      theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches),
  };
};
