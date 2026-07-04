// src/hooks/useJikanEpisodes.ts
import { useState, useEffect } from 'react';

interface Episode {
    mal_id: number;
    url: string;
    title: string;
    title_japanese: string;
    title_romanji: string;
    duration: number | null;
    aired: string | null;
    filler: boolean;
    recap: boolean;
    synopsis: string | null;
    thumbnail?: string | null;
}

export function useJikanEpisodes(animeId: number | null, animeTitle: string = '') {
    const [episodes, setEpisodes] = useState<Episode[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [totalEpisodes, setTotalEpisodes] = useState(0);

    const fetchEpisodes = async () => {
        if (!animeId) {
            setError('No se proporcionó un ID de anime');
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            console.log(`🔄 Fetching episodes for anime ID: ${animeId}`);
            
            const response = await fetch(
                `https://api.jikan.moe/v4/anime/${animeId}/episodes?page=1&limit=100`
            );
            
            if (!response.ok) {
                if (response.status === 404) {
                    console.log(`⚠️ No se encontraron episodios para el ID ${animeId}`);
                    setEpisodes([]);
                    setTotalEpisodes(0);
                    setLoading(false);
                    return;
                }
                throw new Error(`Jikan API error: ${response.status}`);
            }
            
            const data = await response.json();
            const allEpisodes = data.data || [];
            const total = data.pagination?.items?.total || 0;
            
            console.log(`📦 Episodios obtenidos: ${allEpisodes.length}`);
            
            // Generar miniaturas usando un servicio que no tenga problemas de CORS
            const episodesWithThumbnails = allEpisodes.map((ep: any) => {
                const epNum = ep.mal_id;
                // Usar UI Avatars para generar imágenes con texto
                // Esto funciona sin problemas de CORS
                const thumbnail = `https://ui-avatars.com/api/?name=${epNum}&size=300&background=1a1a2e&color=ffffff&font-size=0.5&bold=true`;
                
                return {
                    ...ep,
                    thumbnail: thumbnail
                };
            });
            
            console.log(`📸 Miniaturas generadas para ${episodesWithThumbnails.length} episodios`);
            console.log(`📸 Ejemplo: ${episodesWithThumbnails[0]?.thumbnail}`);
            
            setEpisodes(episodesWithThumbnails);
            setTotalEpisodes(total || allEpisodes.length);
            
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
            console.warn('⚠️ Error obteniendo episodios:', errorMessage);
            setEpisodes([]);
            setTotalEpisodes(0);
            setError(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (animeId) {
            fetchEpisodes();
        }
    }, [animeId]);

    return {
        episodes,
        loading,
        error,
        totalEpisodes,
        fetchEpisodes,
    };
}