// src/routes/api/index.ts
import { createServerFn } from '@tanstack/start';
import axios from 'axios';

export const GET = createServerFn({
    method: 'GET',
    handler: async ({ request }: { request: Request }) => {
        const url = new URL(request.url);
        const targetUrl = url.searchParams.get('url');
        const isProxy = url.searchParams.get('proxy');
        
        console.log('📡 API endpoint llamado (api/index)');
        console.log('🔗 URL objetivo:', targetUrl);
        console.log('🔧 Modo proxy:', isProxy);
        
        // ============================================================
        // 🔥 MODO PROXY - Para scraping
        // ============================================================
        if (isProxy === 'true' && targetUrl) {
            console.log('🔄 Modo proxy activado para:', targetUrl);
            
            try {
                // Intentar con axios primero
                const response = await axios.get(targetUrl, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                        'Accept-Language': 'es-ES,es;q=0.8,en-US;q=0.5,en;q=0.3',
                        'Referer': 'https://veranimeonline.co/',
                        'Origin': 'https://veranimeonline.co/',
                        'Cache-Control': 'no-cache',
                        'Pragma': 'no-cache',
                    },
                    timeout: 15000,
                    maxRedirects: 5,
                });
                
                console.log(`✅ Proxy exitoso: ${response.status}, ${response.data.length} bytes`);
                
                return new Response(response.data, {
                    status: response.status,
                    headers: {
                        'Content-Type': 'text/html; charset=utf-8',
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                        'Access-Control-Allow-Headers': 'Content-Type',
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                    }
                });
            } catch (error: any) {
                console.error('❌ Error en proxy:', error.message);
                
                // Fallback con fetch nativo
                try {
                    console.log('🔄 Fallback con fetch nativo...');
                    const fetchResponse = await fetch(targetUrl, {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                            'Referer': 'https://veranimeonline.co/',
                        }
                    });
                    
                    const html = await fetchResponse.text();
                    console.log(`✅ Fallback exitoso: ${fetchResponse.status}, ${html.length} bytes`);
                    
                    return new Response(html, {
                        status: fetchResponse.status,
                        headers: {
                            'Content-Type': 'text/html; charset=utf-8',
                            'Access-Control-Allow-Origin': '*',
                            'Cache-Control': 'no-cache, no-store, must-revalidate',
                        }
                    });
                } catch (fallbackError: any) {
                    console.error('❌ Fallback falló:', fallbackError.message);
                }
                
                return new Response(
                    JSON.stringify({ 
                        error: error.message || 'Error al obtener la URL',
                        url: targetUrl
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
        // 🎯 MODO NORMAL - Para AniList u otras APIs
        // ============================================================
        if (!targetUrl) {
            return new Response(
                JSON.stringify({ error: 'URL requerida' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }
        
        try {
            console.log(`🔄 Fetch normal: ${targetUrl}`);
            
            const response = await fetch(targetUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Referer': 'https://veranimeonline.co/',
                },
            });
            
            const html = await response.text();
            console.log(`📡 Respuesta: ${response.status}, ${html.length} bytes`);
            
            return new Response(html, {
                headers: {
                    'Content-Type': 'text/html',
                    'Access-Control-Allow-Origin': '*',
                }
            });
        } catch (error: any) {
            console.error('❌ Error:', error.message);
            return new Response(
                JSON.stringify({ error: error.message }),
                { 
                    status: 500, 
                    headers: { 'Content-Type': 'application/json' } 
                }
            );
        }
    }
});