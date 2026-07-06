// src/lib/anilist/client.ts
import { getLocalAnimeById, getLocalAnimeBySlug, getAllLocalAnime } from './local-data';
import { MOCK_ANIME } from './mock-data';
import { browserCacheHelpers } from '@/lib/cache/browser-cache';

// ============================================================
// CONFIGURACIÓN
// ============================================================

const ANILIST_URL = '/api/anilist';
const JIKAN_API = 'https://api.jikan.moe/v4';

// Cache del servidor (se maneja en el servidor)
// El navegador usa browserCacheHelpers

// ============================================================
// FUNCIÓN PRINCIPAL - HÍBRIDA CON CACHÉ
// ============================================================

export async function request<T>(
    query: string,
    variables?: Record<string, unknown>,
): Promise<T> {
    console.log('🔍 Iniciando petición híbrida con caché...');

    // Generar clave de caché basada en la consulta
    const cacheKey = generateCacheKey(query, variables);
    
    // 1. PRIMERO: Verificar caché del navegador
    const cachedData = browserCacheHelpers.anime.get(cacheKey as any);
    if (cachedData) {
        console.log('💾 Datos desde caché del navegador');
        return cachedData as T;
    }

    // 2. SEGUNDO: Intentar con datos locales
    const localData = checkLocalData(query, variables);
    if (localData) {
        console.log('✅ Usando datos locales');
        // Guardar en caché del navegador
        browserCacheHelpers.anime.set(cacheKey as any, localData);
        return localData as T;
    }

    // 3. TERCERO: Intentar con AniList
    try {
        console.log('📡 Intentando con AniList...');
        const data = await fetchFromAniList(query, variables);
        console.log('✅ AniList exitoso');
        // Guardar en caché del navegador
        browserCacheHelpers.anime.set(cacheKey as any, data);
        return data as T;
    } catch (error) {
        console.log('⚠️ AniList falló:', error.message);
    }

    // 4. CUARTO: Intentar con Jikan API
    try {
        console.log('📡 Intentando con Jikan API...');
        const data = await fetchFromJikan(query, variables);
        console.log('✅ Jikan API exitoso');
        // Guardar en caché del navegador
        browserCacheHelpers.anime.set(cacheKey as any, data);
        return data as T;
    } catch (error) {
        console.log('⚠️ Jikan API falló:', error.message);
    }

    // 5. ÚLTIMO RECURSO: Datos Mock
    console.log('📦 Usando datos Mock de respaldo');
    const mockData = getMockData(query, variables);
    // Guardar en caché del navegador
    browserCacheHelpers.anime.set(cacheKey as any, mockData);
    return mockData as T;
}

// ============================================================
// 🔥 FUNCIÓN EXPORTADA PARA BUSCAR ANIMES (NUEVO)
// ============================================================

export async function searchAnime(search: string, page = 1, perPage = 10) {
    const query = `
        query ($search: String, $page: Int, $perPage: Int) {
            Page(page: $page, perPage: $perPage) {
                media(search: $search, type: ANIME, sort: POPULARITY_DESC) {
                    id
                    title {
                        romaji
                        english
                        native
                    }
                    coverImage {
                        large
                        medium
                    }
                    episodes
                    genres
                    averageScore
                    status
                    seasonYear
                    format
                }
                pageInfo {
                    total
                    currentPage
                    lastPage
                    hasNextPage
                }
            }
        }
    `;
    const data = await request<{ Page: any }>(query, { search, page, perPage });
    return data.Page;
}

// ============================================================
// FUNCIONES INTERNAS
// ============================================================

// Generar clave de caché
function generateCacheKey(query: string, variables?: Record<string, unknown>): string {
    const key = `${query}-${JSON.stringify(variables || {})}`;
    // Hash simple para claves largas
    return key.length > 100 ? hashString(key) : key;
}

// Hash simple para claves largas
function hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convertir a 32bit integer
    }
    return `hash-${Math.abs(hash)}`;
}

// ============================================================
// FUNCIONES DE DATOS LOCALES
// ============================================================

function checkLocalData(query: string, variables?: Record<string, unknown>): any | null {
    if (query.includes('Media(id:') && variables?.id) {
        const id = Number(variables.id);
        const local = getLocalAnimeById(id);
        if (local) {
            return { Media: local };
        }
    }

    if (query.includes('search') && variables?.search) {
        const searchTerm = String(variables.search).toLowerCase();
        const allLocal = getAllLocalAnime();
        const filtered = allLocal.filter((anime: any) => 
            anime.title.toLowerCase().includes(searchTerm) ||
            anime.displayTitle?.toLowerCase().includes(searchTerm)
        );
        if (filtered.length > 0) {
            return { 
                Page: { 
                    media: filtered, 
                    pageInfo: { total: filtered.length, currentPage: 1, lastPage: 1 } 
                } 
            };
        }
    }

    if (query.includes('trending') || query.includes('POPULARITY_DESC')) {
        const allLocal = getAllLocalAnime();
        if (allLocal.length >= 3) {
            return { 
                Page: { 
                    media: allLocal.slice(0, 6), 
                    pageInfo: { total: allLocal.length, currentPage: 1, lastPage: 1 } 
                } 
            };
        }
    }

    return null;
}

// ============================================================
// FUNCIONES DE ANILIST, JIKAN Y MOCK
// ============================================================

async function fetchFromAniList(query: string, variables?: Record<string, unknown>): Promise<any> {
    const response = await fetch(ANILIST_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
        throw new Error(`AniList HTTP ${response.status}`);
    }

    const json = await response.json();

    if (json.errors) {
        throw new Error(json.errors[0]?.message || 'AniList error');
    }

    return json.data;
}

async function fetchFromJikan(query: string, variables?: Record<string, unknown>): Promise<any> {
    let url = '';
    let data = null;

    if (query.includes('trending')) {
        url = `${JIKAN_API}/top/anime?filter=airing&limit=10`;
        const response = await fetch(url);
        const result = await response.json();
        data = transformJikanData(result);
    } 
    else if (query.includes('POPULARITY_DESC')) {
        url = `${JIKAN_API}/top/anime?filter=bypopularity&limit=10`;
        const response = await fetch(url);
        const result = await response.json();
        data = transformJikanData(result);
    }
    else if (query.includes('search') && variables?.search) {
        url = `${JIKAN_API}/anime?q=${encodeURIComponent(String(variables.search))}&limit=10`;
        const response = await fetch(url);
        const result = await response.json();
        data = transformJikanData(result);
    }
    else if (query.includes('Media(id:') && variables?.id) {
        url = `${JIKAN_API}/anime/${variables.id}`;
        const response = await fetch(url);
        const result = await response.json();
        if (result.data) {
            data = { Media: transformSingleJikanData(result.data) };
        }
    }
    else {
        throw new Error('Tipo de consulta no soportada en Jikan');
    }

    if (!data) {
        throw new Error('No se obtuvieron datos de Jikan');
    }

    return data;
}

function transformJikanData(data: any): any {
    if (!data.data || data.data.length === 0) {
        return { Page: { media: [], pageInfo: { total: 0, currentPage: 1, lastPage: 1 } } };
    }

    const media = data.data.map((item: any) => transformSingleJikanData(item));
    
    return {
        Page: {
            media: media,
            pageInfo: {
                total: media.length,
                currentPage: 1,
                lastPage: 1
            }
        }
    };
}

function transformSingleJikanData(item: any): any {
    return {
        id: item.mal_id || item.id || 0,
        title: {
            romaji: item.title || 'Sin título',
            english: item.title_english || item.title || 'Sin título',
            native: item.title_japanese || item.title || 'Sin título'
        },
        coverImage: {
            large: item.images?.jpg?.large_image_url || item.images?.jpg?.image_url || '',
            medium: item.images?.jpg?.image_url || ''
        },
        bannerImage: item.images?.jpg?.large_image_url || '',
        episodes: item.episodes || 0,
        genres: item.genres?.map((g: any) => g.name) || [],
        averageScore: Math.round((item.score || 0) * 10) || 0,
        status: item.status?.toUpperCase() || 'UNKNOWN',
        seasonYear: item.year || 0,
        format: item.type || 'TV',
        duration: item.duration || 24,
        popularity: item.popularity || 0,
        favourites: item.favorites || 0,
        studios: item.studios?.map((s: any) => s.name) || ['Desconocido'],
        description: item.synopsis || 'Sin descripción disponible',
        externalLinks: [],
        seasons: [{ key: 'all-episodes', episodeCount: item.episodes || 0 }],
        hasSeasons: false,
        titleForNames: item.title || 'Sin título',
        malId: item.mal_id || item.id || 0,
        totalEpisodes: item.episodes || 0,
        displayTitle: item.title_english || item.title || 'Sin título'
    };
}

function getMockData(query: string, variables?: Record<string, unknown>): any {
    console.log('📦 Sirviendo datos de respaldo (Mock)...');
    
    if (query.includes('trending')) {
        return { Page: { media: MOCK_ANIME.trending, pageInfo: { total: 5, currentPage: 1, lastPage: 1 } } };
    }
    
    if (query.includes('POPULARITY_DESC')) {
        return { Page: { media: MOCK_ANIME.popular, pageInfo: { total: 3, currentPage: 1, lastPage: 1 } } };
    }
    
    if (query.includes('search') && variables?.search) {
        const allAnime = [...MOCK_ANIME.trending, ...MOCK_ANIME.popular];
        const searchTerm = String(variables.search).toLowerCase();
        const filtered = allAnime.filter((a: any) => 
            a.title.english?.toLowerCase().includes(searchTerm) ||
            a.title.romaji?.toLowerCase().includes(searchTerm)
        );
        return { Page: { media: filtered, pageInfo: { total: filtered.length, currentPage: 1, lastPage: 1 } } };
    }
    
    if (query.includes('Media(id:') && variables?.id) {
        const allAnime = [...MOCK_ANIME.trending, ...MOCK_ANIME.popular];
        const anime = allAnime.find((a: any) => a.id === variables.id);
        return { Media: anime || allAnime[0] };
    }
    
    return { Page: { media: MOCK_ANIME.trending, pageInfo: { total: 5, currentPage: 1, lastPage: 1 } } };
}