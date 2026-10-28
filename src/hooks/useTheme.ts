import { useState, useEffect } from 'react'

export type Theme = 'light' | 'dark'

class ThemeEmitter extends EventTarget {
  theme: Theme;
  constructor() {
    super();
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme') as Theme
      this.theme = stored || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    } else {
      this.theme = 'light';
    }
  }
  setTheme(t: Theme) {
    this.theme = t;
    localStorage.setItem('theme', t);
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(t);
    this.dispatchEvent(new Event('change'));
  }
}

const themeEmitter = new ThemeEmitter();

// Initialize on load
if (typeof window !== 'undefined') {
  const root = window.document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(themeEmitter.theme);
}

export const useTheme = () => {
  const [theme, setThemeState] = useState<Theme>(themeEmitter.theme)

  useEffect(() => {
    const handler = () => setThemeState(themeEmitter.theme);
    themeEmitter.addEventListener('change', handler);
    return () => themeEmitter.removeEventListener('change', handler);
  }, [])

  const toggleTheme = () => {
    themeEmitter.setTheme(themeEmitter.theme === 'light' ? 'dark' : 'light');
  }

  return { theme, toggleTheme }
}