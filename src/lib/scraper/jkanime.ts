// src/lib/scraper/jkanime.ts
import axios from 'axios';
import * as cheerio from 'cheerio';

// Función para obtener el enlace del video de JKanime
export async function scrapeJKanimeEpisode(animeSlug: string, episodeNumber: number): Promise<string | null> {
    try {
        // URL del episodio en JKanime
        const url = `https://jkanime.net/ver/${animeSlug}/${episodeNumber}/`;
        
        console.log(`🔍 Scrapeando: ${url}`);
        
        // Hacer la solicitud HTTP
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'es-ES,es;q=0.8,en-US;q=0.5,en;q=0.3',
                'Referer': 'https://jkanime.net/',
            }
        });
        
        // Cargar el HTML en cheerio
        const $ = cheerio.load(response.data);
        
        // Buscar el video en el HTML
        // JKanime usa diferentes formatos, probamos varios selectores
        
        // Opción 1: Buscar el elemento video directamente
        const videoElement = $('video');
        if (videoElement.length > 0) {
            // Buscar el src del video
            let videoSrc = videoElement.attr('src');
            
            // Si no tiene src directo, buscar en los source children
            if (!videoSrc || videoSrc === '') {
                const sourceElement = videoElement.find('source');
                if (sourceElement.length > 0) {
                    videoSrc = sourceElement.attr('src');
                }
            }
            
            if (videoSrc && videoSrc !== '') {
                // Si es una URL blob, no podemos usarla directamente
                if (videoSrc.startsWith('blob:')) {
                    console.log('⚠️ Video es blob URL, buscando en el script...');
                    // Buscar en los scripts la URL real
                    const scripts = $('script').toArray();
                    for (const script of scripts) {
                        const scriptContent = $(script).html() || '';
                        // Buscar patrones de URL de video
                        const videoUrlMatch = scriptContent.match(/https?:\/\/[^"']+\.mp4/);
                        if (videoUrlMatch) {
                            return videoUrlMatch[0];
                        }
                        const m3u8Match = scriptContent.match(/https?:\/\/[^"']+\.m3u8/);
                        if (m3u8Match) {
                            return m3u8Match[0];
                        }
                    }
                    return null;
                }
                return videoSrc;
            }
        }
        
        // Opción 2: Buscar en los scripts del HTML
        const scripts = $('script').toArray();
        for (const script of scripts) {
            const scriptContent = $(script).html() || '';
            
            // Buscar patrones de URL de video en los scripts
            const patterns = [
                /https?:\/\/[^"']+\.mp4/,
                /https?:\/\/[^"']+\.m3u8/,
                /https?:\/\/[^"']+\.mkv/,
                /https?:\/\/[^"']+\.webm/,
            ];
            
            for (const pattern of patterns) {
                const match = scriptContent.match(pattern);
                if (match) {
                    return match[0];
                }
            }
            
            // Buscar URLs de video en formato JSON
            const jsonMatch = scriptContent.match(/"file"\s*:\s*"([^"]+)"/);
            if (jsonMatch) {
                return jsonMatch[1];
            }
            
            const sourceMatch = scriptContent.match(/"src"\s*:\s*"([^"]+)"/);
            if (sourceMatch && sourceMatch[1].includes('.mp4')) {
                return sourceMatch[1];
            }
        }
        
        console.log('❌ No se encontró el video en la página');
        return null;
        
    } catch (error) {
        console.error('❌ Error scrapeando JKanime:', error);
        return null;
    }
}

// Función para obtener información del anime desde JKanime
export async function scrapeJKanimeInfo(animeSlug: string): Promise<{ title: string; episodes: number; image: string } | null> {
    try {
        const url = `https://jkanime.net/anime/${animeSlug}/`;
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            }
        });
        
        const $ = cheerio.load(response.data);
        
        // Extraer información del anime
        const title = $('h1.title').text().trim() || $('h1.anime-title').text().trim();
        const episodes = parseInt($('.episodes').text().trim()) || 0;
        const image = $('.anime-image img').attr('src') || '';
        
        return { title, episodes, image };
        
    } catch (error) {
        console.error('Error scrapeando info de JKanime:', error);
        return null;
    }
}