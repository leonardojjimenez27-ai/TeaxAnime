// src/hooks/usePlayer.ts
import { useState, useEffect } from 'react';
import { getVerAnimeOnlineServers } from '@/lib/player/veranimeonline-extractor';

interface Server {
    name: string;
    url: string;
    active: boolean;
    type: 'iframe' | 'video';
}

// Función para cargar tokens de Blogger desde localStorage (solo en cliente)
function loadBloggerTokens(): Record<string, Record<number, string>> {
    // Verificar si estamos en el cliente (navegador)
    if (typeof window === 'undefined') {
        console.log('⚠️ localStorage no disponible en el servidor');
        return {};
    }
    
    try {
        const saved = localStorage.getItem('blogger_tokens');
        if (saved) {
            const tokens = JSON.parse(saved);
            console.log('📂 Tokens de Blogger cargados:', Object.keys(tokens).length, 'animes');
            return tokens;
        }
    } catch (e) {
        console.error('Error cargando tokens:', e);
    }
    return {};
}

function getSeasonKey(animeTitle: string, absoluteEpisode: number): string | null {
    const title = animeTitle.toLowerCase();
    
    if (title.includes('attack on titan') || title.includes('shingeki no kyojin')) {
        if (absoluteEpisode >= 1 && absoluteEpisode <= 25) return 'shingeki-no-kyojin';
        if (absoluteEpisode >= 26 && absoluteEpisode <= 37) return 'shingeki-no-kyojin-2';
        if (absoluteEpisode >= 38 && absoluteEpisode <= 49) return 'shingeki-no-kyojin-3';
        if (absoluteEpisode >= 50 && absoluteEpisode <= 59) return 'shingeki-no-kyojin-3-part-2';
        if (absoluteEpisode >= 60 && absoluteEpisode <= 75) return 'shingeki-no-kyojin-the-final-season';
        if (absoluteEpisode >= 76 && absoluteEpisode <= 87) return 'shingeki-no-kyojin-the-final-season-part-2';
    }
    
    return null;
}

function getRelativeEpisode(animeTitle: string, absoluteEpisode: number): number | null {
    const title = animeTitle.toLowerCase();
    
    if (title.includes('attack on titan') || title.includes('shingeki no kyojin')) {
        if (absoluteEpisode >= 1 && absoluteEpisode <= 25) return absoluteEpisode;
        if (absoluteEpisode >= 26 && absoluteEpisode <= 37) return absoluteEpisode - 25;
        if (absoluteEpisode >= 38 && absoluteEpisode <= 49) return absoluteEpisode - 37;
        if (absoluteEpisode >= 50 && absoluteEpisode <= 59) return absoluteEpisode - 49;
        if (absoluteEpisode >= 60 && absoluteEpisode <= 75) return absoluteEpisode - 59;
        if (absoluteEpisode >= 76 && absoluteEpisode <= 87) return absoluteEpisode - 75;
    }
    
    return null;
}

function findBloggerToken(savedTokens: Record<string, Record<number, string>>, animeTitle: string, episodeNumber: number): string | null {
    console.log(`🔍 Buscando token para: "${animeTitle}" - Episodio ${episodeNumber}`);
    
    const seasonKey = getSeasonKey(animeTitle, episodeNumber);
    if (seasonKey) {
        const relativeEpisode = getRelativeEpisode(animeTitle, episodeNumber);
        if (relativeEpisode !== null) {
            console.log(`📺 Temporada: "${seasonKey}", Episodio relativo: ${relativeEpisode}`);
            if (savedTokens[seasonKey] && savedTokens[seasonKey][relativeEpisode]) {
                console.log(`✅ Token encontrado en: "${seasonKey}"`);
                return savedTokens[seasonKey][relativeEpisode];
            }
        }
    }
    
    // Buscar en todas las claves
    for (const [key, episodes] of Object.entries(savedTokens)) {
        if (episodes[episodeNumber]) {
            console.log(`✅ Token encontrado en clave: "${key}"`);
            return episodes[episodeNumber];
        }
    }
    
    console.log('❌ No se encontró token');
    return null;
}

export function usePlayer(animeTitle: string, episodeNumber: number) {
    const [servers, setServers] = useState<Server[]>([]);
    const [currentServer, setCurrentServer] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadServers() {
            setLoading(true);
            setError(null);
            try {
                console.log(`🔄 usePlayer - Cargando servidores para: "${animeTitle}" - Episodio ${episodeNumber}`);
                
                const serverList = await getVerAnimeOnlineServers(animeTitle, episodeNumber);
                const savedTokens = loadBloggerTokens();
                const bloggerToken = findBloggerToken(savedTokens, animeTitle, episodeNumber);
                
                if (bloggerToken) {
                    const bloggerServer = {
                        name: '🎬 Blogger (Auto)',
                        url: bloggerToken,
                        active: true,
                        type: 'iframe' as const
                    };
                    setServers([bloggerServer, ...serverList]);
                    setCurrentServer(0);
                    console.log('🎬 Blogger seleccionado');
                } else {
                    setServers(serverList);
                    const firstActive = serverList.findIndex(s => s.active);
                    if (firstActive !== -1) {
                        setCurrentServer(firstActive);
                    }
                }
            } catch (err) {
                console.error('Error:', err);
                setError('Error al cargar los servidores');
            } finally {
                setLoading(false);
            }
        }

        loadServers();
    }, [animeTitle, episodeNumber]);

    const switchServer = (index: number) => {
        if (index >= 0 && index < servers.length && servers[index].active) {
            setCurrentServer(index);
        }
    };

    return {
        servers,
        currentServer,
        currentUrl: servers[currentServer]?.url || '',
        currentServerName: servers[currentServer]?.name || '',
        currentServerType: servers[currentServer]?.type || 'iframe',
        isActive: servers[currentServer]?.active || false,
        loading,
        error,
        switchServer,
    };
}