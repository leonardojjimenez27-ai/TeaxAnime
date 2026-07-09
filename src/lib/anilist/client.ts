// src/lib/anilist/client.ts
import { 
    searchAnilist, 
    getAnilistAnime,
    getPopularAnilist,
    getTrendingAnilist 
} from './api';
import { getLocalAnimeById, getAllLocalAnime } from './local-data';
import { MOCK_ANIME } from './mock-data';
import { browserCacheHelpers } from '@/lib/cache/browser-cache';

// ============================================================
// CONFIGURACIÓN
// ============================================================

// ============================================================
// FUNCIÓN PRINCIPAL - HÍBRIDA CON CACHÉ
// ============================================================

export async function request<T>(
    query: string,
    variables?: Record<string, unknown>,
): Promise<T> {
    console.log('🔍 Iniciando petición híbrida con caché...');

    const cacheKey = generateCacheKey(query, variables);
    
    // 1. Verificar caché del navegador
    const cachedData = browserCacheHelpers.anime.get(cacheKey as any);
    if (cachedData) {
        console.log('💾 Datos desde caché del navegador');
        return cachedData as T;
    }

    // 2. Intentar con datos locales
    const localData = checkLocalData(query, variables);
    if (localData) {
        console.log('✅ Usando datos locales');
        browserCacheHelpers.anime.set(cacheKey as any, localData);
        return localData as T;
    }

    // 3. Intentar con AniList vía proxy
    try {
        console.log('📡 Intentando con AniList vía proxy...');
        const data = await proxyRequest(query, variables);
        console.log('✅ AniList exitoso');
        browserCacheHelpers.anime.set(cacheKey as any, data);
        return data as T;
    } catch (error: any) {
        console.log('⚠️ AniList falló:', error.message);
    }

    // 4. ÚLTIMO RECURSO: Datos Mock
    console.log('📦 Usando datos Mock de respaldo');
    const mockData = getMockData(query, variables);
    browserCacheHelpers.anime.set(cacheKey as any, mockData);
    return mockData as T;
}

// ============================================================
// PROXY REQUEST (CON REINTENTOS)
// ============================================================

async function proxyRequest(query: string, variables?: Record<string, unknown>, retryCount = 0): Promise<any> {
    const MAX_RETRIES = 2;
    const RETRY_DELAY = 1000;
    
    try {
        const response = await fetch('/api/anilist', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({ query, variables }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const json = await response.json();
        
        if (json.errors) {
            throw new Error(json.errors[0]?.message || 'GraphQL Error');
        }

        return json.data;

    } catch (error: any) {
        if (isRetryableError(error) && retryCount < MAX_RETRIES) {
            console.log(`🔄 Reintentando proxy... (${retryCount + 1}/${MAX_RETRIES})`);
            await sleep(RETRY_DELAY * (retryCount + 1));
            return proxyRequest(query, variables, retryCount + 1);
        }
        throw error;
    }
}

// ============================================================
// FUNCIÓN PARA BUSCAR ANIMES (EXPORTADA)
// ============================================================

export async function searchAnime(search: string, page = 1, perPage = 10) {
    try {
        // Usar el proxy directamente para búsquedas
        const data = await searchAnilist(search, page, perPage);
        return data;
    } catch (error) {
        console.error('❌ Error en searchAnime:', error);
        
        // Fallback a datos locales o mock
        const fallback = getMockSearchResults(search);
        return { media: fallback, pageInfo: { total: fallback.length, currentPage: 1, lastPage: 1 } };
    }
}

// ============================================================
// FUNCIONES INTERNAS
// ============================================================

function generateCacheKey(query: string, variables?: Record<string, unknown>): string {
    const key = `${query}-${JSON.stringify(variables || {})}`;
    return key.length > 100 ? hashString(key) : key;
}

function hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return `hash-${Math.abs(hash)}`;
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function isRetryableError(error: any): boolean {
    const message = error.message?.toLowerCase() || '';
    const code = error.code || '';
    
    return (
        message.includes('econnreset') ||
        message.includes('etimedout') ||
        message.includes('fetch failed') ||
        message.includes('timeout') ||
        message.includes('network') ||
        message.includes('econnrefused') ||
        code === 'ECONNRESET' ||
        code === 'ETIMEDOUT' ||
        code === 'ECONNREFUSED' ||
        error.name === 'AbortError'
    );
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

function getMockSearchResults(search: string): any[] {
    const allAnime = [...MOCK_ANIME.trending, ...MOCK_ANIME.popular];
    const searchTerm = search.toLowerCase();
    return allAnime.filter((a: any) => 
        a.title.english?.toLowerCase().includes(searchTerm) ||
        a.title.romaji?.toLowerCase().includes(searchTerm)
    ).slice(0, 10);
}