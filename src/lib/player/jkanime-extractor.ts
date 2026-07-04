// src/lib/player/jkanime-extractor.ts
import { tokenCache } from './token-cache';

// Función para limpiar el título del anime
function cleanAnimeTitle(title: string): string {
    return title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}

// Función para extraer el iframe del video de JKanime
export function extractJKanimeIframe(html: string): string | null {
    console.log('📄 Buscando iframe de video en JKanime...');
    
    // Patrones para encontrar el iframe del reproductor
    const patterns = [
        // Buscar el iframe con clase player_conte
        /<iframe[^>]*class="[^"]*player_conte[^"]*"[^>]*src="(https?:\/\/[^"]+)"[^>]*>/i,
        // Buscar cualquier iframe que contenga jkplayer
        /<iframe[^>]*src="(https?:\/\/[^"]*jkplayer[^"]+)"[^>]*>/i,
        // Buscar cualquier iframe
        /<iframe[^>]*src="(https?:\/\/[^"]+)"[^>]*>/i,
        // Buscar la URL del reproductor
        /src="(https?:\/\/jkanime\.net\/jkplayer\/um\?[^"]+)"/i,
        /(https?:\/\/jkanime\.net\/jkplayer\/um\?[^"'\s]+)/i,
    ];
    
    for (const pattern of patterns) {
        const match = html.match(pattern);
        if (match) {
            const iframeUrl = match[1] || match[0];
            // Verificar que sea un iframe de JKanime (no un anuncio)
            if (iframeUrl.includes('jkanime.net') || iframeUrl.includes('jkplayer')) {
                console.log('✅ Iframe de JKanime encontrado:', iframeUrl);
                return iframeUrl;
            }
        }
    }
    
    console.log('❌ No se encontró iframe de video en JKanime');
    return null;
}

// Función para extraer el video de Blogger desde JKanime
export function extractBloggerFromJKanime(html: string): string | null {
    console.log('📄 Buscando video de Blogger en JKanime...');
    
    const patterns = [
        /<iframe[^>]*src="(https?:\/\/[^"]*blogger\.com\/video\.g\?[^"]+)"[^>]*>/i,
        /<iframe[^>]*src="(https?:\/\/[^"]*blogger[^"]*video\.g\?[^"]+)"[^>]*>/i,
        /src="(https?:\/\/[^"]*blogger\.com\/video\.g\?[^"]+)"/i,
        /(https?:\/\/[^"]*blogger\.com\/video\.g\?[^"'\s]+)/i,
    ];
    
    for (const pattern of patterns) {
        const match = html.match(pattern);
        if (match) {
            const videoUrl = match[1] || match[0];
            console.log('✅ Video de Blogger encontrado en JKanime:', videoUrl);
            return videoUrl;
        }
    }
    
    return null;
}

// Función para obtener el iframe del video de JKanime
export async function getJKanimeVideoIframe(animeTitle: string, episodeNumber: number): Promise<string | null> {
    try {
        const cleanTitle = cleanAnimeTitle(animeTitle);
        const episodeUrl = `https://jkanime.net/ver/${cleanTitle}/${episodeNumber}/`;
        console.log(`🔍 Buscando video en: ${episodeUrl}`);
        
        // Intentar con diferentes proxies
        const proxyUrls = [
            `https://corsproxy.io/?${encodeURIComponent(episodeUrl)}`,
            `https://api.allorigins.win/raw?url=${encodeURIComponent(episodeUrl)}`,
        ];
        
        for (const proxyUrl of proxyUrls) {
            try {
                console.log(`🔄 Intentando con proxy...`);
                const response = await fetch(proxyUrl, {
                    signal: AbortSignal.timeout(5000) // Timeout de 5 segundos
                });
                if (response.ok) {
                    const html = await response.text();
                    
                    // Buscar el iframe del video
                    const iframeUrl = extractJKanimeIframe(html);
                    if (iframeUrl) {
                        console.log(`✅ Iframe de JKanime encontrado:`, iframeUrl);
                        return iframeUrl;
                    }
                    
                    // Si no hay iframe, buscar video de Blogger
                    const bloggerVideo = extractBloggerFromJKanime(html);
                    if (bloggerVideo) {
                        console.log(`✅ Video de Blogger encontrado en JKanime`);
                        return bloggerVideo;
                    }
                }
            } catch (proxyError) {
                console.log(`⚠️ Proxy falló:`, proxyError.message);
            }
        }
        
        console.log('❌ No se pudo obtener el iframe de JKanime');
        return null;
    } catch (error) {
        console.error('❌ Error obteniendo iframe de JKanime:', error);
        return null;
    }
}

// Función para obtener servidores de JKanime
export async function getJKanimeServers(animeTitle: string, episodeNumber: number): Promise<{ name: string; url: string; active: boolean; type: 'iframe' }[]> {
    const servers: { name: string; url: string; active: boolean; type: 'iframe' }[] = [];
    
    console.log(`🔍 Buscando servidores de JKanime para: ${animeTitle} - Episodio ${episodeNumber}`);
    
    const cleanTitle = cleanAnimeTitle(animeTitle);
    
    // Servidor 1: JKanime (iframe extraído automáticamente - solo el video)
    try {
        const videoIframe = await getJKanimeVideoIframe(animeTitle, episodeNumber);
        if (videoIframe) {
            servers.push({
                name: '🎬 JKanime (Auto)',
                url: videoIframe,
                active: true,
                type: 'iframe'
            });
            console.log('✅ JKanime iframe extraído automáticamente');
        } else {
            console.log('⚠️ No se pudo extraer iframe de JKanime');
        }
    } catch (error) {
        console.log('❌ Error extrayendo JKanime:', error);
    }
    
    // Servidor 2: JKanime (página completa - fallback)
    servers.push({
        name: 'JKanime (Página)',
        url: `https://jkanime.net/ver/${cleanTitle}/${episodeNumber}/`,
        active: true,
        type: 'iframe'
    });
    
    return servers;
}