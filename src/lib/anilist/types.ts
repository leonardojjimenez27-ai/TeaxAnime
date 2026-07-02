// src/lib/anilist/types.ts

// Tipos básicos que AniList devuelve
export interface AniListTitle {
    romaji: string;
    english: string | null;
    native: string;
}

export interface AniListCoverImage {
    extraLarge: string;
    large: string;
    medium: string;
    color?: string;
}

export interface AniListMedia {
    id: number;
    title: AniListTitle;
    coverImage: AniListCoverImage;
    bannerImage: string | null;
    episodes: number | null;
    genres: string[];
    averageScore: number | null;
    description: string | null;
    status: string;
    season: string | null;
    seasonYear: number | null;
    format: string;
    duration: number | null;
    popularity: number;
    favourites: number;
    trending: number;
    studios?: {
        nodes: Array<{ name: string }>;
    };
    characters?: {
        nodes: Array<{
            id: number;
            name: { full: string };
            image: { large: string };
            gender?: string;
        }>;
    };
}

// Tipos que usaremos en nuestra aplicación (compatibles con los antiguos)
export interface AnimeResult {
    id: number;
    title: string;
    image: string;
    cover?: string;
    episodes?: number | null;
    genres: string[];
    rating?: number | null;
    year?: number | null;
    color?: string;
    bannerImage?: string | null;
    averageScore?: number | null;
    popularity?: number;
    favourites?: number;
    status?: string;
    format?: string;
    duration?: number | null;
}

export interface AnimeInfo extends AnimeResult {
    description: string | null;
    studios: string[];
    characters: Character[];
    status?: string;
    season?: string | null;
    format?: string;
    duration?: number | null;
}

export interface Character {
    id: number;
    name: string;
    image: string;
    role: string;
}

export interface Episode {
    id: string;
    number: number;
    title: string | null;
    thumbnail: string | null;
    aired: string | null;
}

export interface PageInfo {
    total: number;
    currentPage: number;
    lastPage: number;
    hasNextPage: boolean;
    perPage: number;
}

export interface SearchResult {
    results: AnimeResult[];
    pageInfo: PageInfo;
}

// Para el reproductor
export interface StreamSource {
    url: string;
    quality: string;
    isM3U8: boolean;
}

export interface StreamSubtitle {
    url: string;
    lang: string;
}

// Constantes
export const ANIME_GENRES = [
    'Action', 'Adventure', 'Comedy', 'Drama', 'Ecchi', 'Fantasy', 
    'Horror', 'Mecha', 'Music', 'Mystery', 'Psychological', 'Romance', 
    'Sci-Fi', 'Slice of Life', 'Sports', 'Supernatural', 'Thriller'
];

export const GENRE_ES: Record<string, string> = {
    'Action': 'Acción',
    'Adventure': 'Aventura',
    'Comedy': 'Comedia',
    'Drama': 'Drama',
    'Ecchi': 'Ecchi',
    'Fantasy': 'Fantasía',
    'Horror': 'Terror',
    'Mecha': 'Mecha',
    'Music': 'Música',
    'Mystery': 'Misterio',
    'Psychological': 'Psicológico',
    'Romance': 'Romance',
    'Sci-Fi': 'Ciencia Ficción',
    'Slice of Life': 'Recortes de vida',
    'Sports': 'Deportes',
    'Supernatural': 'Sobrenatural',
    'Thriller': 'Suspenso'
};

// Funciones de utilidad
export function getTitle(media: AniListMedia | AnimeResult): string {
    if ('title' in media && typeof media.title === 'object') {
        return media.title.english || media.title.romaji || media.title.native || '';
    }
    return media.title || '';
}

export function slugifyGenre(genre: string): string {
    return genre.toLowerCase().replace(/\s+/g, '-');
}

export function genreFromSlug(slug: string): string {
    const map: Record<string, string> = {
        'action': 'Action',
        'aventura': 'Adventure',
        'comedia': 'Comedy',
        'drama': 'Drama',
        'ecchi': 'Ecchi',
        'fantasia': 'Fantasy',
        'terror': 'Horror',
        'mecha': 'Mecha',
        'musica': 'Music',
        'misterio': 'Mystery',
        'psicologico': 'Psychological',
        'romance': 'Romance',
        'ciencia-ficcion': 'Sci-Fi',
        'recortes-de-vida': 'Slice of Life',
        'deportes': 'Sports',
        'sobrenatural': 'Supernatural',
        'suspenso': 'Thriller'
    };
    return map[slug] || slug;
}

// src/lib/anilist/types.ts

// ... (mantén los tipos existentes)

export interface EpisodeDetails {
    id: number;
    title: string | null;
    number: number;
    description: string | null;
    thumbnail: string | null;
    airDate: string | null;
    duration: number | null;
}

export interface Season {
    id: number;
    name: string;
    seasonNumber: number;
    episodes: EpisodeDetails[];
}

export interface AnimeFullInfo extends AnimeInfo {
    episodes: EpisodeDetails[];
    seasons: Season[];
    nextAiring: {
        episode: number;
        timeUntilAiring: number;
    } | null;
    relations: {
        id: number;
        title: string;
        image: string;
        relationType: string;
    }[];
}