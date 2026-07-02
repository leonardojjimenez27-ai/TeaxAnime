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
            const data = await request<any>(TRENDING_QUERY, { page });
            const results = data.Page.media.map(mapToAnimeResult);
            const result = {
                results,
                pageInfo: data.Page.pageInfo,
            };

            cache.set(cacheKey, result);
            return result;
        } catch (error) {
            console.error('❌ Trending error:', error);
            throw error;
        }
    },

    async popular(page: number = 1): Promise<{ results: AnimeResult[]; pageInfo: PageInfo }> {
        const cacheKey = `popular:${page}`;
        const cached = cache.get<{ results: AnimeResult[]; pageInfo: PageInfo }>(cacheKey);
        if (cached) return cached;

        try {
            console.log('🔄 Fetching popular...');
            const data = await request<any>(POPULAR_QUERY, { page });
            const results = data.Page.media.map(mapToAnimeResult);
            const result = {
                results,
                pageInfo: data.Page.pageInfo,
            };

            cache.set(cacheKey, result);
            return result;
        } catch (error) {
            console.error('❌ Popular error:', error);
            throw error;
        }
    },

    async search(query: string, page: number = 1): Promise<{ results: AnimeResult[]; pageInfo: PageInfo }> {
        const cacheKey = `search:${query}:${page}`;
        const cached = cache.get<{ results: AnimeResult[]; pageInfo: PageInfo }>(cacheKey);
        if (cached) return cached;

        const data = await request<any>(SEARCH_QUERY, { page, search: query });
        const results = data.Page.media.map(mapToAnimeResult);
        const result = {
            results,
            pageInfo: data.Page.pageInfo,
        };

        cache.set(cacheKey, result, 2 * 60 * 1000);
        return result;
    },

    async info(id: number): Promise<AnimeInfo> {
        const cacheKey = `info:${id}`;
        const cached = cache.get<AnimeInfo>(cacheKey);
        if (cached) return cached;

        const data = await request<any>(ANIME_INFO_QUERY, { id });
        const result = mapToAnimeInfo(data.Media);

        cache.set(cacheKey, result, 30 * 60 * 1000);
        return result;
    },

    async season(season: string, year: number, page: number = 1): Promise<{ results: AnimeResult[]; pageInfo: PageInfo }> {
        const cacheKey = `season:${season}:${year}:${page}`;
        const cached = cache.get<{ results: AnimeResult[]; pageInfo: PageInfo }>(cacheKey);
        if (cached) return cached;

        const data = await request<any>(SEASON_QUERY, { page, season, seasonYear: year });
        const results = data.Page.media.map(mapToAnimeResult);
        const result = {
            results,
            pageInfo: data.Page.pageInfo,
        };

        cache.set(cacheKey, result, 60 * 60 * 1000);
        return result;
    },

    async genre(genre: string, page: number = 1): Promise<{ results: AnimeResult[]; pageInfo: PageInfo }> {
        const cacheKey = `genre:${genre}:${page}`;
        const cached = cache.get<{ results: AnimeResult[]; pageInfo: PageInfo }>(cacheKey);
        if (cached) return cached;

        const data = await request<any>(GENRE_QUERY, { page, genre });
        const results = data.Page.media.map(mapToAnimeResult);
        const result = {
            results,
            pageInfo: data.Page.pageInfo,
        };

        cache.set(cacheKey, result, 30 * 60 * 1000);
        return result;
    }
};