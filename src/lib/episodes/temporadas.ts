// src/lib/episodes/temporadas.ts

// Mapeo de temporadas para Attack on Titan (Shingeki no Kyojin)
export const TEMPORADAS_ATTACK_ON_TITAN = [
    { id: 1, name: 'Temporada 1', episodes: { start: 1, end: 25 } },
    { id: 2, name: 'Temporada 2', episodes: { start: 26, end: 37 } },
    { id: 3, name: 'Temporada 3 (Parte 1)', episodes: { start: 38, end: 49 } },
    { id: 4, name: 'Temporada 3 (Parte 2)', episodes: { start: 50, end: 59 } },
    { id: 5, name: 'Temporada 4 (Parte 1)', episodes: { start: 60, end: 75 } },
    { id: 6, name: 'Temporada 4 (Parte 2)', episodes: { start: 76, end: 87 } },
];

// Mapeo de temporadas para One Piece
export const TEMPORADAS_ONE_PIECE = [
    { id: 1, name: 'Temporada 1 - East Blue', episodes: { start: 1, end: 61 } },
    { id: 2, name: 'Temporada 2 - Grand Line', episodes: { start: 62, end: 130 } },
    { id: 3, name: 'Temporada 3 - Alabasta', episodes: { start: 131, end: 206 } },
    { id: 4, name: 'Temporada 4 - Sky Island', episodes: { start: 207, end: 263 } },
    { id: 5, name: 'Temporada 5 - Water 7', episodes: { start: 264, end: 336 } },
    { id: 6, name: 'Temporada 6 - Thriller Bark', episodes: { start: 337, end: 381 } },
    { id: 7, name: 'Temporada 7 - Marineford', episodes: { start: 382, end: 516 } },
    { id: 8, name: 'Temporada 8 - Post-War', episodes: { start: 517, end: 577 } },
    { id: 9, name: 'Temporada 9 - Fish-Man Island', episodes: { start: 578, end: 628 } },
    { id: 10, name: 'Temporada 10 - Punk Hazard', episodes: { start: 629, end: 746 } },
    { id: 11, name: 'Temporada 11 - Dressrosa', episodes: { start: 747, end: 889 } },
    { id: 12, name: 'Temporada 12 - Whole Cake', episodes: { start: 890, end: 877 } },
    { id: 13, name: 'Temporada 13 - Wano', episodes: { start: 890, end: 1000 } },
];

// Mapeo de temporadas para Naruto
export const TEMPORADAS_NARUTO = [
    { id: 1, name: 'Temporada 1', episodes: { start: 1, end: 50 } },
    { id: 2, name: 'Temporada 2', episodes: { start: 51, end: 100 } },
    { id: 3, name: 'Temporada 3', episodes: { start: 101, end: 150 } },
    { id: 4, name: 'Temporada 4', episodes: { start: 151, end: 200 } },
    { id: 5, name: 'Temporada 5', episodes: { start: 201, end: 220 } },
];

// ============================================================
// FUNCIÓN PARA OBTENER LA TEMPORADA DE UN EPISODIO
// ============================================================
export function getSeasonForEpisode(episodeNumber: number, animeTitle: string): number {
    const title = animeTitle.toLowerCase();
    
    // Para Attack on Titan
    if (title.includes('attack on titan') || title.includes('shingeki no kyojin')) {
        for (const season of TEMPORADAS_ATTACK_ON_TITAN) {
            if (episodeNumber >= season.episodes.start && episodeNumber <= season.episodes.end) {
                return season.id;
            }
        }
        return Math.ceil(episodeNumber / 25);
    }
    
    // Para One Piece
    if (title.includes('one piece')) {
        for (const season of TEMPORADAS_ONE_PIECE) {
            if (episodeNumber >= season.episodes.start && episodeNumber <= season.episodes.end) {
                return season.id;
            }
        }
        return Math.ceil(episodeNumber / 50);
    }
    
    // Para Naruto
    if (title.includes('naruto')) {
        for (const season of TEMPORADAS_NARUTO) {
            if (episodeNumber >= season.episodes.start && episodeNumber <= season.episodes.end) {
                return season.id;
            }
        }
        return Math.ceil(episodeNumber / 50);
    }
    
    // Para otros animes largos
    if (title.includes('bleach') || 
        title.includes('dragon ball') ||
        title.includes('jujutsu') ||
        title.includes('demon slayer') ||
        title.includes('kimetsu')) {
        return Math.ceil(episodeNumber / 25);
    }
    
    // Para animes normales (12-24 episodios)
    return 1;
}

// ============================================================
// FUNCIÓN PARA OBTENER EL NOMBRE DE LA TEMPORADA
// ============================================================
export function getSeasonName(seasonId: number, animeTitle: string): string {
    const title = animeTitle.toLowerCase();
    
    // Para Attack on Titan
    if (title.includes('attack on titan') || title.includes('shingeki no kyojin')) {
        const season = TEMPORADAS_ATTACK_ON_TITAN.find(s => s.id === seasonId);
        if (season) return season.name;
    }
    
    // Para One Piece
    if (title.includes('one piece')) {
        const season = TEMPORADAS_ONE_PIECE.find(s => s.id === seasonId);
        if (season) return season.name;
    }
    
    // Para Naruto
    if (title.includes('naruto')) {
        const season = TEMPORADAS_NARUTO.find(s => s.id === seasonId);
        if (season) return season.name;
    }
    
    // Para otros animes
    if (seasonId === 1) return 'Temporada 1';
    if (seasonId === 2) return 'Temporada 2';
    if (seasonId === 3) return 'Temporada 3';
    if (seasonId === 4) return 'Temporada 4';
    if (seasonId === 5) return 'Temporada 5';
    return `Temporada ${seasonId}`;
}

// ============================================================
// FUNCIÓN PARA AGRUPAR EPISODIOS POR TEMPORADAS
// ============================================================
export function groupEpisodesBySeasons(episodes: any[], animeTitle: string): Map<number, any[]> {
    const seasons = new Map<number, any[]>();
    
    for (const episode of episodes) {
        const seasonId = getSeasonForEpisode(episode.mal_id, animeTitle);
        if (!seasons.has(seasonId)) {
            seasons.set(seasonId, []);
        }
        seasons.get(seasonId)!.push(episode);
    }
    
    return seasons;
}

// ============================================================
// FUNCIONES PARA PAGINACIÓN
// ============================================================
export function paginateEpisodes(episodes: any[], page: number, pageSize: number = 10): any[] {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return episodes.slice(start, end);
}

export function getTotalPages(episodes: any[], pageSize: number = 10): number {
    if (!episodes || episodes.length === 0) return 0;
    return Math.ceil(episodes.length / pageSize);
}