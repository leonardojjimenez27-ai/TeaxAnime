// src/components/EpisodeList.tsx
import { Link } from '@tanstack/react-router'
import type { Season } from '@/lib/anilist'

interface EpisodeListProps {
    animeId: number
    animeTitle: string
    seasons: Season[]
}

export function EpisodeList({ animeId, animeTitle, seasons }: EpisodeListProps) {
    // Si no hay episodios, mostrar mensaje
    if (!seasons || seasons.length === 0 || !seasons[0]?.episodes?.length) {
        return (
            <div className="mt-8">
                <h2 className="text-2xl font-bold mb-4">📺 Episodios</h2>
                <p className="text-gray-400">No hay episodios disponibles</p>
            </div>
        )
    }

    // Tomar la primera temporada (por ahora)
    const episodes = seasons[0].episodes

    return (
        <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">📺 Episodios</h2>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {episodes.map((episode) => (
                    <Link
                        key={episode.id}
                        to="/ver/$id/$episodeId"
                        params={{ 
                            id: String(animeId), 
                            episodeId: String(episode.number) 
                        }}
                        className="bg-gray-800 rounded-lg p-3 hover:bg-gray-700 transition group"
                    >
                        <div className="relative aspect-video bg-gray-700 rounded-lg overflow-hidden mb-2">
                            {episode.thumbnail ? (
                                <img
                                    src={episode.thumbnail}
                                    alt={`Episodio ${episode.number}`}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-500 group-hover:text-gray-400">
                                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            )}
                            <div className="absolute bottom-1 right-1 bg-black/70 px-2 py-0.5 rounded text-xs">
                                {episode.duration ? `${episode.duration}m` : '--'}
                            </div>
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center">
                                <svg className="w-10 h-10 text-white opacity-0 group-hover:opacity-100 transition" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z" />
                                </svg>
                            </div>
                        </div>
                        <p className="text-sm font-medium truncate">
                            Ep. {episode.number}
                        </p>
                        {episode.title && (
                            <p className="text-xs text-gray-400 truncate">
                                {episode.title}
                            </p>
                        )}
                    </Link>
                ))}
            </div>
        </div>
    )
}