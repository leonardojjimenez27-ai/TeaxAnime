// src/lib/player/veranimeonline-extractor.ts
import { getBloggerVideoUrl } from './blogger-extractor';
import { tokenCache } from './token-cache';

// Función para obtener la URL del episodio de VerAnimeOnline
export function getVerAnimeOnlineUrl(animeTitle: string, episodeNumber: number): string {
    const cleanTitle = animeTitle
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    
    return `https://veranimeonline.co/episodio/${cleanTitle}-episodio-${episodeNumber}/`;
}

// Función para obtener múltiples servidores
export async function getVerAnimeOnlineServers(animeTitle: string, episodeNumber: number): Promise<{ name: string; url: string; active: boolean; type: 'iframe' }[]> {
    const servers: { name: string; url: string; active: boolean; type: 'iframe' }[] = [];
    
    console.log(`🔍 Buscando servidores para: ${animeTitle} - Episodio ${episodeNumber}`);
    
    const cleanTitle = animeTitle
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    
    // ============================================================
    // SERVICIO 1: VerAnimeOnline (página completa)
    // ============================================================
    servers.push({
        name: 'VerAnimeOnline',
        url: `https://veranimeonline.co/episodio/${cleanTitle}-episodio-${episodeNumber}/`,
        active: true,
        type: 'iframe'
    });
    
    // ============================================================
    // SERVICIO 2: JKanime
    // ============================================================
    servers.push({
        name: 'JKanime',
        url: `https://jkanime.net/ver/${cleanTitle}/${episodeNumber}/`,
        active: true,
        type: 'iframe'
    });
    
    // ============================================================
    // SERVICIO 3: Gogoanime
    // ============================================================
    servers.push({
        name: 'Gogoanime',
        url: `https://gogoanime3.co/${cleanTitle}-episode-${episodeNumber}`,
        active: true,
        type: 'iframe'
    });
    
    // ============================================================
    // SERVICIO 4: AnimeFLV
    // ============================================================
    servers.push({
        name: 'AnimeFLV',
        url: `https://animeflv.net/ver/${cleanTitle}-${episodeNumber}`,
        active: true,
        type: 'iframe'
    });
    
    // ============================================================
    // SERVICIO 5: Zoro
    // ============================================================
    servers.push({
        name: 'Zoro',
        url: `https://zoro.to/embed/${cleanTitle}?ep=${episodeNumber}`,
        active: true,
        type: 'iframe'
    });
    
    // ============================================================
    // SERVICIO 6: 9anime
    // ============================================================
    servers.push({
        name: '9anime',
        url: `https://9anime.to/embed/${cleanTitle}?ep=${episodeNumber}`,
        active: true,
        type: 'iframe'
    });
    
    console.log(`📡 Total servidores: ${servers.length}`);
    
    return servers;
}