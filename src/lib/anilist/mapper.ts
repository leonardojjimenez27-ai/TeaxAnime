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

// ============================================================
// 🔥 FUNCIÓN SEGURA PARA OBTENER coverImage
// ============================================================

function getCoverImage(media: any): { extraLarge: string; large: string; medium: string } {
    // Si coverImage existe, usarlo
    if (media.coverImage) {
        return {
            extraLarge: media.coverImage.extraLarge || media.coverImage.large || '',
            large: media.coverImage.large || media.coverImage.medium || '',
            medium: media.coverImage.medium || ''
        }
    }
    
    // Si no existe, usar valores por defecto
    return {
        extraLarge: '',
        large: '',
        medium: ''
    }
}

// ============================================================
// FUNCIÓN SEGURA PARA OBTENER TÍTULO
// ============================================================

function getSafeTitle(media: any): string {
    if (!media.title) return 'Sin título'
    return media.title.english || media.title.romaji || media.title.native || 'Sin título'
}

// ============================================================
// MAPPER PRINCIPAL (CON VALORES POR DEFECTO)
// ============================================================

export function mapToAnimeResult(media: AniListMedia): AnimeResult {
    // Si media es undefined o null, devolver un objeto vacío seguro
    if (!media) {
        console.warn('⚠️ media es undefined en mapToAnimeResult')
        return {
            id: 0,
            title: 'Sin título',
            image: '',
            cover: '',
            episodes: 0,
            genres: [],
            rating: 0,
            year: 0,
            color: undefined,
            bannerImage: '',
            averageScore: 0,
            popularity: 0,
            favourites: 0,
            status: 'UNKNOWN',
            format: 'TV',
            duration: 0,
            description: null,
        }
    }

    const coverImage = getCoverImage(media)
    const title = getSafeTitle(media)
    
    return {
        id: media.id || 0,
        title: title,
        image: coverImage.extraLarge || coverImage.large || '',
        cover: media.bannerImage || coverImage.large || undefined,
        episodes: media.episodes || 0,
        genres: media.genres || [],
        rating: media.averageScore ? media.averageScore / 10 : 0,
        year: media.seasonYear || 0,
        color: media.coverImage?.color || undefined,
        bannerImage: media.bannerImage || coverImage.large || '',
        averageScore: media.averageScore || 0,
        popularity: media.popularity || 0,
        favourites: media.favourites || 0,
        status: media.status || 'UNKNOWN',
        format: media.format || 'TV',
        duration: media.duration || 0,
        description: getSpanishDescription(media),
    }
}

export function mapToAnimeInfo(media: AniListMedia): AnimeInfo {
    // Si media es undefined o null, devolver un objeto vacío seguro
    if (!media) {
        console.warn('⚠️ media es undefined en mapToAnimeInfo')
        return {
            id: 0,
            title: 'Sin título',
            image: '',
            cover: '',
            episodes: 0,
            genres: [],
            rating: 0,
            year: 0,
            color: undefined,
            bannerImage: '',
            averageScore: 0,
            popularity: 0,
            favourites: 0,
            status: 'UNKNOWN',
            format: 'TV',
            duration: 0,
            description: null,
            studios: [],
            characters: [],
        }
    }

    const result = mapToAnimeResult(media)
    
    // Obtener estudios de forma segura
    const studios = media.studios?.nodes?.map((s: any) => s.name) || []
    
    // Obtener personajes de forma segura
    const characters = media.characters?.nodes?.map((c: any): Character => ({
        id: c.id || 0,
        name: c.name?.full || 'Desconocido',
        image: c.image?.large || '',
        role: c.role || 'Unknown',
    })) || []
    
    return {
        ...result,
        description: getSpanishDescription(media) || result.description,
        studios: studios,
        characters: characters,
    }
}

export function getTitle(media: AniListMedia): string {
    if (!media || !media.title) return 'Sin título'
    return media.title.english || media.title.romaji || media.title.native || 'Sin título'
}