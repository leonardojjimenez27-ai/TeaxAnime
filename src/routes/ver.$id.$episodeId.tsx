// src/routes/ver.$id.$episodeId.tsx
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { animeApi } from '@/lib/anilist'

// ============================================================
// FUNCIONES DINÁMICAS PARA DETECTAR TEMPORADAS
// ============================================================

// Función para cargar tokens desde localStorage
function loadTokens(): Record<string, Record<number, string>> {
    if (typeof window === 'undefined') return {};
    try {
        const saved = localStorage.getItem('blogger_tokens');
        if (saved) {
            return JSON.parse(saved);
        }
    } catch (e) {
        console.error('Error cargando tokens:', e);
    }
    return {};
}

// Función para limpiar el título
function cleanTitle(title: string): string {
    return title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}

// Función para detectar temporadas automáticamente
function detectSeasons(animeTitle: string): { key: string; episodeCount: number }[] {
    const tokens = loadTokens();
    const clean = cleanTitle(animeTitle);
    const seasons: { key: string; episodeCount: number }[] = [];
    
    const variants = [
        clean,
        animeTitle.toLowerCase().replace(/\s+/g, '-'),
        animeTitle.toLowerCase().replace(/\s+/g, '_'),
        animeTitle.toLowerCase().replace(/\s+/g, ''),
    ];
    
    for (let i = 1; i <= 20; i++) {
        variants.push(`${clean}-${i}`);
        variants.push(`${clean}-season-${i}`);
        variants.push(`${clean}-part-${i}`);
        variants.push(`${clean}-${i}-season`);
        variants.push(`${clean}-${i}-part`);
    }
    
    variants.push(`${clean}-final-season`);
    variants.push(`${clean}-the-final-season`);
    variants.push(`${clean}-final`);
    variants.push(`${clean}-the-final`);
    variants.push(`${clean}-final-season-part-1`);
    variants.push(`${clean}-final-season-part-2`);
    variants.push(`${clean}-final-season-part-3`);
    variants.push(`${clean}-the-final-season-part-1`);
    variants.push(`${clean}-the-final-season-part-2`);
    variants.push(`${clean}-the-final-season-part-3`);
    
    for (let i = 1; i <= 10; i++) {
        variants.push(`${clean}-part-${i}`);
        variants.push(`${clean}-parte-${i}`);
    }
    
    for (let i = 1; i <= 10; i++) {
        variants.push(`${clean}-cour-${i}`);
        variants.push(`${clean}-season-${i}-cour-1`);
        variants.push(`${clean}-season-${i}-cour-2`);
    }
    
    const uniqueVariants = [...new Set(variants)];
    
    for (const variant of uniqueVariants) {
        if (tokens[variant]) {
            const episodeCount = Object.keys(tokens[variant]).length;
            if (episodeCount > 0) {
                const exists = seasons.some(s => s.key === variant);
                if (!exists) {
                    seasons.push({ key: variant, episodeCount });
                }
            }
        }
    }
    
    seasons.sort((a, b) => b.episodeCount - a.episodeCount);
    return seasons;
}

function getTotalEpisodes(seasons: { key: string; episodeCount: number }[]): number {
    return seasons.reduce((sum, s) => sum + s.episodeCount, 0);
}

function getSeasonName(key: string, index: number): string {
    if (!key.match(/-\d+$/) && !key.includes('season') && !key.includes('part') && !key.includes('final')) {
        return 'Temporada 1';
    }
    
    const numMatch = key.match(/-(\d+)/);
    if (numMatch) {
        return `Temporada ${numMatch[1]}`;
    }
    
    if (key.includes('final')) {
        return 'Temporada Final';
    }
    
    return `Temporada ${index + 1}`;
}

function getSeasonKeyForEpisode(episodeNum: number, seasons: { key: string; episodeCount: number }[]): { key: string; relativeEpisode: number; seasonIndex: number } {
    let accumulated = 0;
    for (let i = 0; i < seasons.length; i++) {
        const season = seasons[i];
        if (episodeNum <= accumulated + season.episodeCount) {
            return {
                key: season.key,
                relativeEpisode: episodeNum - accumulated,
                seasonIndex: i
            };
        }
        accumulated += season.episodeCount;
    }
    return { key: '', relativeEpisode: episodeNum, seasonIndex: 0 };
}

// ============================================================
// MAPA DE EPISODIOS CONOCIDOS
// ============================================================

const KNOWN_EPISODES: Record<string, number> = {
    'one piece': 1122,
    'naruto': 220,
    'naruto shippuden': 500,
    'bleach': 366,
    'attack on titan': 87,
    'boku no hero academia': 150,
    'my hero academia': 150,
    'hunter x hunter': 148,
    'hunter x hunter 2011': 148,
    'death note': 37,
    'fullmetal alchemist brotherhood': 64,
    'sword art online': 96,
    'tokyo ghoul': 24,
    'dragon ball': 153,
    'dragon ball z': 291,
    'dragon ball super': 131,
    'jujutsu kaisen': 47,
    'demon slayer': 55,
    'kimetsu no yaiba': 55,
};

function getKnownEpisodes(title: string): number {
    const titleLower = title.toLowerCase().trim();
    for (const [key, episodes] of Object.entries(KNOWN_EPISODES)) {
        if (titleLower.includes(key)) {
            return episodes;
        }
    }
    return 0;
}

// ============================================================
// FUNCIÓN PARA BUSCAR TOKEN POR TÍTULO
// ============================================================

function findTokenForEpisode(animeTitle: string, episodeNum: number): string | null {
    const tokens = loadTokens();
    const titleLower = animeTitle.toLowerCase().trim();
    const clean = cleanTitle(animeTitle);
    
    // Generar todas las variantes del título
    const variants = [
        clean,
        titleLower.replace(/\s+/g, '-'),
        titleLower.replace(/\s+/g, '_'),
        titleLower.replace(/\s+/g, ''),
        titleLower,
    ];
    
    // Buscar en las temporadas detectadas
    const seasons = detectSeasons(animeTitle);
    const seasonData = getSeasonKeyForEpisode(episodeNum, seasons);
    if (seasonData.key && tokens[seasonData.key]?.[seasonData.relativeEpisode]) {
        return tokens[seasonData.key][seasonData.relativeEpisode];
    }
    
    // Buscar por variantes del título
    for (const variant of variants) {
        // Buscar directamente en el token
        if (tokens[variant]?.[episodeNum]) {
            return tokens[variant][episodeNum];
        }
        // Buscar con sufijos de temporada (ej: variant-2, variant-3, etc.)
        for (let i = 1; i <= 20; i++) {
            const seasonKey = `${variant}-${i}`;
            if (tokens[seasonKey]?.[episodeNum]) {
                return tokens[seasonKey][episodeNum];
            }
        }
        // Buscar con "season" en el nombre
        for (let i = 1; i <= 20; i++) {
            const seasonKey = `${variant}-season-${i}`;
            if (tokens[seasonKey]?.[episodeNum]) {
                return tokens[seasonKey][episodeNum];
            }
        }
    }
    
    return null;
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export const Route = createFileRoute('/ver/$id/$episodeId')({
    component: WatchComponent,
})

function WatchComponent() {
    const { id, episodeId } = Route.useParams()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [anime, setAnime] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)
    const [videoUrl, setVideoUrl] = useState<string | null>(null)
    const [seasonKey, setSeasonKey] = useState<string>('')
    const [seasonName, setSeasonName] = useState<string>('')
    const [totalEpisodes, setTotalEpisodes] = useState(12)
    const [seasons, setSeasons] = useState<{ key: string; episodeCount: number }[]>([])
    const [selectedSeason, setSelectedSeason] = useState<number>(0)
    const [currentPage, setCurrentPage] = useState<number>(1)
    const EPISODES_PER_PAGE = 10

    useEffect(() => {
        async function loadAnime() {
            try {
                console.log('🔄 Cargando anime ID:', id);
                const info = await animeApi.info(Number(id));
                console.log('✅ Anime cargado:', info.title);
                setAnime(info);
                
                // Detectar temporadas
                const detectedSeasons = detectSeasons(info.title);
                setSeasons(detectedSeasons);
                
                // Calcular total de episodios
                let total = getTotalEpisodes(detectedSeasons);
                if (total === 0) {
                    total = info.episodes || getKnownEpisodes(info.title) || 12;
                }
                setTotalEpisodes(total);
                
                console.log(`📊 Temporadas detectadas: ${detectedSeasons.length}`);
                console.log(`📺 Total de episodios: ${total}`);
            } catch (err) {
                console.error('❌ Error:', err);
                setError('Error al cargar el anime');
            } finally {
                setLoading(false);
            }
        }
        loadAnime();
    }, [id]);

    // Buscar el token para el episodio usando el título del anime
    useEffect(() => {
        if (typeof window === 'undefined' || !anime) return;
        
        const episodeNum = Number(episodeId);
        console.log(`🔍 Buscando token para "${anime.title}" - Episodio ${episodeNum}`);
        
        // Usar la función mejorada de búsqueda
        const token = findTokenForEpisode(anime.title, episodeNum);
        
        // Buscar información de la temporada
        let sName = '';
        let seasonIdx = 0;
        const seasonData = getSeasonKeyForEpisode(episodeNum, seasons);
        if (seasonData.key) {
            sName = getSeasonName(seasonData.key, seasonData.seasonIndex);
            seasonIdx = seasonData.seasonIndex;
            setSeasonKey(seasonData.key);
        }
        
        console.log('🎯 Token encontrado:', token ? '✅' : '❌');
        if (token) {
            console.log('🔗 URL del video:', token.substring(0, 80) + '...');
        } else {
            console.log('💡 Tokens disponibles:', Object.keys(loadTokens()));
        }
        
        setVideoUrl(token || null);
        setSeasonName(sName);
        setSelectedSeason(seasonIdx);
    }, [episodeId, anime, seasons]);

    // Cambiar de temporada
    const changeSeason = (seasonIndex: number) => {
        setSelectedSeason(seasonIndex);
        setCurrentPage(1);
        const season = seasons[seasonIndex];
        if (season) {
            let startEpisode = 1;
            for (let i = 0; i < seasonIndex; i++) {
                startEpisode += (seasons[i]?.episodeCount || 0);
            }
            navigate({
                to: '/ver/$id/$episodeId',
                params: { id, episodeId: String(startEpisode) }
            });
        }
    };

    // Cambiar de página
    const changePage = (page: number) => {
        setCurrentPage(page);
        document.getElementById('episode-list')?.scrollIntoView({ behavior: 'smooth' });
    };

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <p className="mt-4 text-gray-500">Cargando...</p>
                </div>
            </div>
        )
    }

    if (error || !anime) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="text-center py-12">
                    <p className="text-red-500">{error || 'Error'}</p>
                    <Link to="/" className="mt-4 inline-block px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700">
                        Volver
                    </Link>
                </div>
            </div>
        )
    }

    const episodeNumber = Number(episodeId)
    const hasNext = episodeNumber < totalEpisodes
    const hasPrevious = episodeNumber > 1

    const handleNext = () => {
        if (hasNext) {
            navigate({
                to: '/ver/$id/$episodeId',
                params: { id, episodeId: String(episodeNumber + 1) }
            })
        }
    }

    const handlePrevious = () => {
        if (hasPrevious) {
            navigate({
                to: '/ver/$id/$episodeId',
                params: { id, episodeId: String(episodeNumber - 1) }
            })
        }
    }

    // Obtener los episodios de la temporada seleccionada
    let startEpisode = 1;
    for (let i = 0; i < selectedSeason; i++) {
        startEpisode += (seasons[i]?.episodeCount || 0);
    }
    const currentSeason = seasons[selectedSeason];
    const seasonEpisodes = currentSeason 
        ? Array.from({ length: currentSeason.episodeCount }, (_, i) => startEpisode + i)
        : [];

    // Paginación
    const totalPages = Math.ceil(seasonEpisodes.length / EPISODES_PER_PAGE);
    const startIndex = (currentPage - 1) * EPISODES_PER_PAGE;
    const endIndex = startIndex + EPISODES_PER_PAGE;
    const paginatedEpisodes = seasonEpisodes.slice(startIndex, endIndex);

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-4">
                <Link to="/anime/$id" params={{ id }} className="text-blue-400 hover:text-blue-300 transition">
                    ← Volver a {anime.title}
                </Link>
            </div>

            <h1 className="text-2xl font-bold mb-2">{anime.title}</h1>
            <p className="text-gray-400 mb-4">
                Episodio {episodeId} de {totalEpisodes}
                {seasonName && <span className="text-xs text-gray-500 ml-2">({seasonName})</span>}
            </p>

            {/* Reproductor */}
            <div className="bg-gray-900 rounded-lg overflow-hidden">
                <div className="relative aspect-video bg-black">
                    {videoUrl ? (
                        <iframe
                            src={videoUrl}
                            className="w-full h-full"
                            allowFullScreen
                            allow="encrypted-media; picture-in-picture; autoplay; fullscreen"
                            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
                            loading="eager"
                            referrerPolicy="no-referrer"
                        />
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 p-4 text-center">
                            <p className="text-yellow-400 text-lg font-semibold">⚠️ Video no disponible</p>
                            <p className="text-sm text-gray-400 mt-2 max-w-md">
                                No se encontró un enlace de video para este episodio.
                            </p>
                            <p className="text-xs text-gray-500 mt-4">
                                {anime.title} - Episodio {episodeId}
                            </p>
                            <p className="text-xs text-gray-500 mt-2">
                                Tokens disponibles: {Object.keys(loadTokens()).join(', ')}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                ¿Tienes tokens para este anime? Agrégalos en la configuración.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Controles */}
            <div className="flex justify-between mt-4">
                <button
                    onClick={handlePrevious}
                    disabled={!hasPrevious}
                    className="px-6 py-2 bg-gray-700 rounded-lg disabled:opacity-50 hover:bg-gray-600 transition"
                >
                    ◀ Anterior
                </button>
                <span className="text-gray-400 text-sm self-center">
                    Episodio {episodeId} de {totalEpisodes}
                </span>
                <button
                    onClick={handleNext}
                    disabled={!hasNext}
                    className="px-6 py-2 bg-blue-600 rounded-lg disabled:opacity-50 hover:bg-blue-700 transition"
                >
                    Siguiente ▶
                </button>
            </div>

            {/* ============================================================ */}
            {/* LISTA DE EPISODIOS CON PAGINACIÓN */}
            {/* ============================================================ */}
            <div className="mt-8" id="episode-list">
                <h3 className="text-lg font-semibold mb-4">📺 Lista de episodios</h3>
                
                {/* Selector de temporadas */}
                {seasons.length > 0 && (
                    <div className="flex gap-2 mb-4 flex-wrap">
                        {seasons.map((season, index) => (
                            <button
                                key={season.key}
                                onClick={() => changeSeason(index)}
                                className={`px-4 py-2 rounded-lg text-sm transition ${
                                    selectedSeason === index
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                }`}
                            >
                                {getSeasonName(season.key, index)}
                                <span className="text-xs ml-1 text-gray-400">
                                    ({season.episodeCount} eps)
                                </span>
                            </button>
                        ))}
                    </div>
                )}

                {/* Información de paginación */}
                {totalPages > 1 && (
                    <div className="flex justify-between items-center mb-3">
                        <div className="text-sm text-gray-400">
                            Página {currentPage} de {totalPages}
                            <span className="ml-2">
                                ({paginatedEpisodes.length} de {seasonEpisodes.length} episodios)
                            </span>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => changePage(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="px-3 py-1 bg-gray-700 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-600 transition"
                            >
                                ◀
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
                                ▶
                            </button>
                        </div>
                    </div>
                )}

                {/* Grid de episodios paginados */}
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                    {paginatedEpisodes.map((num) => (
                        <Link
                            key={num}
                            to="/ver/$id/$episodeId"
                            params={{ id, episodeId: String(num) }}
                            className={`px-3 py-2 rounded-lg text-center text-sm transition ${
                                num === episodeNumber
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                            }`}
                        >
                            Ep. {num}
                        </Link>
                    ))}
                </div>

                {/* Paginación inferior */}
                {totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-4">
                        <button
                            onClick={() => changePage(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="px-3 py-1 bg-gray-700 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-600 transition"
                        >
                            ◀ Anterior
                        </button>
                        <span className="px-3 py-1 text-gray-400 text-sm">
                            {currentPage} / {totalPages}
                        </span>
                        <button
                            onClick={() => changePage(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1 bg-gray-700 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-600 transition"
                        >
                            Siguiente ▶
                        </button>
                    </div>
                )}
                
                {paginatedEpisodes.length === 0 && (
                    <p className="text-center text-gray-500 text-sm mt-4">
                        No hay episodios en esta temporada
                    </p>
                )}
            </div>
        </div>
    )
}