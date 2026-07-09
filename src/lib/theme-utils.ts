// src/lib/theme-utils.ts

export function getThemePreference(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  
  const stored = localStorage.getItem('teaxanime-theme') as 'light' | 'dark' | null;
  if (stored === 'light' || stored === 'dark') {
    return stored;
  }
  
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function toggleTheme(): void {
  if (typeof document === 'undefined') return;
  
  const html = document.documentElement;
  const current = html.classList.contains('dark') ? 'dark' : 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  
  html.classList.remove('light', 'dark');
  html.classList.add(next);
  localStorage.setItem('teaxanime-theme', next);
}

export function applyTheme(theme: 'light' | 'dark'): void {
  if (typeof document === 'undefined') return;
  
  const html = document.documentElement;
  html.classList.remove('light', 'dark');
  html.classList.add(theme);
  localStorage.setItem('teaxanime-theme', theme);
}