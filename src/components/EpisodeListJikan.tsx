// src/components/EpisodeListJikan.tsx
import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useJikanEpisodes } from '@/hooks/useJikanEpisodes';
import { 
    groupEpisodesBySeasons, 
    paginateEpisodes, 
    getTotalPages,
    getSeasonName 
} from '@/lib/episodes/temporadas';

interface EpisodeListJikanProps {
    animeId: number;
    animeTitle: string;
    malId?: number | null;
    totalEpisodes?: number;
}

export function EpisodeListJikan({ animeId, animeTitle, malId, totalEpisodes = 12 }: EpisodeListJikanProps) {
    const { episodes, loading, error, totalEpisodes: total } = useJikanEpisodes(
        malId || animeId,
        animeTitle
    );
    const [selectedSeason, setSelectedSeason] = useState<number>(1);
    const [currentPage, setCurrentPage] = useState(1);
    const [viewMode, setViewMode] = useState<'seasons' | 'all'>('seasons');
    const PAGE_SIZE = 10;

    // Generar una miniatura atractiva sin depender de CORS
    const getThumbnail = (epNum: number): string => {
        // Usar UI Avatars - genera imágenes con el número de episodio
        // Colores diferentes para cada episodio
        const colors = ['1a1a2e', '16213e', '0f3460', '533483', 'e94560', 'f5a623', '4a90d9', '7b68ee', '00b894', 'e17055', '2d3436', '6c5ce7'];
        const color = colors[epNum % colors.length];
        return `https://ui-avatars.com/api/?name=EP+${epNum}&size=300&background=${color}&color=ffffff&font-size=0.5&bold=true&length=5`;
    };

    if (error) {
        return (
            <div className="mt-8">
                <h2 className="text-2xl font-bold mb-4">📺 Episodios</h2>
                <div className="bg-yellow-900/20 border border-yellow-500 rounded-lg p-4">
                    <p className="text-yellow-400 font-semibold">⚠️ Episodios no disponibles</p>
                    <p className="text-gray-300 mt-1">
                        No se pudieron cargar los episodios desde MyAnimeList.
                    </p>
                </div>
            </div>
        );
    }

    if (loading && episodes.length === 0) {
        return (
            <div className="mt-8">
                <h2 className="text-2xl font-bold mb-4">📺 Episodios</h2>
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <p className="mt-4 text-gray-500">Cargando episodios...</p>
                </div>
            </div>
        );
    }

    if (episodes.length === 0) {
        return (
            <div className="mt-8">
                <h2 className="text-2xl font-bold mb-4">📺 Episodios</h2>
                <div className="bg-yellow-900/20 border border-yellow-500 rounded-lg p-4">
                    <p className="text-yellow-400">No hay episodios disponibles</p>
                    <p className="text-sm text-gray-500 mt-2">
                        {malId ? `ID de MyAnimeList: ${malId}` : 'No se encontró el ID de MyAnimeList'}
                    </p>
                </div>
            </div>
        );
    }

    const seasons = groupEpisodesBySeasons(episodes, animeTitle);
    const seasonIds = Array.from(seasons.keys()).sort((a, b) => a - b);
    
    if (!seasons.has(selectedSeason) && seasonIds.length > 0) {
        setSelectedSeason(seasonIds[0]);
    }
    
    const currentSeasonEpisodes = seasons.get(selectedSeason) || [];
    const totalPages = getTotalPages(currentSeasonEpisodes, PAGE_SIZE);
    const paginatedEpisodes = paginateEpisodes(currentSeasonEpisodes, currentPage, PAGE_SIZE);

    const changeSeason = (seasonId: number) => {
        setSelectedSeason(seasonId);
        setCurrentPage(1);
    };

    const changePage = (page: number) => {
        setCurrentPage(page);
        document.getElementById('episode-list')?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="mt-8" id="episode-list">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <h2 className="text-2xl font-bold">
                    📺 Episodios
                    {total > 0 && (
                        <span className="text-sm text-gray-400 ml-2">
                            ({total} episodios)
                        </span>
                    )}
                    {malId && (
                        <span className="text-xs text-gray-500 ml-2">
                            MAL ID: {malId}
                        </span>
                    )}
                </h2>
                
                <div className="flex gap-2">
                    <button
                        onClick={() => setViewMode('seasons')}
                        className={`px-3 py-1 rounded-lg text-sm transition ${
                            viewMode === 'seasons' 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                    >
                        Por Temporadas
                    </button>
                    <button
                        onClick={() => setViewMode('all')}
                        className={`px-3 py-1 rounded-lg text-sm transition ${
                            viewMode === 'all' 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                    >
                        Todos
                    </button>
                </div>
            </div>

            {viewMode === 'seasons' && (
                <>
                    <div className="flex gap-2 mb-4 flex-wrap">
                        {seasonIds.map((seasonId) => {
                            const seasonEpisodes = seasons.get(seasonId) || [];
                            return (
                                <button
                                    key={seasonId}
                                    onClick={() => changeSeason(seasonId)}
                                    className={`px-3 py-1 rounded-lg text-sm transition ${
                                        selectedSeason === seasonId
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    }`}
                                >
                                    {getSeasonName(seasonId, animeTitle)}
                                    <span className="text-xs ml-1 text-gray-400">
                                        ({seasonEpisodes.length} eps)
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {paginatedEpisodes.map((episode: any) => {
                            const thumbnailUrl = episode.thumbnail || getThumbnail(episode.mal_id);
                            return (
                                <Link
                                    key={episode.mal_id}
                                    to="/ver/$id/$episodeId"
                                    params={{ 
                                        id: String(animeId),
                                        episodeId: String(episode.mal_id) 
                                    }}
                                    className="bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-700 transition group block"
                                >
                                    <div className="relative aspect-video bg-gray-700 overflow-hidden">
                                        <img
                                            src={thumbnailUrl}
                                            alt={`Episodio ${episode.mal_id}`}
                                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                            loading="lazy"
                                        />
                                        {/* Hover overlay con play */}
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition">
                                            <svg className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M8 5v14l11-7z" />
                                            </svg>
                                        </div>
                                        {/* Badges */}
                                        {episode.filler && (
                                            <span className="absolute top-1 right-1 px-1.5 py-0.5 bg-yellow-600/80 text-white text-[10px] rounded">
                                                Filler
                                            </span>
                                        )}
                                        {episode.recap && (
                                            <span className="absolute top-1 right-1 px-1.5 py-0.5 bg-purple-600/80 text-white text-[10px] rounded">
                                                Recap
                                            </span>
                                        )}
                                        {/* Número de episodio */}
                                        <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/70 text-white text-[10px] rounded">
                                            Ep. {episode.mal_id}
                                        </span>
                                    </div>
                                    <div className="p-2">
                                        <p className="text-xs text-gray-300 truncate">
                                            {episode.title && episode.title !== `Episodio ${episode.mal_id}` 
                                                ? episode.title 
                                                : `Episodio ${episode.mal_id}`}
                                        </p>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>

                    {totalPages > 1 && (
                        <div className="flex justify-center gap-2 mt-4 flex-wrap">
                            <button
                                onClick={() => changePage(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="px-3 py-1 bg-gray-700 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-600 transition"
                            >
                                ◀ Anterior
                            </button>
                            
                            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                let pageNum;
                                if (totalPages <= 5) {
                                    pageNum = i + 1;
                                } else if (currentPage <= 3) {
                                    pageNum = i + 1;
                                } else if (currentPage >= totalPages - 2) {
                                    pageNum = totalPages - 4 + i;
                                } else {
                                    pageNum = currentPage - 2 + i;
                                }
                                
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => changePage(pageNum)}
                                        className={`px-3 py-1 rounded-lg text-sm transition ${
                                            currentPage === pageNum
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                        }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                            
                            <button
                                onClick={() => changePage(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 bg-gray-700 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-600 transition"
                            >
                                Siguiente ▶
                            </button>
                        </div>
                    )}
                </>
            )}

            {viewMode === 'all' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 max-h-[600px] overflow-y-auto">
                    {episodes.map((episode: any) => {
                        const thumbnailUrl = episode.thumbnail || getThumbnail(episode.mal_id);
                        return (
                            <Link
                                key={episode.mal_id}
                                to="/ver/$id/$episodeId"
                                params={{ 
                                    id: String(animeId),
                                    episodeId: String(episode.mal_id) 
                                }}
                                className="bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-700 transition group block"
                            >
                                <div className="relative aspect-video bg-gray-700 overflow-hidden">
                                    <img
                                        src={thumbnailUrl}
                                        alt={`Episodio ${episode.mal_id}`}
                                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                        loading="lazy"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition">
                                        <svg className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M8 5v14l11-7z" />
                                        </svg>
                                    </div>
                                    {episode.filler && (
                                        <span className="absolute top-1 right-1 px-1.5 py-0.5 bg-yellow-600/80 text-white text-[10px] rounded">
                                            Filler
                                        </span>
                                    )}
                                    {episode.recap && (
                                        <span className="absolute top-1 right-1 px-1.5 py-0.5 bg-purple-600/80 text-white text-[10px] rounded">
                                            Recap
                                        </span>
                                    )}
                                    <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/70 text-white text-[10px] rounded">
                                        Ep. {episode.mal_id}
                                    </span>
                                </div>
                                <div className="p-2">
                                    <p className="text-xs text-gray-300 truncate">
                                        {episode.title && episode.title !== `Episodio ${episode.mal_id}` 
                                            ? episode.title 
                                            : `Episodio ${episode.mal_id}`}
                                    </p>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}