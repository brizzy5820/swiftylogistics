import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

const ThemeProviderContext = createContext({
  theme: 'light',
  resolvedTheme: 'light',
  isGuest: false,
  setTheme: () => null,
  toggleTheme: () => null,
});

const STORAGE_KEYS = ['app_theme_pref', 'vite-ui-theme', 'swifty_theme'];

function getIsGuestSession() {
  if (typeof window === 'undefined') return false;
  const isGuest =
    sessionStorage.getItem('is_guest_session') === 'true' ||
    sessionStorage.getItem('swifty_guest') === 'true' ||
    localStorage.getItem('user_role') === 'guest' ||
    (!localStorage.getItem('swifty_access_token') && !sessionStorage.getItem('swifty_access_token'));
  return Boolean(isGuest);
}

export function ThemeProvider({
  children,
  ...props
}) {
  const theme = 'light';
  const resolvedTheme = 'light';
  const [isGuest, setIsGuest] = useState(getIsGuestSession);

  useEffect(() => {
    const checkGuest = () => setIsGuest(getIsGuestSession());
    window.addEventListener('storage', checkGuest);
    return () => window.removeEventListener('storage', checkGuest);
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('dark');
    root.classList.add('light');
    root.setAttribute('data-theme', 'light');
    root.style.colorScheme = 'light';
    setIsGuest(getIsGuestSession());
  }, []);

  const setTheme = useCallback(() => {
    STORAGE_KEYS.forEach((key) => {
      try {
        localStorage.setItem(key, 'light');
      } catch {}
    });
  }, []);

  const toggleTheme = useCallback(() => setTheme('light'), [setTheme]);

  return (
    <ThemeProviderContext.Provider
      {...props}
      value={{
        theme,
        resolvedTheme,
        isGuest,
        setTheme,
        toggleTheme,
      }}
    >
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
