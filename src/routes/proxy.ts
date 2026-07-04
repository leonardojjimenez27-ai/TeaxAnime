// src/routes/proxy.ts
import { createServerFn } from '@tanstack/start';

export const GET = createServerFn({
    method: 'GET',
    handler: async ({ request }: { request: Request }) => {
        const url = new URL(request.url);
        const targetUrl = url.searchParams.get('url');
        
        if (!targetUrl) {
            return new Response(
                JSON.stringify({ error: 'URL requerida' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }
        
        try {
            console.log(`🔄 Proxy solicitando: ${targetUrl}`);
            
            const response = await fetch(targetUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'es-ES,es;q=0.8,en-US;q=0.5,en;q=0.3',
                    'Referer': 'https://veranimeonline.co/',
                },
            });
            
            const html = await response.text();
            
            return new Response(html, {
                headers: {
                    'Content-Type': 'text/html',
                    'Access-Control-Allow-Origin': '*',
                }
            });
        } catch (error) {
            console.error('❌ Error en proxy:', error);
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