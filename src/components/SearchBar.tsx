// src/components/SearchBar.tsx
import { useState, useEffect, useRef } from 'react'
import { Link } from '@tanstack/react-router'
import { searchAnime } from '@/lib/anilist/client'

interface AnimeResult {
    id: number
    title: {
        romaji: string
        english: string | null
        native: string | null
    }
    coverImage: {
        large: string
        medium: string
    }
    episodes: number
    genres: string[]
    averageScore: number
}

export function SearchBar() {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<AnimeResult[]>([])
    const [loading, setLoading] = useState(false)
    const [isOpen, setIsOpen] = useState(false)
    const [selectedIndex, setSelectedIndex] = useState(-1)
    const searchRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const debounceTimer = useRef<NodeJS.Timeout | null>(null)

    // Manejar clic fuera del buscador para cerrar
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Manejar teclas de navegación
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return

            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault()
                    setSelectedIndex(prev => 
                        prev < results.length - 1 ? prev + 1 : prev
                    )
                    break
                case 'ArrowUp':
                    e.preventDefault()
                    setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
                    break
                case 'Enter':
                    e.preventDefault()
                    if (selectedIndex >= 0 && selectedIndex < results.length) {
                        const selected = results[selectedIndex]
                        window.location.href = `/anime/${selected.id}`
                        setIsOpen(false)
                        setQuery('')
                        setResults([])
                    } else if (query.trim()) {
                        window.location.href = `/buscar?q=${encodeURIComponent(query)}`
                        setIsOpen(false)
                    }
                    break
                case 'Escape':
                    setIsOpen(false)
                    setSelectedIndex(-1)
                    break
            }
        }

        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [isOpen, results, selectedIndex, query])

    // Buscar al escribir (con debounce)
    useEffect(() => {
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current)
        }

        if (query.length < 2) {
            setResults([])
            setIsOpen(false)
            return
        }

        setLoading(true)
        debounceTimer.current = setTimeout(async () => {
            try {
                const data = await searchAnime(query, 1, 8)
                setResults(data.media || [])
                setIsOpen(true)
                setSelectedIndex(-1)
            } catch (error) {
                console.error('Error buscando:', error)
                setResults([])
            } finally {
                setLoading(false)
            }
        }, 300)

        return () => {
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current)
            }
        }
    }, [query])

    // Limpiar búsqueda
    const clearSearch = () => {
        setQuery('')
        setResults([])
        setIsOpen(false)
        setSelectedIndex(-1)
        inputRef.current?.focus()
    }

    // Obtener título principal
    const getMainTitle = (anime: AnimeResult) => {
        return anime.title.english || anime.title.romaji || anime.title.native || 'Sin título'
    }

    // Obtener título secundario
    const getSecondaryTitle = (anime: AnimeResult) => {
        if (anime.title.english && anime.title.romaji && anime.title.english !== anime.title.romaji) {
            return anime.title.romaji
        }
        return null
    }

    return (
        <div ref={searchRef} className="relative w-full max-w-md">
            {/* Input de búsqueda */}
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => {
                        if (results.length > 0) {
                            setIsOpen(true)
                        }
                    }}
                    placeholder="Buscar anime..."
                    className="w-full pl-10 pr-10 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
                {query && (
                    <button
                        onClick={clearSearch}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white transition"
                    >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
                {loading && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    </div>
                )}
            </div>

            {/* Resultados desplegables */}
            {isOpen && results.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden z-50">
                    <div className="max-h-96 overflow-y-auto">
                        {results.map((anime, index) => {
                            const title = getMainTitle(anime)
                            const secondaryTitle = getSecondaryTitle(anime)
                            const isSelected = index === selectedIndex

                            return (
                                <Link
                                    key={anime.id}
                                    to="/anime/$id"
                                    params={{ id: String(anime.id) }}
                                    className={`block px-4 py-3 transition ${
                                        isSelected 
                                            ? 'bg-blue-600/30' 
                                            : 'hover:bg-gray-700/50'
                                    }`}
                                    onMouseEnter={() => setSelectedIndex(index)}
                                    onClick={() => {
                                        setIsOpen(false)
                                        setQuery('')
                                        setResults([])
                                    }}
                                >
                                    <div className="flex items-center gap-3">
                                        {/* Imagen miniatura */}
                                        <div className="flex-shrink-0 w-12 h-16 rounded overflow-hidden bg-gray-700">
                                            <img
                                                src={anime.coverImage?.medium || anime.coverImage?.large || ''}
                                                alt={title}
                                                className="w-full h-full object-cover"
                                                loading="lazy"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).style.display = 'none'
                                                }}
                                            />
                                        </div>
                                        
                                        {/* Información */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-medium text-white truncate">
                                                    {title}
                                                </p>
                                                {anime.averageScore && (
                                                    <span className="flex-shrink-0 text-xs text-yellow-400">
                                                        ★{Math.round(anime.averageScore / 10)}
                                                    </span>
                                                )}
                                            </div>
                                            {secondaryTitle && (
                                                <p className="text-xs text-gray-400 truncate">
                                                    {secondaryTitle}
                                                </p>
                                            )}
                                            <div className="flex items-center gap-2 mt-1">
                                                {anime.episodes && (
                                                    <span className="text-xs text-gray-500">
                                                        {anime.episodes} eps
                                                    </span>
                                                )}
                                                {anime.genres && anime.genres.length > 0 && (
                                                    <span className="text-xs text-gray-500 truncate">
                                                        {anime.genres.slice(0, 3).join(' · ')}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Flecha indicadora */}
                                        <svg className="flex-shrink-0 h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </Link>
                            )
                        })}
                    </div>

                    {/* Footer con opción de ver todos */}
                    <div className="border-t border-gray-700 p-2 bg-gray-800/50">
                        <Link
                            to="/buscar"
                            search={{ q: query }}
                            className="block text-center text-xs text-gray-400 hover:text-white transition py-1"
                            onClick={() => {
                                setIsOpen(false)
                                setQuery('')
                                setResults([])
                            }}
                        >
                            Ver todos los resultados para "{query}"
                        </Link>
                    </div>
                </div>
            )}

            {/* Mensaje cuando no hay resultados */}
            {isOpen && query.length >= 2 && results.length === 0 && !loading && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden z-50 p-6 text-center">
                    <p className="text-gray-400">No se encontraron animes para "{query}"</p>
                    <Link
                        to="/buscar"
                        search={{ q: query }}
                        className="mt-2 inline-block text-sm text-blue-400 hover:text-blue-300 transition"
                        onClick={() => {
                            setIsOpen(false)
                            setQuery('')
                            setResults([])
                        }}
                    >
                        Buscar en todos los resultados →
                    </Link>
                </div>
            )}
        </div>
    )
}