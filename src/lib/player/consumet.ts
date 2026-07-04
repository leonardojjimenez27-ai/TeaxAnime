// src/lib/player/consumet.ts
import axios from 'axios';

// Función para buscar un anime en Gogoanime
export async function searchAnimeOnGogo(title: string): Promise<string | null> {
    try {
        const response = await axios.get(
            `https://api.consumet.org/anime/gogoanime/search?q=${encodeURIComponent(title)}`,
            { timeout: 15000 }
        );
        
        if (response.data.results && response.data.results.length > 0) {
            const cleanTitle = title.toLowerCase().trim();
            const result = response.data.results.find((r: any) => {
                const rTitle = r.title.toLowerCase().trim();
                return rTitle.includes(cleanTitle) || cleanTitle.includes(rTitle);
            }) || response.data.results[0];
            
            return result.id;
        }
        return null;
    } catch (error) {
        console.error('Error buscando anime en Gogo:', error);
        return null;
    }
}

// Función para obtener el enlace de un episodio de Gogoanime
export async function getGogoEpisodeUrl(animeId: string, episodeNumber: number): Promise<string | null> {
    try {
        const response = await axios.get(
            `https://api.consumet.org/anime/gogoanime/watch/${animeId}-episode-${episodeNumber}`,
            { timeout: 15000 }
        );
        
        if (response.data.sources && response.data.sources.length > 0) {
            // Buscar la mejor calidad
            const source = response.data.sources.find((s: any) => s.quality === '1080p') || 
                          response.data.sources.find((s: any) => s.quality === '720p') ||
                          response.data.sources.find((s: any) => s.quality === '480p') ||
                          response.data.sources[0];
            
            return source.url;
        }
        return null;
    } catch (error) {
        console.error('Error obteniendo episodio de Gogo:', error);
        return null;
    }
}

// Función para obtener el enlace de un episodio de Zoro
export async function getZoroEpisodeUrl(animeTitle: string, episodeNumber: number): Promise<string | null> {
    try {
        const response = await axios.get(
            `https://api.consumet.org/anime/zoro/watch/${animeTitle}?ep=${episodeNumber}`,
            { timeout: 15000 }
        );
        
        if (response.data.sources && response.data.sources.length > 0) {
            return response.data.sources[0].url;
        }
        return null;
    } catch (error) {
        console.error('Error obteniendo episodio de Zoro:', error);
        return null;
    }
}

// Función para obtener el enlace de un episodio de AnimePahe
export async function getAnimePaheEpisodeUrl(animeTitle: string, episodeNumber: number): Promise<string | null> {
    try {
        const response = await axios.get(
            `https://api.consumet.org/anime/animepahe/watch/${animeTitle}/${episodeNumber}`,
            { timeout: 15000 }
        );
        
        if (response.data.sources && response.data.sources.length > 0) {
            return response.data.sources[0].url;
        }
        return null;
    } catch (error) {
        console.error('Error obteniendo episodio de AnimePahe:', error);
        return null;
    }
}

// Función para obtener el enlace de un episodio de 9anime
export async function get9AnimeEpisodeUrl(animeTitle: string, episodeNumber: number): Promise<string | null> {
    try {
        const response = await axios.get(
            `https://api.consumet.org/anime/9anime/watch/${animeTitle}?ep=${episodeNumber}`,
            { timeout: 15000 }
        );
        
        if (response.data.sources && response.data.sources.length > 0) {
            return response.data.sources[0].url;
        }
        return null;
    } catch (error) {
        console.error('Error obteniendo episodio de 9anime:', error);
        return null;
    }
}

// Función para obtener el enlace de un episodio de AnimeSuge
export async function getAnimeSugeEpisodeUrl(animeTitle: string, episodeNumber: number): Promise<string | null> {
    try {
        const response = await axios.get(
            `https://api.consumet.org/anime/animesuge/watch/${animeTitle}?ep=${episodeNumber}`,
            { timeout: 15000 }
        );
        
        if (response.data.sources && response.data.sources.length > 0) {
            return response.data.sources[0].url;
        }
        return null;
    } catch (error) {
        console.error('Error obteniendo episodio de AnimeSuge:', error);
        return null;
    }
}

// Función para obtener múltiples servidores
export async function getServers(animeTitle: string, episodeNumber: number): Promise<{ name: string; url: string; active: boolean; type: 'iframe' | 'video' }[]> {
    const servers: { name: string; url: string; active: boolean; type: 'iframe' | 'video' }[] = [];
    const cleanTitle = animeTitle.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    console.log(`🔍 Buscando servidores para: ${animeTitle} - Episodio ${episodeNumber}`);

    // Servidor 1: Gogoanime (principal)
    try {
        const animeId = await searchAnimeOnGogo(animeTitle);
        if (animeId) {
            const url = await getGogoEpisodeUrl(animeId, episodeNumber);
            if (url) {
                servers.push({
                    name: 'Gogoanime',
                    url: url,
                    active: true,
                    type: 'video'
                });
                console.log('✅ Gogoanime encontrado');
            }
        }
    } catch (error) {
        console.log('❌ Error con Gogoanime:', error);
    }

    // Servidor 2: Zoro
    try {
        const url = await getZoroEpisodeUrl(animeTitle, episodeNumber);
        if (url) {
            servers.push({
                name: 'Zoro',
                url: url,
                active: true,
                type: 'video'
            });
            console.log('✅ Zoro encontrado');
        }
    } catch (error) {
        console.log('❌ Error con Zoro:', error);
    }

    // Servidor 3: AnimePahe
    try {
        const url = await getAnimePaheEpisodeUrl(animeTitle, episodeNumber);
        if (url) {
            servers.push({
                name: 'AnimePahe',
                url: url,
                active: true,
                type: 'video'
            });
            console.log('✅ AnimePahe encontrado');
        }
    } catch (error) {
        console.log('❌ Error con AnimePahe:', error);
    }

    // Servidor 4: 9anime
    try {
        const url = await get9AnimeEpisodeUrl(animeTitle, episodeNumber);
        if (url) {
            servers.push({
                name: '9anime',
                url: url,
                active: true,
                type: 'video'
            });
            console.log('✅ 9anime encontrado');
        }
    } catch (error) {
        console.log('❌ Error con 9anime:', error);
    }

    // Servidor 5: AnimeSuge
    try {
        const url = await getAnimeSugeEpisodeUrl(animeTitle, episodeNumber);
        if (url) {
            servers.push({
                name: 'AnimeSuge',
                url: url,
                active: true,
                type: 'video'
            });
            console.log('✅ AnimeSuge encontrado');
        }
    } catch (error) {
        console.log('❌ Error con AnimeSuge:', error);
    }

    // Servidor 6: Gogoanime (iframe directo - fallback)
    servers.push({
        name: 'Gogoanime (Iframe)',
        url: `https://gogoanime3.co/${cleanTitle}-episode-${episodeNumber}`,
        active: true,
        type: 'iframe'
    });

    // Servidor 7: 9anime (iframe directo - fallback)
    servers.push({
        name: '9anime (Iframe)',
        url: `https://9anime.to/embed/${cleanTitle}?ep=${episodeNumber}`,
        active: true,
        type: 'iframe'
    });

    // Servidor 8: AnimeFlix (iframe directo - fallback)
    servers.push({
        name: 'AnimeFlix',
        url: `https://animeflix.live/embed/${cleanTitle}?ep=${episodeNumber}`,
        active: true,
        type: 'iframe'
    });

    console.log(`📡 Total servidores encontrados: ${servers.length}`);

    return servers;
}