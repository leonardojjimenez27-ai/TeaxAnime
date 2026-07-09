// src/lib/anilist/api.ts
import { request } from './client'
import { 
    TRENDING_QUERY, 
    POPULAR_QUERY, 
    SEARCH_QUERY, 
    ANIME_INFO_QUERY,
    SEASON_QUERY,
    GENRE_QUERY
} from './queries'
import { mapToAnimeResult, mapToAnimeInfo } from './mapper'
import { cache } from './cache'
import type { AnimeResult, AnimeInfo, PageInfo } from './types'

// ============================================================
// CONFIGURACIÓN DE REINTENTOS
// ============================================================

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;
const RETRYABLE_ERRORS = [
    'ECONNRESET',
    'ETIMEDOUT',
    'ECONNREFUSED',
    'fetch failed',
    'timeout',
    'network',
    'abort',
    'terminated'
];

function isRetryableError(error: any): boolean {
    const message = (error?.message || '').toLowerCase();
    const code = error?.code || '';
    
    return RETRYABLE_ERRORS.some(err => 
        message.includes(err.toLowerCase()) || 
        code.includes(err) ||
        error?.name?.toLowerCase() === err.toLowerCase()
    );
}

async function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================
// WRAPPER CON REINTENTOS PARA request()
// ============================================================

async function requestWithRetry<T>(
    query: string,
    variables?: Record<string, unknown>,
    retryCount: number = 0
): Promise<T> {
    try {
        console.log(`📡 Petición a AniList${retryCount > 0 ? ` (reintento ${retryCount}/${MAX_RETRIES})` : ''}`);
        return await request<T>(query, variables);
    } catch (error: any) {
        console.log(`⚠️ Error en petición:`, error?.message || error);
        
        if (isRetryableError(error) && retryCount < MAX_RETRIES) {
            const delay = RETRY_DELAY * Math.pow(2, retryCount);
            console.log(`🔄 Reintentando en ${delay}ms... (${retryCount + 1}/${MAX_RETRIES})`);
            await sleep(delay);
            return requestWithRetry<T>(query, variables, retryCount + 1);
        }
        
        throw error;
    }
}

// ============================================================
// FUNCIONES EXPORTADAS PARA USO DIRECTO (NUEVO)
// ============================================================

// Estas funciones se exportan para que client.ts las use
export async function searchAnilist(search: string, page = 1, perPage = 10) {
    console.log(`🔍 Buscando en AniList: "${search}"`);
    const data = await requestWithRetry<any>(SEARCH_QUERY, { search, page });
    return data.Page;
}

export async function getAnilistAnime(id: number) {
    console.log(`📄 Obteniendo anime ${id} de AniList`);
    const data = await requestWithRetry<any>(ANIME_INFO_QUERY, { id });
    return data.Media;
}

export async function getPopularAnilist(page = 1, perPage = 10) {
    console.log(`📊 Obteniendo populares de AniList`);
    const data = await requestWithRetry<any>(POPULAR_QUERY, { page });
    return data.Page;
}

export async function getTrendingAnilist(page = 1, perPage = 10) {
    console.log(`🔥 Obteniendo trending de AniList`);
    const data = await requestWithRetry<any>(TRENDING_QUERY, { page });
    return data.Page;
}

// ============================================================
// FUNCIONES DE API (EXISTENTES)
// ============================================================

export const animeApi = {
    async trending(page: number = 1): Promise<{ results: AnimeResult[]; pageInfo: PageInfo }> {
        const cacheKey = `trending:${page}`;
        const cached = cache.get<{ results: AnimeResult[]; pageInfo: PageInfo }>(cacheKey);
        if (cached) {
            console.log('✅ Trending from cache');
            return cached;
        }

        try {
            console.log('🔄 Fetching trending...');
            const data = await requestWithRetry<any>(TRENDING_QUERY, { page });
            
            if (!data?.Page?.media) {
                throw new Error('No se recibieron datos de trending');
            }
            
            const results = data.Page.media.map(mapToAnimeResult);
            const result = {
                results,
                pageInfo: data.Page.pageInfo,
            };

            cache.set(cacheKey, result, 5 * 60 * 1000);
            return result;
        } catch (error) {
            console.error('❌ Trending error:', error);
            const fallback = await getFallbackTrending();
            if (fallback.results.length > 0) {
                console.log('📦 Usando fallback de trending');
                return fallback;
            }
            throw error;
        }
    },

    async popular(page: number = 1): Promise<{ results: AnimeResult[]; pageInfo: PageInfo }> {
        const cacheKey = `popular:${page}`;
        const cached = cache.get<{ results: AnimeResult[]; pageInfo: PageInfo }>(cacheKey);
        if (cached) return cached;

        try {
            console.log('🔄 Fetching popular...');
            const data = await requestWithRetry<any>(POPULAR_QUERY, { page });
            
            if (!data?.Page?.media) {
                throw new Error('No se recibieron datos de popular');
            }
            
            const results = data.Page.media.map(mapToAnimeResult);
            const result = {
                results,
                pageInfo: data.Page.pageInfo,
            };

            cache.set(cacheKey, result, 5 * 60 * 1000);
            return result;
        } catch (error) {
            console.error('❌ Popular error:', error);
            const fallback = await getFallbackPopular();
            if (fallback.results.length > 0) {
                console.log('📦 Usando fallback de popular');
                return fallback;
            }
            throw error;
        }
    },

    async search(query: string, page: number = 1): Promise<{ results: AnimeResult[]; pageInfo: PageInfo }> {
        if (!query || query.trim().length < 2) {
            return { results: [], pageInfo: { total: 0, currentPage: 1, lastPage: 1, hasNextPage: false } };
        }

        const cacheKey = `search:${query}:${page}`;
        const cached = cache.get<{ results: AnimeResult[]; pageInfo: PageInfo }>(cacheKey);
        if (cached) return cached;

        try {
            console.log(`🔍 Buscando: "${query}"`);
            const data = await requestWithRetry<any>(SEARCH_QUERY, { page, search: query });
            
            if (!data?.Page?.media) {
                return { results: [], pageInfo: { total: 0, currentPage: 1, lastPage: 1, hasNextPage: false } };
            }
            
            const results = data.Page.media.map(mapToAnimeResult);
            const result = {
                results,
                pageInfo: data.Page.pageInfo,
            };

            cache.set(cacheKey, result, 2 * 60 * 1000);
            return result;
        } catch (error) {
            console.error('❌ Search error:', error);
            const fallback = await getFallbackSearch(query);
            if (fallback.results.length > 0) {
                console.log('📦 Usando fallback de búsqueda local');
                return fallback;
            }
            return { results: [], pageInfo: { total: 0, currentPage: 1, lastPage: 1, hasNextPage: false } };
        }
    },

    async info(id: number): Promise<AnimeInfo> {
        if (!id || id <= 0) {
            throw new Error('ID de anime inválido');
        }

        const cacheKey = `info:${id}`;
        const cached = cache.get<AnimeInfo>(cacheKey);
        if (cached) return cached;

        try {
            console.log(`📄 Obteniendo info del anime ${id}`);
            const data = await requestWithRetry<any>(ANIME_INFO_QUERY, { id });
            
            if (!data?.Media) {
                throw new Error(`No se encontró el anime con ID ${id}`);
            }
            
            const result = mapToAnimeInfo(data.Media);

            cache.set(cacheKey, result, 30 * 60 * 1000);
            return result;
        } catch (error) {
            console.error(`❌ Info error para ID ${id}:`, error);
            const fallback = await getFallbackInfo(id);
            if (fallback) {
                console.log(`📦 Usando fallback para anime ${id}`);
                return fallback;
            }
            throw error;
        }
    },

    async season(season: string, year: number, page: number = 1): Promise<{ results: AnimeResult[]; pageInfo: PageInfo }> {
        const cacheKey = `season:${season}:${year}:${page}`;
        const cached = cache.get<{ results: AnimeResult[]; pageInfo: PageInfo }>(cacheKey);
        if (cached) return cached;

        try {
            console.log(`📅 Fetching season: ${season} ${year}`);
            const data = await requestWithRetry<any>(SEASON_QUERY, { page, season, seasonYear: year });
            
            if (!data?.Page?.media) {
                return { results: [], pageInfo: { total: 0, currentPage: 1, lastPage: 1, hasNextPage: false } };
            }
            
            const results = data.Page.media.map(mapToAnimeResult);
            const result = {
                results,
                pageInfo: data.Page.pageInfo,
            };

            cache.set(cacheKey, result, 60 * 60 * 1000);
            return result;
        } catch (error) {
            console.error('❌ Season error:', error);
            return { results: [], pageInfo: { total: 0, currentPage: 1, lastPage: 1, hasNextPage: false } };
        }
    },

    async genre(genre: string, page: number = 1): Promise<{ results: AnimeResult[]; pageInfo: PageInfo }> {
        const cacheKey = `genre:${genre}:${page}`;
        const cached = cache.get<{ results: AnimeResult[]; pageInfo: PageInfo }>(cacheKey);
        if (cached) return cached;

        try {
            console.log(`🎭 Fetching genre: ${genre}`);
            const data = await requestWithRetry<any>(GENRE_QUERY, { page, genre });
            
            if (!data?.Page?.media) {
                return { results: [], pageInfo: { total: 0, currentPage: 1, lastPage: 1, hasNextPage: false } };
            }
            
            const results = data.Page.media.map(mapToAnimeResult);
            const result = {
                results,
                pageInfo: data.Page.pageInfo,
            };

            cache.set(cacheKey, result, 30 * 60 * 1000);
            return result;
        } catch (error) {
            console.error('❌ Genre error:', error);
            return { results: [], pageInfo: { total: 0, currentPage: 1, lastPage: 1, hasNextPage: false } };
        }
    }
};

// ============================================================
// FUNCIONES DE FALLBACK (Datos locales)
// ============================================================

async function getFallbackTrending(): Promise<{ results: AnimeResult[]; pageInfo: PageInfo }> {
    try {
        const { getAllLocalAnime } = await import('./local-data');
        const all = getAllLocalAnime();
        if (all && all.length > 0) {
            return {
                results: all.slice(0, 10).map((item: any) => ({
                    id: item.id,
                    title: item.title || item.displayTitle || 'Sin título',
                    coverImage: item.coverImage || { large: '', medium: '' },
                    episodes: item.episodes || 0,
                    genres: item.genres || [],
                    averageScore: item.averageScore || 0,
                    status: item.status || 'UNKNOWN',
                    seasonYear: item.seasonYear || 0,
                    format: item.format || 'TV',
                })),
                pageInfo: { total: all.length, currentPage: 1, lastPage: 1, hasNextPage: false }
            };
        }
    } catch (_) {}
    
    return { results: [], pageInfo: { total: 0, currentPage: 1, lastPage: 1, hasNextPage: false } };
}

async function getFallbackPopular(): Promise<{ results: AnimeResult[]; pageInfo: PageInfo }> {
    return getFallbackTrending();
}

async function getFallbackSearch(query: string): Promise<{ results: AnimeResult[]; pageInfo: PageInfo }> {
    try {
        const { getAllLocalAnime } = await import('./local-data');
        const all = getAllLocalAnime();
        const filtered = all.filter((item: any) => {
            const title = (item.title || item.displayTitle || '').toLowerCase();
            return title.includes(query.toLowerCase());
        });
        
        if (filtered.length > 0) {
            return {
                results: filtered.slice(0, 10).map((item: any) => ({
                    id: item.id,
                    title: item.title || item.displayTitle || 'Sin título',
                    coverImage: item.coverImage || { large: '', medium: '' },
                    episodes: item.episodes || 0,
                    genres: item.genres || [],
                    averageScore: item.averageScore || 0,
                    status: item.status || 'UNKNOWN',
                    seasonYear: item.seasonYear || 0,
                    format: item.format || 'TV',
                })),
                pageInfo: { total: filtered.length, currentPage: 1, lastPage: 1, hasNextPage: false }
            };
        }
    } catch (_) {}
    
    return { results: [], pageInfo: { total: 0, currentPage: 1, lastPage: 1, hasNextPage: false } };
}

async function getFallbackInfo(id: number): Promise<AnimeInfo | null> {
    try {
        const { getLocalAnimeById } = await import('./local-data');
        const local = getLocalAnimeById(id);
        if (local) {
            return {
                id: local.id,
                title: local.title || local.displayTitle || 'Sin título',
                coverImage: local.coverImage || { large: '', medium: '' },
                bannerImage: local.bannerImage || '',
                episodes: local.episodes || 0,
                genres: local.genres || [],
                averageScore: local.averageScore || 0,
                status: local.status || 'UNKNOWN',
                seasonYear: local.seasonYear || 0,
                format: local.format || 'TV',
                duration: local.duration || 24,
                popularity: local.popularity || 0,
                favourites: local.favourites || 0,
                studios: local.studios || ['Desconocido'],
                description: local.description || 'Sin descripción disponible',
                characters: [],
                relations: [],
                externalLinks: []
            };
        }
    } catch (_) {}
    
    return null;
}