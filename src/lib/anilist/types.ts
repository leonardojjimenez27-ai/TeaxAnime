// src/lib/anilist/types.ts

// ... (todos los tipos existentes)

// Añadir estas constantes al final del archivo
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

export const ANIME_GENRES = [
    'Action', 'Adventure', 'Comedy', 'Drama', 'Ecchi', 'Fantasy', 
    'Horror', 'Mecha', 'Music', 'Mystery', 'Psychological', 'Romance', 
    'Sci-Fi', 'Slice of Life', 'Sports', 'Supernatural', 'Thriller'
];

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