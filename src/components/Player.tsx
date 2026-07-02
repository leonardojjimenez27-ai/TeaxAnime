// src/components/Player.tsx
import { useState } from 'react'
import type { EpisodeDetails } from '@/lib/anilist'

interface PlayerProps {
    animeId: number
    animeTitle: string
    episode: EpisodeDetails
    onNext?: () => void
    onPrevious?: () => void
    hasNext?: boolean
    hasPrevious?: boolean
}

export function Player({ 
    animeId, 
    animeTitle, 
    episode, 
    onNext, 
    onPrevious, 
    hasNext, 
    hasPrevious 
}: PlayerProps) {
    const [selectedServer, setSelectedServer] = useState(0)
    const [isLoading, setIsLoading] = useState(true)

    // Simulación de servidores
    const servers = [
        { name: 'Servidor 1', url: `https://example.com/embed/${animeId}/${episode.number}` },
        { name: 'Servidor 2', url: `https://example2.com/embed/${animeId}/${episode.number}` },
        { name: 'Servidor 3', url: `https://example3.com/embed/${animeId}/${episode.number}` },
    ]

    return (
        <div className="bg-gray-900 rounded-lg overflow-hidden">
            {/* Reproductor */}
            <div className="relative aspect-video bg-black">
                <iframe
                    src={servers[selectedServer].url}
                    className="w-full h-full"
                    allowFullScreen
                    allow="encrypted-media; picture-in-picture"
                    onLoad={() => setIsLoading(false)}
                />
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <div className="text-center">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                            <p className="mt-4 text-white">Cargando reproductor...</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Información del episodio */}
            <div className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                        <h3 className="text-xl font-semibold">
                            {animeTitle}
                        </h3>
                        <p className="text-gray-400">
                            Episodio {episode.number} - {episode.title || 'Sin título'}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={onPrevious}
                            disabled={!hasPrevious}
                            className="px-4 py-2 bg-gray-700 rounded-lg disabled:opacity-50 hover:bg-gray-600 transition"
                        >
                            Anterior
                        </button>
                        <button
                            onClick={onNext}
                            disabled={!hasNext}
                            className="px-4 py-2 bg-blue-600 rounded-lg disabled:opacity-50 hover:bg-blue-700 transition"
                        >
                            Siguiente
                        </button>
                    </div>
                </div>

                {/* Selector de servidores */}
                <div className="mt-4">
                    <p className="text-sm text-gray-400 mb-2">Servidores:</p>
                    <div className="flex gap-2 flex-wrap">
                        {servers.map((server, index) => (
                            <button
                                key={index}
                                onClick={() => {
                                    setSelectedServer(index)
                                    setIsLoading(true)
                                }}
                                className={`px-3 py-1 rounded-lg text-sm transition ${
                                    selectedServer === index
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                }`}
                            >
                                {server.name}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}