// src/lib/anilist/local-data.ts

// Datos de animes que extrajiste manualmente
// Estos animes están en localStorage, pero también los tenemos como respaldo
export const LOCAL_ANIME_DATA: Record<string, any> = {
    // Jujutsu Kaisen T3
    'jujutsu-kaisen-shimetsu-kaiyuu-zenpen': {
        id: 48549,
        malId: 48549,
        title: 'Jujutsu Kaisen - Temporada 3 (Arco Shimetsu)',
        displayTitle: 'Jujutsu Kaisen - Temporada 3 (Arco Shimetsu)',
        image: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx158930-PuPVhPQPxiE2.jpg',
        bannerImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/158930-hhKknA0zzO4i.jpg',
        episodes: 12,
        totalEpisodes: 12,
        genres: ['Action', 'Fantasy', 'Shounen'],
        averageScore: 88,
        description: 'Segunda temporada de Jujutsu Kaisen. Adapta el arco de Shinjuku y el arco de Shibuya.',
        status: 'FINISHED',
        year: 2023,
        format: 'TV',
        duration: 24,
        popularity: 250000,
        favourites: 150000,
        studios: ['MAPPA'],
        seasons: [{ key: 'jujutsu-kaisen-shimetsu-kaiyuu-zenpen', episodeCount: 12 }],
        hasSeasons: false,
        titleForNames: 'Jujutsu Kaisen T3'
    },
    // Attack on Titan (si lo extrajiste)
    'shingeki-no-kyojin': {
        id: 16498,
        malId: 16498,
        title: 'Attack on Titan',
        displayTitle: 'Attack on Titan',
        image: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx16498-fqo1B5cuYU9P.jpg',
        bannerImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/16498-SR2kog5vmbMA.jpg',
        episodes: 25,
        totalEpisodes: 25,
        genres: ['Action', 'Drama', 'Fantasy'],
        averageScore: 87,
        description: 'En un mundo asolado por gigantes devoradores de humanos, la humanidad se refugia tras enormes muros.',
        status: 'FINISHED',
        year: 2013,
        format: 'TV',
        duration: 24,
        popularity: 300000,
        favourites: 200000,
        studios: ['Wit Studio'],
        seasons: [{ key: 'shingeki-no-kyojin', episodeCount: 25 }],
        hasSeasons: false,
        titleForNames: 'Attack on Titan'
    }
};

// Función para obtener datos locales por ID
export function getLocalAnimeById(id: number): any | null {
    for (const [key, data] of Object.entries(LOCAL_ANIME_DATA)) {
        if (data.id === id) {
            return data;
        }
    }
    return null;
}

// Función para obtener datos locales por slug
export function getLocalAnimeBySlug(slug: string): any | null {
    return LOCAL_ANIME_DATA[slug] || null;
}

// Función para obtener todos los animes locales
export function getAllLocalAnime(): any[] {
    return Object.values(LOCAL_ANIME_DATA);
}