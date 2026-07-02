// src/lib/anilist/mapper.ts
import type { AniListMedia, AnimeResult, AnimeInfo, Character } from './types'

// Función para limpiar descripciones
function cleanDescription(text: string | null): string | null {
    if (!text) return null
    
    let clean = text
    
    // Remover etiquetas HTML
    clean = clean.replace(/<br\s*\/?>/gi, '\n')
    clean = clean.replace(/<[^>]*>/g, '')
    
    // Remover caracteres especiales HTML
    clean = clean.replace(/&quot;/g, '"')
    clean = clean.replace(/&amp;/g, '&')
    clean = clean.replace(/&lt;/g, '<')
    clean = clean.replace(/&gt;/g, '>')
    clean = clean.replace(/&nbsp;/g, ' ')
    clean = clean.replace(/&#039;/g, "'")
    clean = clean.replace(/&rsquo;/g, "'")
    clean = clean.replace(/&ldquo;/g, '"')
    clean = clean.replace(/&rdquo;/g, '"')
    
    // Remover "(Source: ...)" y cosas similares
    clean = clean.replace(/\(Source:.*?\)/g, '')
    clean = clean.replace(/\(Traducción:.*?\)/g, '')
    clean = clean.replace(/\(Translated:.*?\)/g, '')
    
    // Remover múltiples espacios y saltos de línea
    clean = clean.replace(/\s+/g, ' ')
    clean = clean.replace(/\n/g, ' ')
    
    // Remover espacios al inicio y final
    clean = clean.trim()
    
    // Si el primer caracter es minúscula, capitalizarlo
    if (clean.length > 0) {
        clean = clean.charAt(0).toUpperCase() + clean.slice(1)
    }
    
    return clean
}

// Función para obtener la descripción en español
function getSpanishDescription(media: any): string | null {
    // AniList puede tener descripciones en diferentes idiomas
    // Intentamos obtener la descripción en español primero
    if (media.description) {
        // Si la descripción contiene "(Translated:" o "(Traducción:" puede estar traducida
        const clean = cleanDescription(media.description)
        if (clean && !clean.includes('(Source:')) {
            return clean
        }
    }
    
    // Si no hay descripción o está en inglés, devolvemos null
    return null
}

export function mapToAnimeResult(media: AniListMedia): AnimeResult {
    const title = media.title.english || media.title.romaji || media.title.native || ''
    
    return {
        id: media.id,
        title: title,
        image: media.coverImage.extraLarge || media.coverImage.large,
        cover: media.bannerImage || undefined,
        episodes: media.episodes,
        genres: media.genres,
        rating: media.averageScore ? media.averageScore / 10 : undefined,
        year: media.seasonYear || undefined,
        color: media.coverImage.color || undefined,
        bannerImage: media.bannerImage,
        averageScore: media.averageScore,
        popularity: media.popularity,
        favourites: media.favourites,
        status: media.status,
        format: media.format,
        duration: media.duration,
        description: getSpanishDescription(media),
    }
}

export function mapToAnimeInfo(media: AniListMedia): AnimeInfo {
    const result = mapToAnimeResult(media)
    
    return {
        ...result,
        description: getSpanishDescription(media),
        studios: media.studios?.nodes.map(s => s.name) || [],
        characters: media.characters?.nodes.map((c: any): Character => ({
            id: c.id,
            name: c.name.full,
            image: c.image.large || '',
            role: c.role || 'Unknown',
        })) || [],
    }
}

export function getTitle(media: AniListMedia): string {
    return media.title.english || media.title.romaji || media.title.native || ''
}