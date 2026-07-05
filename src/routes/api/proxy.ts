// src/routes/api/proxy.ts
import { createServerFn } from '@tanstack/start';
import axios from 'axios';

export const GET = createServerFn({
    method: 'GET',
    handler: async ({ request }: { request: Request }) => {
        const url = new URL(request.url);
        const targetUrl = url.searchParams.get('url');
        
        console.log('🔍 Proxy - URL solicitada:', targetUrl);
        
        if (!targetUrl) {
            return new Response(
                JSON.stringify({ error: 'URL requerida' }),
                { 
                    status: 400, 
                    headers: { 
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    } 
                }
            );
        }
        
        try {
            console.log(`🔄 Proxy solicitando: ${targetUrl}`);
            
            // ============================================================
            // DETECTAR EL DOMINIO PARA AJUSTAR HEADERS
            // ============================================================
            let referer = 'https://veranimeonline.co/';
            let origin = 'https://veranimeonline.co/';
            
            if (targetUrl.includes('jkanime.net')) {
                referer = 'https://jkanime.net/';
                origin = 'https://jkanime.net/';
            } else if (targetUrl.includes('veranimeonline.co')) {
                referer = 'https://veranimeonline.co/';
                origin = 'https://veranimeonline.co/';
            } else if (targetUrl.includes('blogger.com')) {
                referer = 'https://www.blogger.com/';
                origin = 'https://www.blogger.com/';
            }
            
            console.log(`📌 Referer usado: ${referer}`);
            console.log(`📌 Origin usado: ${origin}`);
            
            // ============================================================
            // HEADERS ESPECÍFICOS PARA VERANIMEONLINE
            // ============================================================
            const headers: Record<string, string> = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'es-ES,es;q=0.8,en-US;q=0.5,en;q=0.3',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
                'Upgrade-Insecure-Requests': '1',
                'Referer': referer,
                'Origin': origin,
                'DNT': '1',
            };
            
            // Headers adicionales para VerAnimeOnline
            if (targetUrl.includes('veranimeonline.co')) {
                headers['Sec-Fetch-Dest'] = 'document';
                headers['Sec-Fetch-Mode'] = 'navigate';
                headers['Sec-Fetch-Site'] = 'same-origin';
                headers['Sec-Fetch-User'] = '?1';
            }
            
            // Headers adicionales para JKanime
            if (targetUrl.includes('jkanime.net')) {
                headers['Sec-Fetch-Dest'] = 'document';
                headers['Sec-Fetch-Mode'] = 'navigate';
                headers['Sec-Fetch-Site'] = 'none';
                headers['Sec-Fetch-User'] = '?1';
            }
            
            // ============================================================
            // INTENTAR CON AXIOS (CON REDIRECCIONES)
            // ============================================================
            let response;
            try {
                response = await axios.get(targetUrl, {
                    headers: headers,
                    timeout: 15000,
                    maxRedirects: 5,
                    validateStatus: (status) => status < 500,
                });
                console.log(`✅ Proxy exitoso (axios): ${response.status}, ${response.data.length} bytes`);
            } catch (axiosError: any) {
                console.log(`⚠️ Error en axios: ${axiosError.message}`);
                
                // ============================================================
                // FALLBACK: USAR FETCH NATIVO
                // ============================================================
                console.log('🔄 Intentando con fetch nativo...');
                const fetchResponse = await fetch(targetUrl, {
                    headers: headers,
                });
                
                const html = await fetchResponse.text();
                console.log(`✅ Proxy exitoso (fetch): ${fetchResponse.status}, ${html.length} bytes`);
                
                return new Response(html, {
                    status: fetchResponse.status,
                    headers: {
                        'Content-Type': 'text/html; charset=utf-8',
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                        'Access-Control-Allow-Headers': 'Content-Type',
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                    }
                });
            }
            
            // Si la respuesta es exitosa, devolver el HTML
            if (response.status === 200) {
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
            }
            
            // Si la respuesta es 403 o 404, intentar con otro User-Agent
            if (response.status === 403 || response.status === 404) {
                console.log(`⚠️ Código ${response.status}, intentando con User-Agent alternativo...`);
                
                const altHeaders = { ...headers };
                altHeaders['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 Edg/119.0.0.0';
                
                const altResponse = await axios.get(targetUrl, {
                    headers: altHeaders,
                    timeout: 15000,
                    maxRedirects: 5,
                    validateStatus: (status) => status < 500,
                });
                
                console.log(`✅ Proxy exitoso (alternativo): ${altResponse.status}, ${altResponse.data.length} bytes`);
                
                return new Response(altResponse.data, {
                    status: altResponse.status,
                    headers: {
                        'Content-Type': 'text/html; charset=utf-8',
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                        'Access-Control-Allow-Headers': 'Content-Type',
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                    }
                });
            }
            
            // Cualquier otro código de estado
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
            
            // ============================================================
            // ÚLTIMO FALLBACK: USAR FETCH SIN HEADERS
            // ============================================================
            try {
                console.log('🔄 Intentando con fetch sin headers (último intento)...');
                const fallbackResponse = await fetch(targetUrl);
                const html = await fallbackResponse.text();
                
                if (fallbackResponse.ok) {
                    console.log(`✅ Proxy exitoso (fallback): ${fallbackResponse.status}, ${html.length} bytes`);
                    return new Response(html, {
                        status: fallbackResponse.status,
                        headers: {
                            'Content-Type': 'text/html; charset=utf-8',
                            'Access-Control-Allow-Origin': '*',
                            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                            'Access-Control-Allow-Headers': 'Content-Type',
                            'Cache-Control': 'no-cache, no-store, must-revalidate',
                        }
                    });
                }
            } catch (fallbackError) {
                console.error('❌ Fallback también falló:', fallbackError);
            }
            
            return new Response(
                JSON.stringify({ 
                    error: error.message || 'Error al obtener la URL',
                    details: error.response?.status || 'Unknown',
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
});

export const OPTIONS = createServerFn({
    method: 'OPTIONS',
    handler: async () => {
        return new Response(null, {
            status: 204,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Max-Age': '86400',
            }
        });
    }
});