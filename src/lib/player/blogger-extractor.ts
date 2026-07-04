// src/lib/player/blogger-extractor.ts
import { tokenCache } from './token-cache';

// Función para extraer el iframe de Blogger desde VerAnimeOnline (con más patrones)
export function extractBloggerIframe(html: string): string | null {
    console.log('📄 Buscando iframe de Blogger...');
    
    // Patrones más completos para encontrar el iframe
    const patterns = [
        // Patrón exacto que viste
        /<iframe[^>]*class="[^"]*metaframe[^"]*rptss[^"]*"[^>]*src="(https?:\/\/[^"]*blogger\.com\/video\.g\?[^"]+)"[^>]*>/i,
        // Buscar por clase metaframe
        /<iframe[^>]*class="[^"]*metaframe[^"]*"[^>]*src="(https?:\/\/[^"]*blogger\.com\/video\.g\?[^"]+)"[^>]*>/i,
        // Buscar por clase rptss
        /<iframe[^>]*class="[^"]*rptss[^"]*"[^>]*src="(https?:\/\/[^"]*blogger\.com\/video\.g\?[^"]+)"[^>]*>/i,
        // Buscar cualquier iframe de Blogger
        /<iframe[^>]*src="(https?:\/\/[^"]*blogger\.com\/video\.g\?[^"]+)"[^>]*>/i,
        // Buscar solo la URL del video
        /src="(https?:\/\/[^"]*blogger\.com\/video\.g\?[^"]+)"/i,
        /(https?:\/\/[^"]*blogger\.com\/video\.g\?[^"'\s]+)/i,
        // Buscar en scripts (a veces el iframe está en un script)
        /<script[^>]*>.*?(https?:\/\/[^"]*blogger\.com\/video\.g\?[^'"]+).*?<\/script>/i,
    ];
    
    for (const pattern of patterns) {
        const match = html.match(pattern);
        if (match) {
            const iframeUrl = match[1] || match[0];
            console.log('✅ Iframe de Blogger encontrado');
            return iframeUrl;
        }
    }
    
    // Si no se encuentra con los patrones, buscar cualquier iframe que contenga "blogger"
    const anyIframe = html.match(/<iframe[^>]*src="([^"]*blogger[^"]*)"[^>]*>/i);
    if (anyIframe) {
        console.log('✅ Iframe con Blogger encontrado (patrón alternativo)');
        return anyIframe[1];
    }
    
    console.log('❌ No se encontró iframe de Blogger');
    return null;
}

// Función para obtener el video de Blogger usando proxies
export async function getBloggerVideoUrl(animeTitle: string, episodeNumber: number): Promise<string | null> {
    // Verificar caché primero
    const cachedToken = tokenCache.get(animeTitle, episodeNumber);
    if (cachedToken) {
        console.log(`⚡ Usando token en caché para: ${animeTitle} - Episodio ${episodeNumber}`);
        return cachedToken;
    }

    console.log(`🔍 Buscando video de Blogger para: ${animeTitle} - Episodio ${episodeNumber}`);

    try {
        const cleanTitle = animeTitle
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
        
        const episodeUrl = `https://veranimeonline.co/episodio/${cleanTitle}-episodio-${episodeNumber}/`;
        console.log(`🔗 URL del episodio: ${episodeUrl}`);
        
        // Probar múltiples proxies
        const proxyUrls = [
            `https://corsproxy.io/?${encodeURIComponent(episodeUrl)}`,
            `https://api.allorigins.win/raw?url=${encodeURIComponent(episodeUrl)}`,
        ];
        
        for (const proxyUrl of proxyUrls) {
            try {
                console.log(`🔄 Intentando con proxy...`);
                const response = await fetch(proxyUrl, {
                    signal: AbortSignal.timeout(8000)
                });
                if (response.ok) {
                    const html = await response.text();
                    console.log(`📄 HTML recibido, longitud: ${html.length}`);
                    
                    // Guardar una muestra del HTML para depuración
                    if (html.length > 0) {
                        console.log(`📄 Muestra del HTML: ${html.substring(0, 200)}...`);
                    }
                    
                    const iframeUrl = extractBloggerIframe(html);
                    if (iframeUrl) {
                        // Guardar en caché
                        tokenCache.set(animeTitle, episodeNumber, iframeUrl);
                        console.log(`✅ Blogger video encontrado y guardado en caché`);
                        return iframeUrl;
                    }
                } else {
                    console.log(`⚠️ Proxy respondió con status: ${response.status}`);
                }
            } catch (proxyError) {
                console.log(`⚠️ Proxy falló:`, proxyError.message);
            }
        }
        
        console.log('❌ No se encontró video de Blogger para este anime');
        return null;
    } catch (error) {
        console.error('❌ Error obteniendo video de Blogger:', error);
        return null;
    }
}

// Función para obtener el video usando un iframe manual
export function getBloggerVideoFromIframe(iframeHtml: string): string | null {
    const match = iframeHtml.match(/src="(https?:\/\/[^"]*blogger\.com\/video\.g\?[^"]+)"/i);
    return match ? match[1] : null;
}