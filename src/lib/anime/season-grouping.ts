// src/lib/anime/season-grouping.ts

// ============================================================
// SISTEMA DE AGRUPACIÓN DE TEMPORADAS
// ============================================================

import { 
    findCorrectSlug, 
    getCombinedEpisodes, 
    normalizeTitle, 
    generateSlug, 
    detectSeasonNumber,
    ANILIST_ID_TO_SLUG
} from './title-matcher';

// Mapeo de nombres de animes a su "familia" (grupo de temporadas)
export const ANIME_FAMILIES: Record<string, { mainId: number; name: string; aliases: string[] }> = {
    // ============================================================
    // MUSHOKU TENSEI - AGRUPADO POR TEMPORADAS REALES
    // ============================================================
    'mushoku-tensei': {
        mainId: 108465,
        name: 'Mushoku Tensei',
        aliases: [
            'mushoku-tensei-isekai-ittara-honki-dasu',
            'mushoku-tensei-isekai-ittara-honki-dasu-part-2',
            'Mushoku Tensei: Jobless Reincarnation',
            'Mushoku Tensei: Jobless Reincarnation Season 1',
        ]
    },
    'mushoku-tensei-season-2': {
        mainId: 146065,
        name: 'Mushoku Tensei Season 2',
        aliases: [
            'mushoku-tensei-ii-isekai-ittara-honki-dasu',
            'mushoku-tensei-ii-isekai-ittara-honki-dasu-part-2',
            'Mushoku Tensei: Jobless Reincarnation Season 2',
            'Mushoku Tensei Season 2',
        ]
    },
    'mushoku-tensei-season-3': {
        mainId: 178789,
        name: 'Mushoku Tensei Season 3',
        aliases: [
            'mushoku-tensei-isekai-ittara-honki-dasu-3',
            'Mushoku Tensei: Jobless Reincarnation Season 3',
            'Mushoku Tensei Season 3',
        ]
    },
    // ============================================================
    // JUJUTSU KAISEN
    // ============================================================
    'jujutsu-kaisen': {
        mainId: 48549,
        name: 'Jujutsu Kaisen',
        aliases: [
            'Jujutsu Kaisen',
            'jujutsu-kaisen',
        ]
    },
    'jujutsu-kaisen-2': {
        mainId: 145064,
        name: 'Jujutsu Kaisen Season 2',
        aliases: [
            'Jujutsu Kaisen 2nd Season',
            'jujutsu-kaisen-2',
        ]
    },
    // ============================================================
    // ATTACK ON TITAN
    // ============================================================
    'attack-on-titan': {
        mainId: 16498,
        name: 'Attack on Titan',
        aliases: [
            'Attack on Titan',
            'Shingeki no Kyojin',
            'Attack on Titan Season 2',
            'Attack on Titan Season 3',
            'Attack on Titan: The Final Season',
            'shingeki-no-kyojin',
            'shingeki-no-kyojin-2',
            'shingeki-no-kyojin-3',
            'shingeki-no-kyojin-the-final-season',
            'attack-on-titan',
            'attack-on-titan-2',
            'attack-on-titan-3',
            'attack-on-titan-the-final-season',
        ]
    },
    // ============================================================
    // ONE PIECE
    // ============================================================
    'one-piece': {
        mainId: 21,
        name: 'One Piece',
        aliases: [
            'One Piece',
            'one-piece',
        ]
    },
    // ============================================================
    // BLEACH
    // ============================================================
    'bleach': {
        mainId: 269,
        name: 'Bleach',
        aliases: [
            'Bleach',
            'Bleach: Thousand-Year Blood War',
            'bleach',
            'bleach-sennen-kessen-hen',
        ]
    },
    // ============================================================
    // SOLO LEVELING
    // ============================================================
    'solo-leveling': {
        mainId: 151960,
        name: 'Solo Leveling',
        aliases: [
            'Solo Leveling',
            'solo-leveling',
            'ore-dake-level-up-na-ken',
        ]
    },
    'solo-leveling-season-2': {
        mainId: 176496,
        name: 'Solo Leveling Season 2',
        aliases: [
            'Solo Leveling Season 2',
            'Solo Leveling Season 2 - Arise from the Shadow',
            'solo-leveling-season-2',
            'ore-dake-level-up-na-ken-season-2-arise-from-the-shadow',
        ]
    },
    // ============================================================
    // KAIJU NO. 8
    // ============================================================
    'kaiju-no-8': {
        mainId: 158930,
        name: 'Kaiju No. 8',
        aliases: [
            'Kaiju No. 8',
            'kaiju-no-8',
            'kaijuu-8-gou',
        ]
    },
    'kaiju-no-8-season-2': {
        mainId: 160195,
        name: 'Kaiju No. 8 Season 2',
        aliases: [
            'Kaiju No. 8 Season 2',
            'kaiju-no-8-season-2',
            'kaijuu-8-gou-2',
        ]
    },
    // ============================================================
    // FULLMETAL ALCHEMIST - SEPARADO EN DOS SERIES (CASO ESPECIAL)
    // ============================================================
    'fullmetal-alchemist': {
        mainId: 121,
        name: 'Fullmetal Alchemist',
        aliases: [
            'Fullmetal Alchemist',
            'fullmetal-alchemist',
        ]
    },
    'fullmetal-alchemist-brotherhood': {
        mainId: 5114,
        name: 'Fullmetal Alchemist: Brotherhood',
        aliases: [
            'Fullmetal Alchemist Brotherhood',
            'fullmetal-alchemist-brotherhood',
        ]
    },
    // ============================================================
    // HUNTER X HUNTER - SEPARADO EN DOS SERIES (CASO ESPECIAL)
    // ============================================================
    'hunter-x-hunter-1999': {
        mainId: 1,
        name: 'Hunter x Hunter (1999)',
        aliases: [
            'Hunter x Hunter',
            'Hunter x Hunter (1999)',
            'hunter-x-hunter',
        ]
    },
    'hunter-x-hunter-2011': {
        mainId: 11061,
        name: 'Hunter x Hunter (2011)',
        aliases: [
            'Hunter x Hunter 2011',
            'Hunter x Hunter (2011)',
            'hunter-x-hunter-2011',
        ]
    },
    // ============================================================
    // SWORD ART ONLINE - TEMPORADAS SEPARADAS
    // ============================================================
    'sword-art-online': {
        mainId: 11757,
        name: 'Sword Art Online',
        aliases: [
            'Sword Art Online',
            'sword-art-online',
        ]
    },
    'sword-art-online-ii': {
        mainId: 2,
        name: 'Sword Art Online II',
        aliases: [
            'Sword Art Online II',
            'sword-art-online-ii',
        ]
    },
    'sword-art-online-alicization': {
        mainId: 3,
        name: 'Sword Art Online: Alicization',
        aliases: [
            'Sword Art Online: Alicization',
            'sword-art-online-alicization',
        ]
    },
    'sword-art-online-war-of-underworld': {
        mainId: 108759,
        name: 'Sword Art Online: Alicization - War of Underworld',
        aliases: [
            'Sword Art Online: Alicization - War of Underworld',
            'sword-art-online-alicization-war-of-underworld',
            'sword-art-online-alicization-war-of-underworld-2',
        ]
    },
    // ============================================================
    // ONE PUNCH MAN - CADA TEMPORADA COMO ANIME INDEPENDIENTE
    // ============================================================
    'one-punch-man': {
        mainId: 21087,
        name: 'One Punch Man',
        aliases: [
            'One Punch Man',
            'One-Punch Man',
            'one-punch-man',
        ]
    },
    'one-punch-man-2': {
        mainId: 97668,
        name: 'One Punch Man Season 2',
        aliases: [
            'One Punch Man Season 2',
            'One-Punch Man Season 2',
            'one-punch-man-2',
        ]
    },
    'one-punch-man-3': {
        mainId: 153800,
        name: 'One Punch Man Season 3',
        aliases: [
            'One Punch Man Season 3',
            'One-Punch Man Season 3',
            'one-punch-man-3',
        ]
    },
};

// ============================================================
// FUNCIONES DE LIMPIEZA Y UTILIDADES
// ============================================================

function cleanTitle(title: string): string {
    return title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}

// ============================================================
// FUNCIÓN PARA OBTENER EL NOMBRE BASE DE UN ANIME
// ============================================================

export function getBaseName(title: string): string {
    let base = title
        .replace(/season\s*\d+/i, '')
        .replace(/part\s*\d+/i, '')
        .replace(/cour\s*\d+/i, '')
        .replace(/-\s*season-\s*\d+/, '')
        .replace(/-\s*part-\s*\d+/, '')
        .replace(/-\s*cour-\s*\d+/, '')
        .trim();
    
    base = base
        .replace(/\d+(st|nd|rd|th)\s+season/i, '')
        .trim();
    
    base = base.replace(/-\d+$/, '').trim();
    base = base.replace(/-+$/, '').trim();
    
    return base || title;
}

// ============================================================
// FUNCIÓN PARA OBTENER LA FAMILIA DE UN ANIME
// ============================================================

export function getAnimeFamily(title: string): { mainId: number; name: string; aliases: string[] } | null {
    const titleLower = title.toLowerCase().trim();
    
    for (const [key, family] of Object.entries(ANIME_FAMILIES)) {
        if (family.name.toLowerCase() === titleLower) {
            return family;
        }
        for (const alias of family.aliases) {
            if (alias.toLowerCase() === titleLower || 
                titleLower.includes(alias.toLowerCase()) ||
                alias.toLowerCase().includes(titleLower)) {
                return family;
            }
        }
    }
    return null;
}

// ============================================================
// FUNCIÓN PARA AGRUPAR TOKENS POR FAMILIA
// ============================================================

export function groupTokensByFamily(tokens: Record<string, Record<number, string>>): Record<string, { 
    familyName: string;
    mainId: number;
    slugs: string[];
    episodes: Record<number, string>;
}> {
    const grouped: Record<string, {
        familyName: string;
        mainId: number;
        slugs: string[];
        episodes: Record<number, string>;
    }> = {};

    for (const [slug, episodes] of Object.entries(tokens)) {
        let foundFamily = false;
        for (const [key, family] of Object.entries(ANIME_FAMILIES)) {
            for (const alias of family.aliases) {
                const aliasSlug = cleanTitle(alias);
                if (slug === aliasSlug || slug.includes(aliasSlug) || aliasSlug.includes(slug)) {
                    if (!grouped[key]) {
                        grouped[key] = {
                            familyName: family.name,
                            mainId: family.mainId,
                            slugs: [],
                            episodes: {}
                        };
                    }
                    grouped[key].slugs.push(slug);
                    for (const [ep, url] of Object.entries(episodes)) {
                        grouped[key].episodes[Number(ep)] = url;
                    }
                    foundFamily = true;
                    break;
                }
            }
            if (foundFamily) break;
        }
        
        if (!foundFamily) {
            const familyKey = `custom-${slug}`;
            grouped[familyKey] = {
                familyName: slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                mainId: 0,
                slugs: [slug],
                episodes: { ...episodes }
            };
        }
    }

    for (const [key, group] of Object.entries(grouped)) {
        group.episodes = Object.fromEntries(
            Object.entries(group.episodes).sort((a, b) => Number(a[0]) - Number(b[0]))
        );
    }

    return grouped;
}

// ============================================================
// FUNCIÓN PARA OBTENER EPISODIOS DE UNA FAMILIA
// ============================================================

export function getFamilyEpisodes(tokens: Record<string, Record<number, string>>, title: string): Record<number, string> | null {
    const family = getAnimeFamily(title);
    if (!family) return null;

    const grouped = groupTokensByFamily(tokens);
    for (const [key, group] of Object.entries(grouped)) {
        if (group.familyName === family.name) {
            return group.episodes;
        }
    }
    return null;
}

// ============================================================
// LISTA DE ANIMES QUE NO DEBEN AGRUPARSE
// ============================================================

const noGrouping = [
    // Solo Leveling
    'solo leveling season 2',
    'solo-leveling-season-2',
    
    // Kaiju No. 8
    'kaiju no 8 season 2',
    'kaiju-no-8-season-2',
    
    // Mushoku Tensei - TEMPORADAS REALES (NO partes)
    'mushoku tensei season 2',
    'mushoku tensei season 3',
    'mushoku-tensei-season-2',
    'mushoku-tensei-season-3',
    
    // Fullmetal Alchemist - AMBAS SERIES (no agrupar)
    'fullmetal alchemist',
    'fullmetal alchemist brotherhood',
    'fullmetal-alchemist',
    'fullmetal-alchemist-brotherhood',
    
    // Hunter x Hunter - AMBAS SERIES (no agrupar)
    'hunter x hunter',
    'hunter x hunter 2011',
    'hunter-x-hunter',
    'hunter-x-hunter-2011',
    
    // Sword Art Online - SOLO LAS QUE NO SE AGRUPAN
    'sword art online',
    'sword art online ii',
    'sword art online alicization',
    'sword-art-online',
    'sword-art-online-ii',
    'sword-art-online-alicization',
    
    // One Punch Man - TODAS LAS TEMPORADAS (no agrupar)
    'one punch man',
    'one-punch man',
    'one-punch-man',
    'one punch man season 2',
    'one-punch man season 2',
    'one-punch-man-2',
    'one punch man season 3',
    'one-punch man season 3',
    'one-punch-man-3',
    
    // Jujutsu Kaisen - TEMPORADAS SEPARADAS
    'jujutsu kaisen',
    'jujutsu kaisen season 2',
    'jujutsu-kaisen',
    'jujutsu-kaisen-2',
];

// ============================================================
// FUNCIÓN PARA EXTRAER EL NÚMERO DE TEMPORADA
// ============================================================

function extractSeasonNumberLegacy(text: string): number {
    const matchSeason = text.match(/season\s*(\d+)/i);
    if (matchSeason) return parseInt(matchSeason[1]);
    const matchPart = text.match(/part\s*(\d+)/i);
    if (matchPart) return parseInt(matchPart[1]);
    const matchCour = text.match(/cour\s*(\d+)/i);
    if (matchCour) return parseInt(matchCour[1]);
    const matchNum = text.match(/-(\d+)$/);
    if (matchNum) return parseInt(matchNum[1]);
    return 0;
}

// ============================================================
// 🔥 FUNCIÓN PRINCIPAL: Obtener episodios SOLO de la temporada actual
// ============================================================

export function getEpisodesForCurrentSeason(
    tokens: Record<string, Record<number, string>>,
    title: string,
    animeId: string
): { episodes: Record<number, string>; total: number; seasonKey: string } {
    console.log(`🔍 Buscando episodios para: "${title}" (ID: ${animeId})`);
    console.log(`📋 Tokens disponibles:`, Object.keys(tokens));
    
    // ============================================================
    // 0. PRIMERO: Detectar y combinar partes automáticamente
    // ============================================================
    const combined = getCombinedEpisodes(tokens, animeId, title);
    if (combined && combined.total > 0 && combined.slugs.length > 1) {
        console.log(`✅ Usando combinación automática: ${combined.total} episodios`);
        console.log(`📂 Slugs combinados:`, combined.slugs);
        return {
            episodes: combined.episodes,
            total: combined.total,
            seasonKey: combined.slugs.join('+')
        };
    }
    
    // ============================================================
    // 1. Usar el sistema de mapeo de title-matcher
    // ============================================================
    const result = findCorrectSlug(tokens, animeId, title);
    
    if (result) {
        const episodes = tokens[result.slug];
        if (episodes) {
            const episodeNumbers = Object.keys(episodes).map(Number).sort((a, b) => a - b);
            const renumbered: Record<number, string> = {};
            let counter = 1;
            for (const num of episodeNumbers) {
                renumbered[counter] = episodes[num];
                counter++;
            }
            console.log(`✅ Encontrados ${episodeNumbers.length} episodios en "${result.slug}"`);
            return {
                episodes: renumbered,
                total: episodeNumbers.length,
                seasonKey: result.slug
            };
        }
    }
    
    // ============================================================
    // 2. Fallback: búsqueda manual por título limpio
    // ============================================================
    console.warn(`⚠️ No se encontró slug con title-matcher, intentando búsqueda manual...`);
    const clean = cleanTitle(title);
    const exactSlug = clean;
    
    if (tokens[exactSlug]) {
        const episodes = tokens[exactSlug];
        const episodeNumbers = Object.keys(episodes).map(Number).sort((a, b) => a - b);
        const renumbered: Record<number, string> = {};
        let counter = 1;
        for (const num of episodeNumbers) {
            renumbered[counter] = episodes[num];
            counter++;
        }
        console.log(`✅ Encontrados ${episodeNumbers.length} episodios en slug exacto: "${exactSlug}"`);
        return {
            episodes: renumbered,
            total: episodeNumbers.length,
            seasonKey: exactSlug
        };
    }
    
    // ============================================================
    // 3. Buscar por variantes del título
    // ============================================================
    const variants = [
        clean,
        title.toLowerCase().replace(/\s+/g, '-'),
        title.toLowerCase().replace(/\s+/g, '_'),
        title.toLowerCase().replace(/\s+/g, '').replace(/-+/g, '-'),
    ];
    
    for (const variant of variants) {
        if (tokens[variant]) {
            const episodes = tokens[variant];
            const episodeNumbers = Object.keys(episodes).map(Number).sort((a, b) => a - b);
            const renumbered: Record<number, string> = {};
            let counter = 1;
            for (const num of episodeNumbers) {
                renumbered[counter] = episodes[num];
                counter++;
            }
            console.log(`✅ Encontrados ${episodeNumbers.length} episodios en variante: "${variant}"`);
            return {
                episodes: renumbered,
                total: episodeNumbers.length,
                seasonKey: variant
            };
        }
    }
    
    // ============================================================
    // 4. Último recurso: buscar por coincidencia
    // ============================================================
    for (const [slug, episodes] of Object.entries(tokens)) {
        if (slug.includes(clean) || clean.includes(slug)) {
            const episodeNumbers = Object.keys(episodes).map(Number).sort((a, b) => a - b);
            const renumbered: Record<number, string> = {};
            let counter = 1;
            for (const num of episodeNumbers) {
                renumbered[counter] = episodes[num];
                counter++;
            }
            console.log(`✅ Encontrados ${episodeNumbers.length} episodios por coincidencia: "${slug}"`);
            return {
                episodes: renumbered,
                total: episodeNumbers.length,
                seasonKey: slug
            };
        }
    }
    
    console.warn(`❌ No se encontraron episodios para "${title}"`);
    console.log(`💡 Sugerencia: Agrega el slug "${clean}" a ANILIST_ID_TO_SLUG en title-matcher.ts`);
    return {
        episodes: {},
        total: 0,
        seasonKey: ''
    };
}

// ============================================================
// FUNCIÓN PARA DETECTAR SI UN ANIME DEBE USAR AGRUPACIÓN
// ============================================================

export function shouldUseGrouping(title: string): boolean {
    const titleLower = title.toLowerCase().trim();
    
    // 🔥 FORZAR AGRUPACIÓN PARA WAR OF UNDERWORLD (SIEMPRE AGRUPAR)
    if (titleLower.includes('war of underworld') || titleLower.includes('war-of-underworld')) {
        console.log(`🔥 Forzando agrupación para: "${title}"`);
        return true;
    }
    
    const shouldGroup = !noGrouping.some(item => 
        titleLower.includes(item) || item.includes(titleLower)
    );
    
    return shouldGroup;
}

// ============================================================
// 🔥 FUNCIÓN UNIVERSAL PARA RENUMERAR EPISODIOS
// ============================================================

export function getAllFamilyEpisodesRenumbered(
    tokens: Record<string, Record<number, string>>,
    title: string
): { episodes: Record<number, string>; total: number; slugs: string[] } {
    const allEpisodes: Record<number, string> = {};
    let episodeCounter = 1;
    const usedSlugs: string[] = [];
    
    console.log(`🔍 Renumerando episodios para "${title}"...`);
    
    const titleLower = title.toLowerCase().trim();
    
    // ============================================================
    // 🔥 CASOS ESPECIALES - SIEMPRE AGRUPAR
    // ============================================================
    
    // 🔥 WAR OF UNDERWORLD - SIEMPRE AGRUPAR (PARTE 1 + PARTE 2)
    if (titleLower.includes('war of underworld') || titleLower.includes('war-of-underworld')) {
        console.log(`🔥 War of Underworld detectado: agrupando todas las partes...`);
        
        const relatedSlugs = Object.keys(tokens).filter(slug => 
            slug.includes('war-of-underworld') || slug.includes('war-of-underworld-2')
        );
        
        console.log(`📂 Slugs relacionados:`, relatedSlugs);
        
        for (const slug of relatedSlugs) {
            if (tokens[slug]) {
                const episodes = tokens[slug];
                const episodeNumbers = Object.keys(episodes).map(Number).sort((a, b) => a - b);
                console.log(`📺 "${slug}": ${episodeNumbers.length} episodios (${episodeNumbers.join(', ')})`);
                
                for (const epNum of episodeNumbers) {
                    allEpisodes[episodeCounter] = episodes[epNum];
                    console.log(`   Episodio ${epNum} → ${episodeCounter}`);
                    episodeCounter++;
                }
                usedSlugs.push(slug);
            }
        }
        
        if (Object.keys(allEpisodes).length > 0) {
            console.log(`✅ War of Underworld: ${Object.keys(allEpisodes).length} episodios totales`);
            return {
                episodes: allEpisodes,
                total: Object.keys(allEpisodes).length,
                slugs: usedSlugs
            };
        }
    }
    
    // 🔥 SI ES MUSHOKU TENSEI, NO RENUMERAR (USAR FAMILIAS)
    if (titleLower.includes('mushoku tensei') || titleLower.includes('mushoku-tensei')) {
        console.log(`⚠️ Mushoku Tensei detectado: usando familias separadas`);
        
        const family = getAnimeFamily(title);
        if (family) {
            const grouped = groupTokensByFamily(tokens);
            for (const [key, group] of Object.entries(grouped)) {
                if (group.familyName === family.name) {
                    const episodes = group.episodes;
                    const episodeNumbers = Object.keys(episodes).map(Number).sort((a, b) => a - b);
                    for (const epNum of episodeNumbers) {
                        allEpisodes[episodeCounter] = episodes[epNum];
                        episodeCounter++;
                    }
                    usedSlugs.push(...group.slugs);
                    console.log(`📺 Usando familia "${family.name}": ${episodeNumbers.length} episodios`);
                    console.log(`📊 Episodios: ${episodeNumbers.join(', ')}`);
                    break;
                }
            }
        } else {
            const clean = cleanTitle(title);
            if (tokens[clean]) {
                const episodes = tokens[clean];
                const episodeNumbers = Object.keys(episodes).map(Number).sort((a, b) => a - b);
                for (const epNum of episodeNumbers) {
                    allEpisodes[episodeCounter] = episodes[epNum];
                    episodeCounter++;
                }
                usedSlugs.push(clean);
                console.log(`📺 Usando "${clean}": ${episodeNumbers.length} episodios`);
            }
        }
        return {
            episodes: allEpisodes,
            total: Object.keys(allEpisodes).length,
            slugs: usedSlugs
        };
    }
    
    const shouldGroup = !noGrouping.some(item => 
        titleLower.includes(item) || item.includes(titleLower)
    );
    
    if (!shouldGroup) {
        console.log(`⚠️ Agrupación desactivada para "${title}"`);
        const clean = cleanTitle(title);
        if (tokens[clean]) {
            const episodes = tokens[clean];
            const episodeNumbers = Object.keys(episodes).map(Number).sort((a, b) => a - b);
            for (const epNum of episodeNumbers) {
                allEpisodes[episodeCounter] = episodes[epNum];
                episodeCounter++;
            }
            usedSlugs.push(clean);
            console.log(`📺 Usando solo "${clean}": ${episodeNumbers.length} episodios`);
        }
        return {
            episodes: allEpisodes,
            total: Object.keys(allEpisodes).length,
            slugs: usedSlugs
        };
    }
    
    // 1. Buscar la familia del anime (solo si debe agruparse)
    const family = getAnimeFamily(title);
    
    if (family) {
        console.log(`📂 Familia encontrada: "${family.name}"`);
        
        const familySlugs: string[] = [];
        const grouped = groupTokensByFamily(tokens);
        
        for (const [key, group] of Object.entries(grouped)) {
            if (group.familyName === family.name) {
                familySlugs.push(...group.slugs);
                break;
            }
        }
        
        const sortedSlugs = familySlugs.sort((a, b) => {
            const numA = parseInt(a.match(/-(\d+)$/)?.[1] || '0');
            const numB = parseInt(b.match(/-(\d+)$/)?.[1] || '0');
            if (numA > 0 && numB > 0) return numA - numB;
            if (numA > 0) return 1;
            if (numB > 0) return -1;
            return a.localeCompare(b);
        });
        
        console.log(`📂 Slugs de la familia:`, sortedSlugs);
        
        for (const slug of sortedSlugs) {
            if (tokens[slug]) {
                const episodes = tokens[slug];
                const episodeNumbers = Object.keys(episodes).map(Number).sort((a, b) => a - b);
                
                if (episodeNumbers.length > 0) {
                    console.log(`📺 "${slug}": ${episodeNumbers.length} episodios`);
                    usedSlugs.push(slug);
                    
                    for (const epNum of episodeNumbers) {
                        allEpisodes[episodeCounter] = episodes[epNum];
                        episodeCounter++;
                    }
                }
            }
        }
    } else {
        console.log(`⚠️ No se encontró familia para "${title}", buscando por coincidencia...`);
        
        const clean = cleanTitle(title);
        const searchTerms = [
            clean,
            title.toLowerCase().replace(/\s+/g, '-'),
            title.toLowerCase().replace(/\s+/g, '_'),
        ];
        
        const matchingSlugs: string[] = [];
        
        for (const term of searchTerms) {
            for (const [slug, episodes] of Object.entries(tokens)) {
                if ((slug.includes(term) || term.includes(slug)) && !matchingSlugs.includes(slug)) {
                    if (Object.keys(episodes).length > 0) {
                        matchingSlugs.push(slug);
                        console.log(`📺 Encontrado "${slug}" (coincidencia)`);
                    }
                }
            }
        }
        
        matchingSlugs.sort((a, b) => {
            const numA = parseInt(a.match(/-(\d+)$/)?.[1] || '0');
            const numB = parseInt(b.match(/-(\d+)$/)?.[1] || '0');
            return numA - numB || a.localeCompare(b);
        });
        
        for (const slug of matchingSlugs) {
            if (tokens[slug]) {
                const episodes = tokens[slug];
                const episodeNumbers = Object.keys(episodes).map(Number).sort((a, b) => a - b);
                
                if (episodeNumbers.length > 0) {
                    console.log(`📺 "${slug}": ${episodeNumbers.length} episodios`);
                    usedSlugs.push(slug);
                    
                    for (const epNum of episodeNumbers) {
                        allEpisodes[episodeCounter] = episodes[epNum];
                        episodeCounter++;
                    }
                }
            }
        }
    }
    
    console.log(`📊 Total de episodios renumerados: ${Object.keys(allEpisodes).length}`);
    return {
        episodes: allEpisodes,
        total: Object.keys(allEpisodes).length,
        slugs: usedSlugs
    };
}

// ============================================================
// FUNCIÓN ESPECIAL PARA MUSHOKU (mantener compatibilidad)
// ============================================================

export function getAllMushokuEpisodes(tokens: Record<string, Record<number, string>>): Record<number, string> {
    const allEpisodes: Record<number, string> = {};
    let counter = 1;
    
    const mushokuSlugs = Object.keys(tokens)
        .filter(slug => slug.includes('mushoku'))
        .sort();
    
    for (const slug of mushokuSlugs) {
        const episodes = tokens[slug];
        const nums = Object.keys(episodes).map(Number).sort((a, b) => a - b);
        for (const num of nums) {
            allEpisodes[counter] = episodes[num];
            counter++;
        }
    }
    
    return allEpisodes;
}

// ============================================================
// FUNCIÓN PARA DETECTAR FAMILIAS DESDE TOKENS
// ============================================================

function detectSeasonFamilies(tokens: Record<string, Record<number, string>>): Record<string, { 
    mainId: number; 
    name: string; 
    aliases: string[] 
}> {
    const families: Record<string, { mainId: number; name: string; aliases: string[] }> = {};
    
    // Agrupar tokens por nombre base
    const tokenGroups: Record<string, { 
        slugs: string[]; 
        episodes: Record<number, string>;
        seasonNumbers: number[];
    }> = {};
    
    for (const [slug, episodes] of Object.entries(tokens)) {
        // Intentar extraer el nombre base
        const baseName = getBaseName(slug.replace(/-/g, ' '));
        const key = baseName.toLowerCase().replace(/\s+/g, '-');
        
        if (!tokenGroups[key]) {
            tokenGroups[key] = { slugs: [], episodes: {}, seasonNumbers: [] };
        }
        tokenGroups[key].slugs.push(slug);
        tokenGroups[key].seasonNumbers.push(extractSeasonNumberLegacy(slug));
        for (const [ep, url] of Object.entries(episodes)) {
            tokenGroups[key].episodes[Number(ep)] = url;
        }
    }
    
    // Para cada grupo, determinar si debe separarse
    for (const [key, group] of Object.entries(tokenGroups)) {
        // Si hay múltiples slugs con diferentes números de temporada, separar
        const uniqueSeasons = [...new Set(group.seasonNumbers)].sort((a, b) => a - b);
        
        if (uniqueSeasons.length > 1) {
            // Múltiples temporadas -> crear una familia por temporada
            const baseName = key.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            
            for (const seasonNum of uniqueSeasons) {
                // Encontrar los slugs que corresponden a esta temporada
                const seasonSlugs = group.slugs.filter(s => extractSeasonNumberLegacy(s) === seasonNum);
                const familyKey = seasonNum === 1 ? key : `${key}-season-${seasonNum}`;
                
                // Buscar el ID de AniList si existe
                let mainId = 0;
                for (const slug of seasonSlugs) {
                    for (const [existingKey, existingFamily] of Object.entries(ANIME_FAMILIES)) {
                        if (existingFamily.aliases.some(a => cleanTitle(a) === slug)) {
                            mainId = existingFamily.mainId;
                            break;
                        }
                    }
                    if (mainId > 0) break;
                }
                
                families[familyKey] = {
                    mainId: mainId,
                    name: getSeasonDisplayName(baseName, seasonNum),
                    aliases: seasonSlugs
                };
            }
        } else if (group.slugs.length === 1) {
            // Un solo slug -> familia normal
            const slug = group.slugs[0];
            const baseName = key.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            
            let mainId = 0;
            for (const [existingKey, existingFamily] of Object.entries(ANIME_FAMILIES)) {
                if (existingFamily.aliases.some(a => cleanTitle(a) === slug)) {
                    mainId = existingFamily.mainId;
                    break;
                }
            }
            
            families[key] = {
                mainId: mainId,
                name: baseName,
                aliases: [slug]
            };
        }
    }
    
    return families;
}

// ============================================================
// FUNCIÓN AUXILIAR PARA OBTENER NOMBRE DE TEMPORADA
// ============================================================

function getSeasonDisplayName(baseName: string, seasonNumber: number): string {
    if (seasonNumber === 1) {
        return baseName;
    }
    return `${baseName} Season ${seasonNumber}`;
}

// ============================================================
// FUNCIÓN PARA ACTUALIZAR FAMILIAS DESDE TOKENS
// ============================================================

export function updateFamiliesFromTokens(): void {
    if (typeof window === 'undefined') return;
    
    try {
        const tokens = JSON.parse(localStorage.getItem('blogger_tokens') || '{}');
        if (Object.keys(tokens).length === 0) return;
        
        // Detectar nuevas familias basadas en los tokens
        const detected = detectSeasonFamilies(tokens);
        
        // Fusionar con las familias existentes
        for (const [key, family] of Object.entries(detected)) {
            if (!ANIME_FAMILIES[key]) {
                ANIME_FAMILIES[key] = family;
                console.log(`✅ Familia automática creada: "${family.name}" (${family.aliases.join(', ')})`);
            }
        }
    } catch (e) {
        console.error('Error actualizando familias desde tokens:', e);
    }
}

// ============================================================
// FUNCIÓN PARA OBTENER ID PRINCIPAL DE UN ANIME
// ============================================================

export function getMainAnimeId(title: string): number | null {
    const family = getAnimeFamily(title);
    if (family) {
        return family.mainId;
    }
    return null;
}