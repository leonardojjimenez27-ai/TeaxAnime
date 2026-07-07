// src/lib/anime/auto-grouping.ts

// ============================================================
// SISTEMA AUTOMÁTICO DE AGRUPACIÓN DE TEMPORADAS
// ============================================================

/**
 * Detecta automáticamente todas las familias de animes basado en los tokens existentes
 */
export function detectAnimeFamilies(tokens: Record<string, Record<number, string>>): Record<string, {
    mainId: number;
    name: string;
    aliases: string[];
}> {
    const families: Record<string, {
        mainId: number;
        name: string;
        aliases: string[];
    }> = {};

    // 1. Agrupar slugs por nombre base
    const groups: Record<string, { slugs: string[]; episodes: Record<number, string> }> = {};

    for (const [slug, episodes] of Object.entries(tokens)) {
        // Extraer el nombre base (eliminar números, "season", "part", etc.)
        const baseName = getBaseName(slug);
        if (!groups[baseName]) {
            groups[baseName] = { slugs: [], episodes: {} };
        }
        groups[baseName].slugs.push(slug);
        for (const [ep, url] of Object.entries(episodes)) {
            groups[baseName].episodes[Number(ep)] = url;
        }
    }

    // 2. Crear una familia por cada grupo
    for (const [baseName, group] of Object.entries(groups)) {
        // Si hay múltiples slugs, ordenarlos
        const sortedSlugs = group.slugs.sort((a, b) => {
            const numA = extractNumber(a);
            const numB = extractNumber(b);
            return numA - numB;
        });

        // Determinar si es una serie con temporadas separadas
        const hasMultipleSeasons = sortedSlugs.some(s => extractNumber(s) > 0);
        const isSeasonGroup = sortedSlugs.length > 1 && hasMultipleSeasons;

        if (isSeasonGroup) {
            // Crear una familia para cada temporada
            for (let i = 0; i < sortedSlugs.length; i++) {
                const slug = sortedSlugs[i];
                const seasonNum = extractNumber(slug);
                const displayNum = seasonNum > 0 ? seasonNum : i + 1;
                const familyKey = displayNum === 1 ? baseName : `${baseName}-season-${displayNum}`;
                
                families[familyKey] = {
                    mainId: 0,
                    name: displayNum === 1 ? formatName(baseName) : `${formatName(baseName)} Season ${displayNum}`,
                    aliases: [slug],
                };
            }
        } else {
            // Una sola temporada o serie independiente
            const mainSlug = sortedSlugs[0] || baseName;
            families[baseName] = {
                mainId: 0,
                name: formatName(baseName),
                aliases: [mainSlug],
            };
        }
    }

    return families;
}

/**
 * Extrae el nombre base de un slug (versión mejorada)
 * Detecta correctamente temporadas como "jujutsu-kaisen-2"
 */
export function getBaseName(slug: string): string {
    // Primero, intentar detectar si es una temporada con -2, -3, etc.
    const seasonMatch = slug.match(/^(.*?)-(\d+)$/);
    if (seasonMatch) {
        // Si el número es > 0, es una temporada
        const base = seasonMatch[1];
        const num = parseInt(seasonMatch[2]);
        if (num > 0) {
            return base;
        }
    }
    
    // Detectar season-X, part-X, cour-X
    const specialMatch = slug.match(/^(.*?)-(?:season|part|cour)-(\d+)$/);
    if (specialMatch) {
        return specialMatch[1];
    }
    
    // Si no, devolver el slug original (sin modificaciones)
    return slug;
}

/**
 * Extrae el número de temporada de un slug (versión mejorada)
 */
function extractSeasonNumber(slug: string): number {
    // Detectar -2, -3, etc.
    const match = slug.match(/-(\d+)$/);
    if (match) {
        const num = parseInt(match[1]);
        if (num > 0) return num;
    }
    
    // Detectar season-X, part-X, cour-X
    const specialMatch = slug.match(/-(?:season|part|cour)-(\d+)$/);
    if (specialMatch) {
        return parseInt(specialMatch[1]);
    }
    
    return 0;
}

/**
 * Formatea un nombre base para mostrar
 */
function formatName(baseName: string): string {
    return baseName
        .replace(/-/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Verifica si dos slugs pertenecen a la misma serie
 */
export function areRelatedSlugs(slug1: string, slug2: string): boolean {
    const base1 = getBaseName(slug1);
    const base2 = getBaseName(slug2);
    return base1 === base2;
}

/**
 * Obtiene todos los slugs de una serie
 */
export function getRelatedSlugs(tokens: Record<string, Record<number, string>>, slug: string): string[] {
    const baseName = getBaseName(slug);
    return Object.keys(tokens).filter(s => getBaseName(s) === baseName);
}

/**
 * Combina todos los episodios de una serie
 */
export function combineSeriesEpisodes(tokens: Record<string, Record<number, string>>, baseName: string): Record<number, string> {
    const allEpisodes: Record<number, string> = {};
    let counter = 1;
    
    const relatedSlugs = Object.keys(tokens).filter(s => getBaseName(s) === baseName);
    const sortedSlugs = relatedSlugs.sort((a, b) => extractNumber(a) - extractNumber(b));
    
    for (const slug of sortedSlugs) {
        const episodes = tokens[slug];
        const sortedEps = Object.keys(episodes).map(Number).sort((a, b) => a - b);
        for (const ep of sortedEps) {
            allEpisodes[counter] = episodes[ep];
            counter++;
        }
    }
    
    return allEpisodes;
}