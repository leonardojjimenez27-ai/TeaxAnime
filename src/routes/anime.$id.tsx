// src/routes/anime.$id.tsx
import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { GENRE_ES } from '@/lib/anilist'
import { cleanDescription } from '@/lib/translator'
import { getEpisodesForCurrentSeason } from '@/lib/anime/season-grouping'

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

// ============================================================
// 🔥 CACHÉ DE MINIATURAS EN LOCALSTORAGE
// ============================================================

function getThumbnailCacheKey(animeId: string, episodeNumber: number): string {
    return `thumbnail_${animeId}_${episodeNumber}`;
}

function getCachedThumbnail(animeId: string, episodeNumber: number): string | null {
    try {
        const key = getThumbnailCacheKey(animeId, episodeNumber);
        const cached = localStorage.getItem(key);
        if (cached) {
            const data = JSON.parse(cached);
            if (Date.now() - data.timestamp < 30 * 24 * 60 * 60 * 1000) {
                return data.url;
            }
            localStorage.removeItem(key);
        }
    } catch (e) {
        console.error('Error leyendo caché:', e);
    }
    return null;
}

function setCachedThumbnail(animeId: string, episodeNumber: number, url: string): void {
    try {
        const key = getThumbnailCacheKey(animeId, episodeNumber);
        localStorage.setItem(key, JSON.stringify({
            url: url,
            timestamp: Date.now()
        }));
    } catch (e) {
        console.error('Error guardando caché:', e);
    }
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
// 🔥 FUNCIONES PARA OBTENER MINIATURAS DE EPISODIOS
// ============================================================

function getThumbnailFromAniList(streamingEpisodes: any[], episodeNumber: number): string | null {
    for (const ep of streamingEpisodes) {
        if (ep.title) {
            const match = ep.title.match(/\d+/);
            if (match && parseInt(match[0]) === episodeNumber) {
                if (ep.thumbnail) {
                    return ep.thumbnail;
                }
            }
        }
    }
    return null;
}

function extractThumbnailFromBlogger(videoUrl: string): string | null {
    if (!videoUrl || !videoUrl.includes('blogger.com/video.g')) return null;
    if (videoUrl.includes('?')) {
        return `${videoUrl}&thumbnail=1`;
    }
    return `${videoUrl}?thumbnail=1`;
}

function extractThumbnailFromYouTube(videoUrl: string): string | null {
    if (!videoUrl) return null;
    const patterns = [
        /(?:youtube\.com\/embed\/|youtu\.be\/|youtube\.com\/watch\?v=)([^?&]+)/,
        /youtube\.com\/v\/([^?&]+)/,
    ];
    for (const pattern of patterns) {
        const match = videoUrl.match(pattern);
        if (match) {
            return `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`;
        }
    }
    return null;
}

function extractThumbnailFromVimeo(videoUrl: string): string | null {
    if (!videoUrl) return null;
    const match = videoUrl.match(/player\.vimeo\.com\/video\/(\d+)/);
    if (match) {
        return `https://vumbnail.com/${match[1]}.jpg`;
    }
    return null;
}

function extractThumbnailFromDailymotion(videoUrl: string): string | null {
    if (!videoUrl) return null;
    const match = videoUrl.match(/dailymotion\.com\/embed\/video\/([^?&]+)/);
    if (match) {
        return `https://www.dailymotion.com/thumbnail/video/${match[1]}`;
    }
    return null;
}

function getThumbnailFromToken(token: string): string | null {
    if (!token) return null;
    const sources = [
        extractThumbnailFromBlogger,
        extractThumbnailFromYouTube,
        extractThumbnailFromVimeo,
        extractThumbnailFromDailymotion,
    ];
    for (const source of sources) {
        const thumbnail = source(token);
        if (thumbnail) return thumbnail;
    }
    return null;
}

// ============================================================
// 🔥 OBTENER MINIATURA DE UN EPISODIO (CON CACHÉ)
// ============================================================

async function fetchEpisodeThumbnail(
    animeId: string,
    animeSlug: string,
    episodeNumber: number,
    streamingEpisodes: any[],
    tokens: Record<string, Record<number, string>>
): Promise<string | null> {
    console.log(`🔍 Buscando thumbnail para episodio ${episodeNumber}...`);
    
    // 1. Verificar caché primero
    const cached = getCachedThumbnail(animeId, episodeNumber);
    if (cached) {
        console.log(`✅ Thumbnail en caché para ep ${episodeNumber}`);
        return cached;
    }
    
    // 2. Intentar desde AniList streamingEpisodes
    const anilistThumbnail = getThumbnailFromAniList(streamingEpisodes, episodeNumber);
    if (anilistThumbnail) {
        console.log(`✅ Thumbnail AniList para ep ${episodeNumber}`);
        setCachedThumbnail(animeId, episodeNumber, anilistThumbnail);
        return anilistThumbnail;
    }
    
    // 3. Intentar desde el token (iframe) del episodio
    for (const [slug, episodes] of Object.entries(tokens)) {
        if (slug.includes(animeSlug) || animeSlug.includes(slug)) {
            if (episodes[episodeNumber]) {
                const thumbnail = getThumbnailFromToken(episodes[episodeNumber]);
                if (thumbnail) {
                    console.log(`✅ Thumbnail desde token para ep ${episodeNumber}`);
                    setCachedThumbnail(animeId, episodeNumber, thumbnail);
                    return thumbnail;
                }
            }
        }
    }
    
    // 4. Scraping de VerAnimeOnline (solo para primeros 50 episodios)
    const MAX_SCRAP = 50;
    if (episodeNumber <= MAX_SCRAP) {
        try {
            const url = `https://veranimeonline.co/episodio/${animeSlug}-episodio-${episodeNumber}/`;
            const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
            
            const response = await fetch(proxyUrl, { signal: AbortSignal.timeout(5000) });
            if (response.ok) {
                const html = await response.text();
                const patterns = [
                    /<meta\s+property="og:image"\s+content="([^"]+)"/i,
                    /<meta\s+name="twitter:image"\s+content="([^"]+)"/i,
                    /<img[^>]+class="[^"]*(?:poster|thumb|cover|episode-img)[^"]*"[^>]+src="([^"]+)"/i,
                    /<img[^>]+src="([^"]+)"[^>]+alt="[^"]*(?:episodio|episode|capitulo)\s*(\d+)"/i,
                    /<div[^>]+class="[^"]*video-thumbnail[^"]*"[^>]+style="[^"]*background-image:url\(([^)]+)\)/i,
                ];
                for (const pattern of patterns) {
                    const match = html.match(pattern);
                    if (match) {
                        let thumbnail = match[1];
                        thumbnail = thumbnail.replace(/^url\(['"]?|['"]?\)$/g, '');
                        if (thumbnail.startsWith('//')) thumbnail = 'https:' + thumbnail;
                        console.log(`✅ Thumbnail VerAnimeOnline para ep ${episodeNumber}`);
                        setCachedThumbnail(animeId, episodeNumber, thumbnail);
                        return thumbnail;
                    }
                }
            }
        } catch (error) {
            console.log(`⚠️ Error scraping VerAnimeOnline para ep ${episodeNumber}:`, error);
        }
    }
    
    console.log(`❌ No se encontró thumbnail para episodio ${episodeNumber}`);
    return null;
}

// ============================================================
// OBTENER DATOS DEL ANIME
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
                        streamingEpisodes {
                            title
                            thumbnail
                            url
                            site
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
    
    const streamingEpisodes = media.streamingEpisodes || [];
    const tokens = loadTokens();
    const clean = cleanTitle(title);
    const animeIdStr = String(id);
    
    // Obtener el slug principal
    let mainSlug = clean;
    const matchingSlugs = Object.keys(tokens).filter(s => 
        s.includes(clean) || clean.includes(s)
    );
    if (matchingSlugs.length > 0) {
        mainSlug = matchingSlugs[0];
    }
    
    console.log(`📂 Slug principal: "${mainSlug}"`);
    
    // 🔥 SOLO cargar thumbnails de AniList y caché (rápido)
    const episodeThumbnails: Record<number, string> = {};
    const totalEpisodes = media.episodes || 12;
    
    console.log(`📊 Total de episodios: ${totalEpisodes}`);
    
    // 1. Cargar desde caché
    let fromCache = 0;
    for (let i = 1; i <= Math.min(totalEpisodes, 200); i++) {
        const cached = getCachedThumbnail(animeIdStr, i);
        if (cached) {
            episodeThumbnails[i] = cached;
            fromCache++;
            console.log(`📸 Caché: episodio ${i} tiene miniatura`);
        }
    }
    console.log(`📸 Thumbnails desde caché: ${fromCache}`);
    
    // 2. Cargar desde AniList (los que no están en caché)
    let fromAniList = 0;
    for (const ep of streamingEpisodes) {
        if (ep.title) {
            const match = ep.title.match(/\d+/);
            if (match) {
                const epNum = parseInt(match[0]);
                if (ep.thumbnail && epNum <= totalEpisodes && !episodeThumbnails[epNum]) {
                    episodeThumbnails[epNum] = ep.thumbnail;
                    setCachedThumbnail(animeIdStr, epNum, ep.thumbnail);
                    fromAniList++;
                    console.log(`📸 AniList: episodio ${epNum} tiene miniatura`);
                }
            }
        }
    }
    console.log(`📸 Thumbnails desde AniList: ${fromAniList}`);
    console.log(`📸 Thumbnails totales iniciales: ${Object.keys(episodeThumbnails).length}`);
    
    // Mostrar qué episodios tienen miniatura
    const thumbKeys = Object.keys(episodeThumbnails).map(Number).sort((a, b) => a - b);
    console.log(`📸 Episodios con miniatura: ${thumbKeys.join(', ')}`);
    
    let seasons: { key: string; episodeCount: number }[] = [];
    let totalEpisodesFromTokens = 0;
    
    const seasonResult = getEpisodesForCurrentSeason(tokens, title, String(id));
    
    if (seasonResult.total > 0) {
        totalEpisodesFromTokens = seasonResult.total;
        seasons = [{ key: seasonResult.seasonKey || 'all-episodes', episodeCount: seasonResult.total }];
        console.log(`✅ Episodios encontrados para "${title}": ${seasonResult.total}`);
    } else {
        let episodes = media.episodes || getKnownEpisodes(title) || 12;
        seasons = [{ key: 'all-episodes', episodeCount: episodes }];
        console.log(`ℹ️ Usando datos de AniList: ${episodes} episodios`);
    }
    
    return {
        id: media.id,
        title: title,
        image: media.coverImage.extraLarge || media.coverImage.large,
        bannerImage: media.bannerImage,
        episodes: media.episodes || 0,
        totalEpisodes: seasonResult.total || media.episodes || 12,
        totalEpisodesFromTokens: totalEpisodesFromTokens,
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
        episodeThumbnails: episodeThumbnails,
        animeSlug: mainSlug,
        streamingEpisodes: streamingEpisodes,
        tokens: tokens,
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
    // 🔥 Estados para lazy loading
    const [loadedThumbnails, setLoadedThumbnails] = useState<Record<number, string>>({})
    const [loadingThumbnails, setLoadingThumbnails] = useState<Set<number>>(new Set())
    const [isLoadingPage, setIsLoadingPage] = useState(false)
    const EPISODES_PER_PAGE = 10

    useEffect(() => {
        async function loadAnime() {
            setLoading(true)
            setError(null)
            try {
                console.log('🔄 Cargando anime ID:', id)
                const data = await getAnimeInfo(Number(id))
                console.log('✅ Anime cargado:', data.title)
                console.log('📸 Thumbnails iniciales:', Object.keys(data.episodeThumbnails || {}).length)
                // Log para ver qué episodios tienen miniatura
                const keys = Object.keys(data.episodeThumbnails || {}).map(Number).sort((a, b) => a - b);
                console.log('📸 Episodios con miniatura inicial:', keys);
                setAnime(data)
                // Cargar miniaturas de la primera página
                await loadThumbnailsForPage(1, data)
            } catch (err) {
                console.error('❌ Error:', err)
                setError('Error al cargar el anime')
            } finally {
                setLoading(false)
            }
        }
        loadAnime()
    }, [id])

    // ============================================================
    // 🔥 CARGAR MINIATURAS BAJO DEMANDA (SOLO EPISODIOS VISIBLES)
    // ============================================================

    const loadThumbnailsForPage = async (page: number, animeData: any = anime) => {
        if (!animeData || isLoadingPage) return;
        
        setIsLoadingPage(true);
        
        try {
            const total = animeData.totalEpisodes || 0;
            const startIndex = (page - 1) * EPISODES_PER_PAGE;
            const endIndex = Math.min(startIndex + EPISODES_PER_PAGE, total);
            
            // Obtener números de episodios de esta página
            const episodeNumbers: number[] = [];
            for (let i = startIndex + 1; i <= endIndex; i++) {
                episodeNumbers.push(i);
            }
            
            console.log(`📸 Página ${page}: episodios ${episodeNumbers[0]}-${episodeNumbers[episodeNumbers.length-1]}`);
            console.log(`📸 Thumbnails existentes:`, Object.keys(animeData.episodeThumbnails || {}));
            
            // Filtrar episodios que ya tienen miniatura
            const toLoad = episodeNumbers.filter(num => 
                !animeData.episodeThumbnails?.[num] && 
                !loadedThumbnails[num] && 
                !loadingThumbnails.has(num)
            );
            
            console.log(`📸 Episodios a cargar: ${toLoad.length}`);
            
            if (toLoad.length === 0) {
                console.log(`📸 No hay miniaturas nuevas para cargar en página ${page}`);
                setIsLoadingPage(false);
                return;
            }
            
            console.log(`📸 Cargando ${toLoad.length} miniaturas para página ${page}`);
            
            // Marcar como cargando
            setLoadingThumbnails(prev => {
                const newSet = new Set(prev);
                toLoad.forEach(num => newSet.add(num));
                return newSet;
            });
            
            // Cargar miniaturas en lotes de 3
            const batchSize = 3;
            const results: Record<number, string> = {};
            
            for (let i = 0; i < toLoad.length; i += batchSize) {
                const batch = toLoad.slice(i, i + batchSize);
                const batchPromises = batch.map(async (num) => {
                    const thumb = await fetchEpisodeThumbnail(
                        id,
                        animeData.animeSlug || cleanTitle(animeData.title),
                        num,
                        animeData.streamingEpisodes || [],
                        animeData.tokens || {}
                    );
                    if (thumb) {
                        results[num] = thumb;
                        console.log(`📸 Episodio ${num}: miniatura cargada ✅`);
                    } else {
                        console.log(`📸 Episodio ${num}: sin miniatura ❌`);
                    }
                    return { num, thumb };
                });
                await Promise.all(batchPromises);
            }
            
            // Actualizar estado
            setLoadedThumbnails(prev => ({ ...prev, ...results }));
            setLoadingThumbnails(prev => {
                const newSet = new Set(prev);
                toLoad.forEach(num => newSet.delete(num));
                return newSet;
            });
            
            console.log(`✅ ${Object.keys(results).length} miniaturas cargadas para página ${page}`);
            
        } catch (error) {
            console.error('Error cargando miniaturas:', error);
        } finally {
            setIsLoadingPage(false);
        }
    };

    // Cargar miniaturas cuando cambia la página
    useEffect(() => {
        if (anime && !loading) {
            loadThumbnailsForPage(currentPage);
        }
    }, [currentPage, anime, loading]);

    // ============================================================
    // FUNCIONES DE NAVEGACIÓN
    // ============================================================

    const changeSeason = (index: number) => {
        setSelectedSeason(index);
        setCurrentPage(1);
        setLoadedThumbnails({});
        setLoadingThumbnails(new Set());
        if (anime) {
            setTimeout(() => loadThumbnailsForPage(1), 100);
        }
    };

    const changePage = (page: number) => {
        setCurrentPage(page);
        document.getElementById('episode-list')?.scrollIntoView({ behavior: 'smooth' });
    };

    // ============================================================
    // 🔥 OBTENER MINIATURA DEL EPISODIO
    // ============================================================

    const getEpisodeThumbnail = (episodeNumber: number): string => {
        // 1. Thumbnail inicial (de AniList o caché)
        if (anime?.episodeThumbnails?.[episodeNumber]) {
            console.log(`📸 Episodio ${episodeNumber}: usando miniatura inicial`);
            return anime.episodeThumbnails[episodeNumber];
        }
        // 2. Thumbnail cargado bajo demanda
        if (loadedThumbnails[episodeNumber]) {
            console.log(`📸 Episodio ${episodeNumber}: usando miniatura cargada`);
            return loadedThumbnails[episodeNumber];
        }
        // 3. Banner del anime (fallback)
        if (anime?.bannerImage) {
            return anime.bannerImage;
        }
        // 4. Portada del anime (fallback)
        if (anime?.image) {
            return anime.image;
        }
        // 5. UI Avatars (último recurso)
        const colors = ['1a1a2e', '16213e', '0f3460', '533483', 'e94560', 'f5a623', '4a90d9', '7b68ee', '00b894', 'e17055', '2d3436', '6c5ce7'];
        const color = colors[episodeNumber % colors.length];
        return `https://ui-avatars.com/api/?name=EP+${episodeNumber}&size=300&background=${color}&color=ffffff&font-size=0.5&bold=true&length=5`;
    };

    const hasRealThumbnail = (episodeNumber: number): boolean => {
        return !!(anime?.episodeThumbnails?.[episodeNumber] || loadedThumbnails[episodeNumber]);
    };

    const isLoadingThumbnail = (episodeNumber: number): boolean => {
        return loadingThumbnails.has(episodeNumber);
    };

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

    // Contar miniaturas totales
    const initialThumbCount = Object.keys(anime.episodeThumbnails || {}).length;
    const loadedThumbCount = Object.keys(loadedThumbnails).length;
    const totalThumbnails = initialThumbCount + loadedThumbCount;
    const thumbnailsInPage = paginatedEpisodes.filter(num => hasRealThumbnail(num)).length;

    console.log(`📸 Estadísticas: inicial=${initialThumbCount}, cargadas=${loadedThumbCount}, total=${totalThumbnails}, en página=${thumbnailsInPage}`);

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
                        {totalThumbnails > 0 && (
                            <div>
                                <span className="text-gray-400">Miniaturas:</span>
                                <p className="font-semibold text-blue-400">{totalThumbnails}</p>
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

                    {anime.totalEpisodesFromTokens > 0 && (
                        <div className="mt-2 mb-4">
                            <span className="text-xs bg-green-900/50 text-green-400 px-3 py-1 rounded-full">
                                ✅ {anime.totalEpisodesFromTokens} episodios extraídos de VerAnimeOnline
                            </span>
                        </div>
                    )}

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
            {/* LISTA DE EPISODIOS CON MINIATURAS LAZY LOADING */}
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
                    {anime.totalEpisodesFromTokens > 0 && (
                        <span className="text-xs text-green-400 ml-2">✅ Extraídos</span>
                    )}
                    {totalThumbnails > 0 && (
                        <span className="text-xs text-blue-400 ml-2">
                            📸 {totalThumbnails} miniaturas
                        </span>
                    )}
                    {isLoadingPage && (
                        <span className="text-xs text-yellow-400 ml-2">⏳ Cargando...</span>
                    )}
                </h2>
                
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

                <div className="flex justify-between items-center mb-3">
                    <span className="text-sm text-gray-400">
                        Mostrando episodios {startIndex + 1} - {endIndex} de {episodeList.length}
                        {thumbnailsInPage > 0 && (
                            <span className="text-blue-400 ml-2">
                                ({thumbnailsInPage} con miniatura)
                            </span>
                        )}
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

                {/* 🔥 GRID DE EPISODIOS CON LAZY LOADING */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {paginatedEpisodes.map((num: number) => {
                        const thumbnail = getEpisodeThumbnail(num);
                        const real = hasRealThumbnail(num);
                        const loading = isLoadingThumbnail(num);
                        
                        // Log para depurar cada episodio
                        if (real) {
                            console.log(`📸 Episodio ${num} tiene miniatura: ${thumbnail?.substring(0, 50)}...`);
                        }
                        
                        return (
                            <Link
                                key={num}
                                to="/ver/$id/$episodeId"
                                params={{ id: String(anime.id), episodeId: String(num) }}
                                className="bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-700 transition group relative"
                            >
                                <div className="relative aspect-video bg-gray-700 overflow-hidden">
                                    {loading ? (
                                        <div className="w-full h-full flex items-center justify-center bg-gray-700">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                                        </div>
                                    ) : (
                                        <img
                                            src={thumbnail}
                                            alt={`Episodio ${num} de ${anime.title}`}
                                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                            loading="lazy"
                                            onError={(e) => {
                                                console.log(`⚠️ Error cargando miniatura para episodio ${num}`);
                                                if (anime.bannerImage) {
                                                    e.currentTarget.src = anime.bannerImage;
                                                }
                                            }}
                                            onLoad={() => {
                                                console.log(`✅ Miniatura cargada para episodio ${num}`);
                                            }}
                                        />
                                    )}
                                    {real && !loading && (
                                        <span className="absolute top-1 right-1 px-1.5 py-0.5 bg-blue-600/80 text-white text-[8px] rounded">
                                            📸
                                        </span>
                                    )}
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition">
                                        <svg className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M8 5v14l11-7z" />
                                        </svg>
                                    </div>
                                    <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/70 text-white text-[10px] rounded">
                                        Ep. {num}
                                    </span>
                                </div>
                                <div className="p-2">
                                    <p className="text-sm font-medium truncate text-center">
                                        Episodio {num}
                                    </p>
                                </div>
                            </Link>
                        );
                    })}
                </div>

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
            
            {/* ============================================================ */}
            {/* MENSAJE INFORMATIVO */}
            {/* ============================================================ */}
            {totalThumbnails === 0 && anime.totalEpisodes > 0 && (
                <div className="mt-4 p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                    <p className="text-yellow-400 text-sm">
                        ⚠️ No se encontraron miniaturas para este anime. 
                        Las miniaturas se cargarán automáticamente cuando estén disponibles.
                    </p>
                </div>
            )}
            {totalThumbnails > 0 && totalThumbnails < anime.totalEpisodes && (
                <div className="mt-4 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                    <p className="text-blue-400 text-sm">
                        📸 {totalThumbnails} de {anime.totalEpisodes} episodios tienen miniatura.
                        {isLoadingPage ? ' Cargando más...' : ' Las demás se cargarán al navegar.'}
                    </p>
                </div>
            )}
        </div>
    )
}