// src/lib/player/player-service.ts

// Función para limpiar el título del anime para URL
function cleanAnimeTitle(title: string): string {
    return title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}

// Función para obtener múltiples servidores
export async function getPlayerServers(animeTitle: string, episodeNumber: number): Promise<{ name: string; url: string; active: boolean; type: 'iframe' | 'video' }[]> {
    const cleanTitle = cleanAnimeTitle(animeTitle);
    const servers: { name: string; url: string; active: boolean; type: 'iframe' | 'video' }[] = [];
    
    // ============================================
    // SERVICIO 1: JKanime (via scraper)
    // ============================================
    try {
        // Intentar obtener el video de JKanime
        const response = await fetch(`http://localhost:8080/api/jkanime?anime=${cleanTitle}&episode=${episodeNumber}`);
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.videoUrl) {
                servers.push({
                    name: 'JKanime (Scraper)',
                    url: data.videoUrl,
                    active: true,
                    type: 'video'
                });
            }
        }
    } catch (error) {
        console.log('Error obteniendo video de JKanime:', error);
    }
    
    // ============================================
    // SERVICIO 2: Gogoanime (video directo)
    // ============================================
    const gogoDomains = [
        { name: 'Gogoanime', url: `https://gogoanime.cc/${cleanTitle}-episode-${episodeNumber}` },
        { name: 'Gogoanime (TV)', url: `https://gogoanime.tv/${cleanTitle}-episode-${episodeNumber}` },
        { name: 'Gogoanime (SH)', url: `https://gogoanime.sh/${cleanTitle}-episode-${episodeNumber}` },
    ];
    
    gogoDomains.forEach(domain => {
        servers.push({
            name: domain.name,
            url: domain.url,
            active: true,
            type: 'video'
        });
    });
    
    // ============================================
    // SERVICIO 3: AnimeFlix (video directo)
    // ============================================
    servers.push({
        name: 'AnimeFlix',
        url: `https://animeflix.live/embed/${cleanTitle}?ep=${episodeNumber}`,
        active: true,
        type: 'video'
    });
    
    // ============================================
    // SERVICIO 4: AnimePahe (iframe)
    // ============================================
    servers.push({
        name: 'AnimePahe',
        url: `https://animepahe.com/embed/${episodeNumber}`,
        active: true,
        type: 'iframe'
    });
    
    // ============================================
    // SERVICIO 5: Zoro (iframe)
    // ============================================
    servers.push({
        name: 'Zoro',
        url: `https://zoro.to/embed/${cleanTitle}?ep=${episodeNumber}`,
        active: true,
        type: 'iframe'
    });
    
    // ============================================
    // SERVICIO 6: 9anime (iframe)
    // ============================================
    servers.push({
        name: '9anime',
        url: `https://9anime.to/embed/${cleanTitle}?ep=${episodeNumber}`,
        active: true,
        type: 'iframe'
    });
    
    return servers;
}

// Función para obtener el enlace de reproducción (compatibilidad)
export function getPlayerUrl(animeTitle: string, episodeNumber: number): string {
    const cleanTitle = cleanAnimeTitle(animeTitle);
    return `https://jkanime.net/ver/${cleanTitle}/${episodeNumber}/`;
}