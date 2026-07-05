// src/routes/api/blogger.ts
import { createServerFn } from '@tanstack/start';
import axios from 'axios';

export const GET = createServerFn({
    method: 'GET',
    handler: async ({ request }: { request: Request }) => {
        const url = new URL(request.url);
        const animeTitle = url.searchParams.get('anime');
        const episode = url.searchParams.get('episode');
        const targetUrl = url.searchParams.get('url');

        console.log('🔍 Blogger API - Parámetros:', { animeTitle, episode, targetUrl });

        // ============================================================
        // CASO 1: Obtener HTML de una URL (para la página principal)
        // ============================================================
        if (targetUrl) {
            try {
                console.log(`🔍 Blogger - Obteniendo HTML: ${targetUrl}`);
                
                const response = await axios.get(targetUrl, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                        'Accept-Language': 'es-ES,es;q=0.8,en-US;q=0.5,en;q=0.3',
                        'Accept-Encoding': 'gzip, deflate, br',
                        'Connection': 'keep-alive',
                        'Cache-Control': 'no-cache',
                        'Pragma': 'no-cache',
                        'Upgrade-Insecure-Requests': '1',
                        'Referer': 'https://jkanime.net/',
                    },
                    timeout: 15000
                });
                
                return new Response(
                    JSON.stringify({
                        success: true,
                        html: response.data
                    }),
                    { 
                        headers: { 
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        } 
                    }
                );
                
            } catch (error: any) {
                console.error('❌ Error obteniendo HTML:', error.message);
                return new Response(
                    JSON.stringify({ 
                        success: false, 
                        error: error.message || 'Error al obtener la página' 
                    }),
                    { 
                        status: 500, 
                        headers: { 
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        } 
                    }
                );
            }
        }

        // ============================================================
        // CASO 2: Obtener video de un episodio
        // ============================================================
        if (!animeTitle || !episode) {
            return new Response(
                JSON.stringify({ error: 'Faltan parámetros: anime y episode son requeridos' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        try {
            const cleanTitle = animeTitle.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
            
            console.log(`🔍 Blogger - Buscando episodio ${episode} de ${cleanTitle}`);
            
            const response = await axios.get(
                `https://jkanime.net/ver/${cleanTitle}/${episode}/`,
                {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                        'Referer': 'https://jkanime.net/',
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
                    { 
                        headers: { 
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        } 
                    }
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
                    { 
                        headers: { 
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        } 
                    }
                );
            }

            return new Response(
                JSON.stringify({ 
                    success: false, 
                    error: 'No se encontró el video' 
                }),
                { 
                    status: 404, 
                    headers: { 
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    } 
                }
            );

        } catch (error: any) {
            console.error('❌ Error scrapeando:', error.message);
            return new Response(
                JSON.stringify({ 
                    success: false, 
                    error: error.message || 'Error al obtener el video' 
                }),
                { 
                    status: 500, 
                    headers: { 
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    } 
                }
            );
        }
    }
});