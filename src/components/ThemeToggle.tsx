// src/components/theme-toggle.tsx
import { useTheme } from './theme-provider'
import { useState, useEffect } from 'react'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="h-9 w-9 rounded-lg bg-secondary/50 animate-pulse flex-shrink-0" />
    )
  }

  const isDark = theme === 'dark'

  return (
    <button
      onClick={toggleTheme}
      className="relative h-9 w-9 rounded-lg bg-secondary/50 hover:bg-secondary transition-all duration-300 flex items-center justify-center group flex-shrink-0"
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      title={isDark ? '☀️ Modo claro' : '🌙 Modo oscuro'}
    >
      {/* 🌙 Icono Luna (modo oscuro) */}
      <svg
        className={`h-4 w-4 transition-all duration-300 ${
          isDark 
            ? 'opacity-100 rotate-0 scale-100' 
            : 'opacity-0 rotate-90 scale-50 absolute'
        }`}
        fill="currentColor"
        viewBox="0 0 20 20"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
      </svg>
      
      {/* ☀️ Icono Sol (modo claro) */}
      <svg
        className={`h-4 w-4 transition-all duration-300 ${
          isDark 
            ? 'opacity-0 -rotate-90 scale-50 absolute' 
            : 'opacity-100 rotate-0 scale-100'
        }`}
        fill="currentColor"
        viewBox="0 0 20 20"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
      </svg>

      {/* Efecto glow al hover */}
      <span 
        className="absolute inset-0 rounded-lg transition-opacity duration-300 opacity-0 group-hover:opacity-100 pointer-events-none"
        style={{
          boxShadow: isDark 
            ? '0 0 20px -4px color-mix(in oklab, var(--color-primary) 40%, transparent)'
            : '0 0 20px -4px color-mix(in oklab, var(--color-primary) 30%, transparent)'
        }}
      />
    </button>
  )
}