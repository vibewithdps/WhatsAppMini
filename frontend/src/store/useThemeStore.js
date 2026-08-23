import { create } from 'zustand';

export const useThemeStore = create((set, get) => ({
  theme: localStorage.getItem('wa_theme') || 'dark', // 'dark' | 'light'

  toggleTheme: () => {
    const nextTheme = get().theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('wa_theme', nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    set({ theme: nextTheme });
  },

  initTheme: () => {
    const currentTheme = get().theme;
    if (currentTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  },
}));
