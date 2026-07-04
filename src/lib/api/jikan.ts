// src/lib/api/jikan.ts
import { createServerFn } from '@tanstack/start';

export const getEpisodes = createServerFn({
    method: 'GET',
    handler: async ({ request }: { request: Request }) => {
        const url = new URL(request.url);
        const animeId = url.searchParams.get('animeId');
        const page = url.searchParams.get('page') || '1';

        console.log('📡 API Jikan request:', { animeId, page });

        if (!animeId) {
            return {
                success: false,
                error: 'animeId es requerido'
            };
        }

        try {
            const response = await fetch(
                `https://api.jikan.moe/v4/anime/${animeId}/episodes?page=${page}&limit=100`
            );
            
            if (!response.ok) {
                throw new Error(`Jikan API error: ${response.status}`);
            }
            
            const data = await response.json();

            return {
                success: true,
                data: data.data || [],
                pagination: data.pagination || {},
                total: data.pagination?.items?.total || 0
            };
        } catch (error) {
            console.error('❌ Error en Jikan API:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Error al obtener episodios'
            };
        }
    }
});