// src/routes/anime.$id.tsx
import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { GENRE_ES } from '@/lib/anilist'
import { cleanDescription } from '@/lib/translator'

// ============================================================
// FUNCIONES DINÁMICAS PARA DETECTAR TEMPORADAS
// ============================================================

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

function cleanTitle(title: string): string {
    return title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}

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

// ============================================================
// MAPA DE EPISODIOS CONOCIDOS PARA ANIMES POPULARES
// ============================================================

const KNOWN_EPISODES: Record<string, number> = {
    'one piece': 1122,
    'naruto': 220,
    'naruto shippuden': 500,
    'bleach': 366,
    'attack on titan': 87,
    'shingeki no kyojin': 87,
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
    'black clover': 170,
    'fairy tail': 328,
    'gintama': 367,
};

function getKnownEpisodes(title: string): number {
    const titleLower = title.toLowerCase().trim();
    for (const [key, episodes] of Object.entries(KNOWN_EPISODES)) {
        if (titleLower.includes(key) || key.includes(titleLower)) {
            return episodes;
        }
    }
    return 0;
}

// ============================================================
// OBTENER MAL ID
// ============================================================

async function getMalId(media: any, title: string): Promise<number | null> {
    if (media.externalLinks) {
        const malLink = media.externalLinks.find((link: any) => 
            link.site === 'MyAnimeList' || 
            link.site === 'MAL' ||
            link.url?.includes('myanimelist.net/anime')
        );
        if (malLink) {
            const match = malLink.url.match(/anime\/(\d+)/);
            if (match) {
                return parseInt(match[1]);
            }
        }
    }
    
    const knownIds: Record<string, number> = {
        'one piece': 21,
        'naruto': 20,
        'naruto shippuden': 1735,
        'bleach': 269,
        'attack on titan': 16498,
        'boku no hero academia': 38000,
        'my hero academia': 38000,
        'hunter x hunter': 11061,
        'hunter x hunter 2011': 11061,
        'death note': 1535,
        'fullmetal alchemist brotherhood': 5114,
        'sword art online': 11757,
        'tokyo ghoul': 22319,
        'dragon ball': 223,
        'dragon ball z': 813,
        'dragon ball super': 30694,
        'jujutsu kaisen': 48549,
        'demon slayer': 38000,
        'kimetsu no yaiba': 38000,
    };
    
    const titleLower = title.toLowerCase().trim();
    for (const [key, malId] of Object.entries(knownIds)) {
        if (titleLower.includes(key)) {
            return malId;
        }
    }
    
    return null;
}

// ============================================================
// FUNCIÓN PARA OBTENER DATOS DEL ANIME
// ============================================================

async function getAnimeInfo(id: number) {
    console.log('🔍 === INICIO getAnimeInfo ===');
    console.log('📌 ID recibido:', id);
    
    const response = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: JSON.stringify({
            query: `
                query ($id: Int) {
                    Media(id: $id, type: ANIME) {
                        id
                        title {
                            romaji
                            english
                            native
                        }
                        coverImage {
                            extraLarge
                            large
                            medium
                        }
                        bannerImage
                        episodes
                        genres
                        averageScore
                        description(asHtml: false)
                        status
                        seasonYear
                        format
                        duration
                        popularity
                        favourites
                        studios {
                            nodes {
                                name
                            }
                        }
                        externalLinks {
                            url
                            site
                            type
                        }
                    }
                }
            `,
            variables: { id }
        })
    })
    
    const json = await response.json()
    const media = json.data.Media
    
    const title = media.title.english || media.title.romaji || media.title.native
    const description = media.description ? cleanDescription(media.description) : null
    
    console.log('📌 Título obtenido:', title);
    
    const malId = await getMalId(media, title);
    console.log('📌 MAL ID:', malId);
    
    let seasons: { key: string; episodeCount: number }[] = [];
    let totalEpisodes = 0;
    
    // 1. localStorage (tokens del usuario)
    const localStorageSeasons = detectSeasons(title);
    const localStorageEpisodes = getTotalEpisodes(localStorageSeasons);
    
    if (localStorageSeasons.length > 0) {
        seasons = localStorageSeasons;
        totalEpisodes = localStorageEpisodes;
        console.log(`✅ Usando temporadas de localStorage: ${seasons.length}, episodios: ${totalEpisodes}`);
    }
    
    // 2. Si no hay temporadas, usar mapa conocido o AniList
    if (seasons.length === 0) {
        let episodes = getKnownEpisodes(title);
        if (episodes === 0) {
            episodes = media.episodes || 12;
        }
        if (episodes === 0) {
            episodes = 12;
        }
        seasons = [{ key: 'all-episodes', episodeCount: episodes }];
        totalEpisodes = episodes;
        console.log(`✅ Usando una sola temporada con ${totalEpisodes} episodios`);
    }
    
    console.log(`📊 "${title}" - Temporadas: ${seasons.length}, Episodios: ${totalEpisodes}`);
    console.log('🔍 === FIN getAnimeInfo ===');
    
    return {
        id: media.id,
        malId: malId,
        title: title,
        image: media.coverImage.extraLarge || media.coverImage.large,
        bannerImage: media.bannerImage,
        episodes: media.episodes || 0,
        totalEpisodes: totalEpisodes,
        genres: media.genres || [],
        averageScore: media.averageScore,
        description: description,
        status: media.status,
        year: media.seasonYear,
        format: media.format,
        duration: media.duration,
        popularity: media.popularity,
        favourites: media.favourites,
        studios: media.studios?.nodes.map((s: any) => s.name) || [],
        seasons: seasons,
        hasSeasons: seasons.length > 0 && seasons[0]?.key !== 'all-episodes',
        titleForNames: title,
    }
}

export const Route = createFileRoute('/anime/$id')({
    component: AnimeDetailComponent,
})

function AnimeDetailComponent() {
    const { id } = Route.useParams()
    const [anime, setAnime] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [selectedSeason, setSelectedSeason] = useState<number>(0)
    const [currentPage, setCurrentPage] = useState<number>(1)
    const EPISODES_PER_PAGE = 10

    useEffect(() => {
        async function loadAnime() {
            setLoading(true)
            setError(null)
            try {
                console.log('🔄 Cargando anime ID:', id)
                const data = await getAnimeInfo(Number(id))
                console.log('✅ Anime cargado:', data.title)
                console.log('📊 Temporadas:', data.seasons?.length || 0)
                console.log('📊 Episodios totales:', data.totalEpisodes)
                setAnime(data)
            } catch (err) {
                console.error('❌ Error:', err)
                setError('Error al cargar el anime')
            } finally {
                setLoading(false)
            }
        }
        loadAnime()
    }, [id])

    const changeSeason = (index: number) => {
        setSelectedSeason(index)
        setCurrentPage(1)
    }

    const changePage = (page: number) => {
        setCurrentPage(page)
        document.getElementById('episode-list')?.scrollIntoView({ behavior: 'smooth' })
    }

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <p className="mt-4 text-gray-500">Cargando información...</p>
                </div>
            </div>
        )
    }

    if (error || !anime) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="text-center py-12">
                    <p className="text-red-500">{error || 'No se encontró el anime'}</p>
                    <Link to="/" className="mt-4 inline-block px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700">
                        Volver al inicio
                    </Link>
                </div>
            </div>
        )
    }

    const seasons = anime.seasons || []
    let episodeList: number[] = []
    let hasSeasons = false
    
    if (seasons.length > 0) {
        if (seasons.length === 1 && seasons[0]?.key === 'all-episodes') {
            const total = anime.totalEpisodes || 0;
            if (total > 0) {
                episodeList = Array.from({ length: Math.min(total, 2000) }, (_, i) => i + 1);
            }
            hasSeasons = false;
        } else {
            hasSeasons = true;
            if (selectedSeason >= seasons.length) {
                setSelectedSeason(0)
            }
            let startEpisode = 1
            for (let i = 0; i < selectedSeason; i++) {
                startEpisode += (seasons[i]?.episodeCount || 0)
            }
            const currentSeason = seasons[selectedSeason]
            if (currentSeason) {
                episodeList = Array.from({ length: currentSeason.episodeCount }, (_, i) => startEpisode + i)
            }
        }
    } else {
        const total = anime.totalEpisodes || 0
        if (total > 0) {
            episodeList = Array.from({ length: Math.min(total, 2000) }, (_, i) => i + 1)
        }
    }

    const totalPages = Math.ceil(episodeList.length / EPISODES_PER_PAGE)
    const startIndex = (currentPage - 1) * EPISODES_PER_PAGE
    const endIndex = Math.min(startIndex + EPISODES_PER_PAGE, episodeList.length)
    const paginatedEpisodes = episodeList.slice(startIndex, endIndex)

    const getSeasonDisplayName = (index: number): string => {
        if (seasons.length === 1 && seasons[0]?.key === 'all-episodes') {
            return '📺 Todos los episodios';
        }
        return `Temporada ${index + 1}`;
    };

    if (episodeList.length === 0) {
        return (
            <div className="container mx-auto px-4 py-8">
                {anime.bannerImage && (
                    <div className="relative h-64 md:h-80 rounded-lg overflow-hidden mb-8">
                        <img src={anime.bannerImage} alt={anime.title} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
                    </div>
                )}
                <div className="flex flex-col md:flex-row gap-8">
                    <div className="md:w-1/4 flex-shrink-0">
                        <img src={anime.image} alt={anime.title} className="w-full rounded-lg shadow-lg" />
                    </div>
                    <div className="md:w-3/4">
                        <h1 className="text-3xl font-bold mb-2">{anime.title}</h1>
                        {anime.description && (
                            <p className="text-gray-300 leading-relaxed whitespace-pre-line">{anime.description}</p>
                        )}
                    </div>
                </div>
                <div className="mt-8">
                    <h2 className="text-2xl font-bold mb-4">📺 Episodios</h2>
                    <div className="bg-yellow-900/20 border border-yellow-500 rounded-lg p-4">
                        <p className="text-yellow-400 font-semibold">⚠️ No hay episodios disponibles</p>
                        <p className="text-gray-300 mt-1">Este anime no tiene episodios en la base de datos.</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-8">
            {anime.bannerImage && (
                <div className="relative h-64 md:h-80 rounded-lg overflow-hidden mb-8">
                    <img src={anime.bannerImage} alt={anime.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
                </div>
            )}

            <div className="flex flex-col md:flex-row gap-8">
                <div className="md:w-1/4 flex-shrink-0">
                    <img src={anime.image} alt={anime.title} className="w-full rounded-lg shadow-lg" />
                </div>
                <div className="md:w-3/4">
                    <h1 className="text-3xl font-bold mb-2">{anime.title}</h1>
                    
                    {anime.averageScore && (
                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-yellow-400 text-xl">★</span>
                            <span className="text-lg font-semibold">{(anime.averageScore / 10).toFixed(1)}</span>
                            <span className="text-gray-400">/ 10</span>
                            {anime.popularity && (
                                <span className="text-gray-400 ml-4">👁️ {anime.popularity.toLocaleString()}</span>
                            )}
                            {anime.favourites && (
                                <span className="text-gray-400 ml-4">❤️ {anime.favourites.toLocaleString()}</span>
                            )}
                        </div>
                    )}

                    {anime.genres && anime.genres.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                            {anime.genres.map((genre: string) => (
                                <Link
                                    key={genre}
                                    to="/genero/$slug"
                                    params={{ slug: genre.toLowerCase().replace(/\s+/g, '-') }}
                                    className="px-3 py-1 bg-gray-700 rounded-full text-sm hover:bg-gray-600 transition"
                                >
                                    {GENRE_ES[genre] || genre}
                                </Link>
                            ))}
                        </div>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6 text-sm">
                        {anime.totalEpisodes > 0 && (
                            <div>
                                <span className="text-gray-400">Episodios:</span>
                                <p className="font-semibold">{anime.totalEpisodes}</p>
                            </div>
                        )}
                        {anime.seasons && anime.seasons.length > 0 && (
                            <div>
                                <span className="text-gray-400">Temporadas:</span>
                                <p className="font-semibold">{anime.seasons.length}</p>
                            </div>
                        )}
                        {anime.malId && (
                            <div>
                                <span className="text-gray-400">MAL ID:</span>
                                <p className="font-semibold">{anime.malId}</p>
                            </div>
                        )}
                        {anime.status && (
                            <div>
                                <span className="text-gray-400">Estado:</span>
                                <p className="font-semibold">
                                    {anime.status === 'RELEASING' ? 'En emisión' : 
                                     anime.status === 'FINISHED' ? 'Finalizado' : 
                                     anime.status === 'NOT_YET_RELEASED' ? 'Próximamente' : 
                                     anime.status}
                                </p>
                            </div>
                        )}
                        {anime.format && (
                            <div>
                                <span className="text-gray-400">Formato:</span>
                                <p className="font-semibold">{anime.format}</p>
                            </div>
                        )}
                        {anime.duration && (
                            <div>
                                <span className="text-gray-400">Duración:</span>
                                <p className="font-semibold">{anime.duration} min</p>
                            </div>
                        )}
                        {anime.year && (
                            <div>
                                <span className="text-gray-400">Año:</span>
                                <p className="font-semibold">{anime.year}</p>
                            </div>
                        )}
                    </div>

                    {anime.description && (
                        <div className="mt-4">
                            <h2 className="text-xl font-semibold mb-2">📖 Sinopsis</h2>
                            <p className="text-gray-300 leading-relaxed whitespace-pre-line">{anime.description}</p>
                        </div>
                    )}

                    {anime.studios && anime.studios.length > 0 && (
                        <div className="mt-4">
                            <h2 className="text-xl font-semibold mb-2">🏢 Estudios</h2>
                            <p className="text-gray-300">{anime.studios.join(', ')}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* ============================================================ */}
            {/* LISTA DE EPISODIOS - SIN MINIATURAS */}
            {/* ============================================================ */}
            <div className="mt-8" id="episode-list">
                <h2 className="text-2xl font-bold mb-4">
                    📺 Episodios
                    <span className="text-sm text-gray-400 ml-2">({episodeList.length} episodios)</span>
                    {anime.seasons && anime.seasons.length > 0 && anime.seasons[0]?.key !== 'all-episodes' && (
                        <span className="text-sm text-gray-500 ml-2">
                            ({anime.seasons.length} temporadas)
                        </span>
                    )}
                </h2>
                
                {/* Selector de temporadas */}
                {hasSeasons && seasons.length > 0 && (
                    <div className="flex gap-2 mb-4 flex-wrap overflow-x-auto pb-2">
                        {seasons.map((season: any, index: number) => {
                            let startEp = 1;
                            for (let i = 0; i < index; i++) {
                                startEp += (seasons[i]?.episodeCount || 0);
                            }
                            const endEp = Math.min(startEp + season.episodeCount - 1, anime.totalEpisodes || episodeList.length);
                            
                            return (
                                <button
                                    key={season.key || index}
                                    onClick={() => changeSeason(index)}
                                    className={`px-4 py-2 rounded-lg text-sm transition whitespace-nowrap ${
                                        selectedSeason === index
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    }`}
                                >
                                    <span className="font-medium">{getSeasonDisplayName(index)}</span>
                                    <span className="text-xs ml-1 text-gray-400">
                                        ({startEp}-{endEp})
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Información de página */}
                <div className="flex justify-between items-center mb-3">
                    <span className="text-sm text-gray-400">
                        Mostrando episodios {startIndex + 1} - {endIndex} de {episodeList.length}
                    </span>
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

                {/* Grid de episodios - SIN MINIATURAS */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {paginatedEpisodes.map((num: number) => (
                        <Link
                            key={num}
                            to="/ver/$id/$episodeId"
                            params={{ id: String(anime.id), episodeId: String(num) }}
                            className="bg-gray-800 rounded-lg p-3 hover:bg-gray-700 transition group"
                        >
                            <div className="relative aspect-video bg-gray-700 rounded-lg overflow-hidden mb-2">
                                <div className="w-full h-full flex items-center justify-center text-gray-500 group-hover:text-gray-400">
                                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/70 text-white text-[10px] rounded">
                                    Ep. {num}
                                </span>
                            </div>
                            <p className="text-sm font-medium truncate text-center">
                                Episodio {num}
                            </p>
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
            </div>
        </div>
    )
}