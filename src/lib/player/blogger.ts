// src/lib/player/blogger.ts
import axios from 'axios';

// Función para buscar el video de Blogger
export async function getBloggerVideoUrl(animeTitle: string, episodeNumber: number): Promise<string | null> {
    try {
        // Limpiar el título para buscar
        const cleanTitle = animeTitle.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
        
        // Buscar en diferentes dominios de Blogger que usan para alojar videos
        const bloggerDomains = [
            `https://${cleanTitle}.blogspot.com`,
            `https://${cleanTitle}.blogger.com`,
            `https://anime-${cleanTitle}.blogspot.com`,
        ];
        
        // También buscar en sitios que usan Blogger como backend
        const sites = [
            `https://jkanime.net/ver/${cleanTitle}/${episodeNumber}/`,
            `https://animeflv.net/ver/${cleanTitle}-${episodeNumber}`,
        ];
        
        // Primero, intentar obtener el video de JKanime
        for (const site of sites) {
            try {
                const response = await axios.get(site, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    },
                    timeout: 10000
                });
                
                // Buscar en el HTML el iframe de Blogger
                const html = response.data;
                const bloggerMatch = html.match(/src="(https?:\/\/www\.blogger\.com\/video\.g\?[^"]+)"/);
                if (bloggerMatch) {
                    return bloggerMatch[1];
                }
                
                // Buscar también en los scripts
                const scriptMatch = html.match(/blogger\.com\/video\.g\?[^"']+/);
                if (scriptMatch) {
                    return scriptMatch[0];
                }
            } catch (e) {
                console.log(`Error en ${site}:`, e);
            }
        }
        
        // Si no se encuentra, buscar en sitios que usan Blogger
        for (const domain of bloggerDomains) {
            try {
                const response = await axios.get(`${domain}/${episodeNumber}`, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    },
                    timeout: 10000
                });
                
                const html = response.data;
                const match = html.match(/src="(https?:\/\/www\.blogger\.com\/video\.g\?[^"]+)"/);
                if (match) {
                    return match[1];
                }
            } catch (e) {
                console.log(`Error en ${domain}:`, e);
            }
        }
        
        return null;
    } catch (error) {
        console.error('Error obteniendo video de Blogger:', error);
        return null;
    }
}

// Función para obtener múltiples servidores
export async function getBloggerServers(animeTitle: string, episodeNumber: number): Promise<{ name: string; url: string; active: boolean; type: 'iframe' }[]> {
    const servers: { name: string; url: string; active: boolean; type: 'iframe' }[] = [];
    
    // Servidor 1: Blogger (principal)
    try {
        const url = await getBloggerVideoUrl(animeTitle, episodeNumber);
        if (url) {
            servers.push({
                name: 'Blogger Video',
                url: url,
                active: true,
                type: 'iframe'
            });
        }
    } catch (error) {
        console.log('Error obteniendo Blogger:', error);
    }
    
    // Servidor 2: JKanime (iframe directo)
    const cleanTitle = animeTitle.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    servers.push({
        name: 'JKanime',
        url: `https://jkanime.net/ver/${cleanTitle}/${episodeNumber}/`,
        active: true,
        type: 'iframe'
    });
    
    // Servidor 3: AnimeFLV
    servers.push({
        name: 'AnimeFLV',
        url: `https://animeflv.net/ver/${cleanTitle}-${episodeNumber}`,
        active: true,
        type: 'iframe'
    });
    
    // Servidor 4: Gogoanime (iframe)
    servers.push({
        name: 'Gogoanime',
        url: `https://gogoanime3.co/${cleanTitle}-episode-${episodeNumber}`,
        active: true,
        type: 'iframe'
    });
    
    return servers;
}