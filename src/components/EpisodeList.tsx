import { Link } from '@tanstack/react-router'
import { useState } from 'react'

interface EpisodeListProps {
    animeId: number
    animeTitle: string
    seasons: any[]
}

export function EpisodeList({ animeId, animeTitle, seasons }: EpisodeListProps) {
    const [selectedSeason, setSelectedSeason] = useState(0)

    if (!seasons || seasons.length === 0) {
        return (
            <div className="mt-8">
                <h2 className="text-2xl font-bold mb-4">📺 Episodios</h2>
                <p className="text-gray-400">No hay episodios disponibles</p>
            </div>
        )
    }

    const currentSeason = seasons[selectedSeason]
    const episodes = currentSeason?.episodes || []

    return (
        <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">
                📺 Episodios
                <span className="text-sm text-gray-400 ml-2">
                    ({seasons.length} {seasons.length === 1 ? 'temporada' : 'temporadas'})
                </span>
            </h2>
            
            {seasons.length > 1 && (
                <div className="flex gap-2 mb-4 flex-wrap">
                    {seasons.map((season, index) => (
                        <button
                            key={season.id}
                            onClick={() => setSelectedSeason(index)}
                            className={`px-4 py-2 rounded-lg transition ${
                                selectedSeason === index
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                        >
                            {season.name}
                            <span className="text-xs ml-1 text-gray-400">
                                ({season.episodes.length} eps)
                            </span>
                        </button>
                    ))}
                </div>
            )}

            {episodes.length === 0 ? (
                <p className="text-gray-400">No hay episodios en esta temporada</p>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {episodes.map((episode: any) => (
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
                                <div className="w-full h-full flex items-center justify-center text-gray-500 group-hover:text-gray-400">
                                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
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
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}