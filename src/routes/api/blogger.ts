// src/routes/api/blogger.ts
import { createServerFn } from '@tanstack/start';
import axios from 'axios';

export const GET = createServerFn({
    method: 'GET',
    handler: async ({ request }: { request: Request }) => {
        const url = new URL(request.url);
        const animeTitle = url.searchParams.get('anime');
        const episode = url.searchParams.get('episode');

        if (!animeTitle || !episode) {
            return new Response(
                JSON.stringify({ error: 'Faltan parámetros' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        try {
            const cleanTitle = animeTitle.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
            
            // Intentar obtener el video de JKanime
            const response = await axios.get(
                `https://jkanime.net/ver/${cleanTitle}/${episode}/`,
                {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    },
                    timeout: 10000
                }
            );
            
            const html = response.data;
            
            // Buscar el iframe de Blogger
            const bloggerMatch = html.match(/src="(https?:\/\/www\.blogger\.com\/video\.g\?[^"]+)"/);
            if (bloggerMatch) {
                return new Response(
                    JSON.stringify({
                        success: true,
                        videoUrl: bloggerMatch[1],
                        source: 'JKanime'
                    }),
                    { headers: { 'Content-Type': 'application/json' } }
                );
            }
            
            // Buscar en los scripts
            const scriptMatch = html.match(/blogger\.com\/video\.g\?[^"']+/);
            if (scriptMatch) {
                return new Response(
                    JSON.stringify({
                        success: true,
                        videoUrl: scriptMatch[0],
                        source: 'JKanime'
                    }),
                    { headers: { 'Content-Type': 'application/json' } }
                );
            }

            return new Response(
                JSON.stringify({ 
                    success: false, 
                    error: 'No se encontró el video' 
                }),
                { status: 404, headers: { 'Content-Type': 'application/json' } }
            );

        } catch (error) {
            console.error('Error scrapeando:', error);
            return new Response(
                JSON.stringify({ 
                    success: false, 
                    error: 'Error al obtener el video' 
                }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
        }
    }
});