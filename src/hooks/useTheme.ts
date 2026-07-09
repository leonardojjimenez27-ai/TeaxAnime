// src/hooks/useTheme.ts
import { useState, useEffect, useCallback } from 'react';

type Theme = 'light' | 'dark';

const STORAGE_KEY = 'teaxanime-theme';

// ============================================================
// UTILIDADES SSR-SAFE
// ============================================================

function isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof document !== 'undefined';
}

function getSystemTheme(): Theme {
    if (!isBrowser()) return 'dark';
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function getStoredTheme(): Theme | null {
    if (!isBrowser()) return null;
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (stored === 'light' || stored === 'dark') {
        return stored;
    }
    return null;
}

// ============================================================
// HOOK PRINCIPAL
// ============================================================

export function useTheme() {
    // 🔥 Estado inicial: siempre 'dark' en el servidor
    const [theme, setTheme] = useState<Theme>('dark');
    const [mounted, setMounted] = useState(false);

    // 🔥 Efecto para detectar el tema solo en el cliente
    useEffect(() => {
        setMounted(true);
        const stored = getStoredTheme();
        const initialTheme = stored || getSystemTheme();
        setTheme(initialTheme);
        
        // Aplicar tema al HTML
        const html = document.documentElement;
        html.classList.remove('light', 'dark');
        html.classList.add(initialTheme);
    }, []);

    // Aplicar tema cuando cambie
    const applyTheme = useCallback((newTheme: Theme) => {
        if (!isBrowser()) return;
        
        const html = document.documentElement;
        html.classList.remove('light', 'dark');
        html.classList.add(newTheme);
        localStorage.setItem(STORAGE_KEY, newTheme);
    }, []);

    // Cambiar tema
    const toggleTheme = useCallback(() => {
        setTheme(prev => {
            const newTheme = prev === 'light' ? 'dark' : 'light';
            applyTheme(newTheme);
            return newTheme;
        });
    }, [applyTheme]);

    // Establecer un tema específico
    const setThemeValue = useCallback((newTheme: Theme) => {
        setTheme(newTheme);
        applyTheme(newTheme);
    }, [applyTheme]);

    // Escuchar cambios en la preferencia del sistema
    useEffect(() => {
        if (!isBrowser()) return;
        
        const media = window.matchMedia('(prefers-color-scheme: light)');
        const handler = (e: MediaQueryListEvent) => {
            // Solo cambiar si no hay tema guardado en localStorage
            const stored = getStoredTheme();
            if (!stored) {
                const newTheme = e.matches ? 'light' : 'dark';
                setTheme(newTheme);
                applyTheme(newTheme);
            }
        };
        
        media.addEventListener('change', handler);
        return () => media.removeEventListener('change', handler);
    }, [applyTheme]);

    return { theme, toggleTheme, setTheme: setThemeValue, mounted };
}