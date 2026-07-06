// src/lib/anime/token-manager.ts

// ============================================================
// SISTEMA AUTOMÁTICO DE GESTIÓN DE TOKENS POR TEMPORADA
// ============================================================

/**
 * Detecta si un token debe ser separado por temporadas
 */
export function shouldSeparateTokens(slug: string): boolean {
    // Palabras clave que indican temporadas separadas
    const seasonIndicators = [
        'season', 'part', 'cour', 'final',
        'shimetsu', 'kaiyuu', 'zenpen', 'kouhen',
        'arise', 'shadow', 'blood', 'war',
        'shippuden', 'tybw', 'sennen', 'kessen',
    ];
    
    const slugLower = slug.toLowerCase();
    for (const indicator of seasonIndicators) {
        if (slugLower.includes(indicator)) {
            return true;
        }
    }
    
    // Detectar números al final del slug (ej: anime-2, anime-3)
    if (slugLower.match(/-\d+$/)) {
        return true;
    }
    
    return false;
}

/**
 * Genera un slug único para una temporada
 */
export function generateSeasonSlug(baseSlug: string, seasonNumber: number): string {
    if (seasonNumber === 1) {
        return baseSlug;
    }
    return `${baseSlug}-season-${seasonNumber}`;
}

/**
 * Extrae el número de temporada del título o slug
 */
export function extractSeasonNumber(text: string): number {
    // Buscar "Season X"
    const match = text.match(/season\s*(\d+)/i);
    if (match) {
        return parseInt(match[1]);
    }
    
    // Buscar "Part X"
    const matchPart = text.match(/part\s*(\d+)/i);
    if (matchPart) {
        return parseInt(matchPart[1]);
    }
    
    // Buscar "Cour X"
    const matchCour = text.match(/cour\s*(\d+)/i);
    if (matchCour) {
        return parseInt(matchCour[1]);
    }
    
    // Buscar número al final (ej: anime-2, anime-3)
    const matchNum = text.match(/-(\d+)$/);
    if (matchNum) {
        return parseInt(matchNum[1]);
    }
    
    return 1;
}

/**
 * Obtiene el nombre base del anime (sin número de temporada)
 */
export function getBaseAnimeName(title: string): string {
    // Eliminar "Season X", "Part X", "Cour X"
    let base = title
        .replace(/season\s*\d+/i, '')
        .replace(/part\s*\d+/i, '')
        .replace(/cour\s*\d+/i, '')
        .replace(/-\s*season-\s*\d+/, '')
        .replace(/-\s*part-\s*\d+/, '')
        .replace(/-\s*cour-\s*\d+/, '')
        .trim();
    
    // Eliminar "2nd Season", "3rd Season", etc.
    base = base
        .replace(/\d+(st|nd|rd|th)\s+season/i, '')
        .trim();
    
    // Eliminar números al final (ej: "anime-2" -> "anime")
    base = base.replace(/-\d+$/, '').trim();
    
    // Eliminar guiones al final
    base = base.replace(/-+$/, '').trim();
    
    return base || title;
}

/**
 * Obtiene el nombre completo de la temporada
 */
export function getSeasonDisplayName(baseName: string, seasonNumber: number): string {
    if (seasonNumber === 1) {
        return baseName;
    }
    return `${baseName} Season ${seasonNumber}`;
}