// src/lib/anime/title-matcher.ts

// ============================================================
// SISTEMA UNIVERSAL DE MAPEO DE TÍTULOS
// ============================================================

/**
 * Normaliza un título para comparación (elimina acentos, símbolos, etc.)
 */
export function normalizeTitle(title: string): string {
    return title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Elimina acentos
        .replace(/[^a-z0-9\s]/g, ' ') // Reemplaza símbolos por espacios
        .replace(/\s+/g, ' ') // Espacios múltiples a uno solo
        .trim();
}

/**
 * Genera un slug consistente desde cualquier título
 */
export function generateSlug(title: string): string {
    return normalizeTitle(title)
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}

/**
 * Detecta el número de temporada en un título
 */
export function detectSeasonNumber(title: string): number {
    const patterns = [
        /season\s*(\d+)/i,
        /temporada\s*(\d+)/i,
        /part\s*(\d+)/i,
        /parte\s*(\d+)/i,
        /cour\s*(\d+)/i,
        /(\d+)(?:st|nd|rd|th)?\s*(?:season|temporada)/i,
        /-(\d+)$/,
        /\((\d+)\)/,
    ];
    
    for (const pattern of patterns) {
        const match = title.match(pattern);
        if (match) {
            return parseInt(match[1]);
        }
    }
    return 0;
}

/**
 * Elimina el número de temporada de un título
 */
export function removeSeasonNumber(title: string): string {
    return title
        .replace(/season\s*\d+/i, '')
        .replace(/temporada\s*\d+/i, '')
        .replace(/part\s*\d+/i, '')
        .replace(/parte\s*\d+/i, '')
        .replace(/cour\s*\d+/i, '')
        .replace(/\d+(?:st|nd|rd|th)?\s*(?:season|temporada)/i, '')
        .replace(/-\d+$/, '')
        .replace(/\(\d+\)$/, '')
        .trim();
}

// ============================================================
// MAPEO MANUAL DE TÍTULOS (CASOS ESPECIALES)
// ============================================================

export const TITLE_MAPPINGS: Record<string, string> = {
    // Español → Inglés
    'ataque a los titanes': 'attack on titan',
    'shingeki no kyojin': 'attack on titan',
    'jujutsu kaisen': 'jujutsu kaisen',
    'mushoku tensei': 'mushoku tensei jobless reincarnation',
    'solo leveling': 'solo leveling',
    'kaiju no 8': 'kaiju no 8',
    'one punch man': 'one punch man',
    'fullmetal alchemist': 'fullmetal alchemist',
    'fullmetal alchemist brotherhood': 'fullmetal alchemist brotherhood',
    'fullmetal alquimista': 'fullmetal alchemist',
    'fullmetal alquimista brotherhood': 'fullmetal alchemist brotherhood',
    'boku no hero academia': 'my hero academia',
    'my hero academia': 'my hero academia',
    'blue lock': 'blue lock',
    'black clover': 'black clover',
    'chainsaw man': 'chainsaw man',
    'death note': 'death note',
    'tokyo ghoul': 'tokyo ghoul',
    'spy x family': 'spy x family',
    'sword art online': 'sword art online',
    'hunter x hunter': 'hunter x hunter',
    'bleach': 'bleach',
    'one piece': 'one piece',
    'naruto': 'naruto',
    'naruto shippuden': 'naruto shippuden',
    'dragon ball': 'dragon ball',
    'dragon ball z': 'dragon ball z',
    'dragon ball gt': 'dragon ball gt',
    'dragon ball super': 'dragon ball super',
    'dragon ball daima': 'dragon ball daima',
    'dragon ball heroes': 'dragon ball heroes',
    'fairy tail': 'fairy tail',
    'demon slayer': 'demon slayer',
    'kimetsu no yaiba': 'demon slayer',
};

export function getNormalizedTitle(title: string, forAniList: boolean = false): string {
    let normalized = title.toLowerCase().trim();
    
    if (TITLE_MAPPINGS[normalized]) {
        normalized = TITLE_MAPPINGS[normalized];
    }
    
    if (forAniList) {
        for (const [key, value] of Object.entries(TITLE_MAPPINGS)) {
            if (normalized.includes(key) || key.includes(normalized)) {
                normalized = value;
                break;
            }
        }
    }
    
    return normalized;
}

// ============================================================
// MAPEO DE ANILIST ID → SLUG DE VERANIMEONLINE
// ============================================================

export const ANILIST_ID_TO_SLUG: Record<string, { 
    slug: string; 
    season: number; 
    totalEpisodes: number; 
    title: string;
}> = {
    // ============================================================
    // JUJUTSU KAISEN
    // ============================================================
    '48549': { 
        slug: 'jujutsu-kaisen', 
        season: 1, 
        totalEpisodes: 24,
        title: 'Jujutsu Kaisen'
    },
    '145064': { 
        slug: 'jujutsu-kaisen-2', 
        season: 2, 
        totalEpisodes: 23,
        title: 'Jujutsu Kaisen Season 2'
    },
    
    // ============================================================
    // ONE PIECE
    // ============================================================
    '21': { 
        slug: 'one-piece', 
        season: 1, 
        totalEpisodes: 1122,
        title: 'One Piece'
    },
    
    // ============================================================
    // BLEACH
    // ============================================================
    '269': { 
        slug: 'bleach', 
        season: 1, 
        totalEpisodes: 366,
        title: 'Bleach'
    },
    
    // ============================================================
    // MUSHOKU TENSEI
    // ============================================================
    '108465': { 
        slug: 'mushoku-tensei-isekai-ittara-honki-dasu', 
        season: 1, 
        totalEpisodes: 23,
        title: 'Mushoku Tensei'
    },
    '146065': { 
        slug: 'mushoku-tensei-ii-isekai-ittara-honki-dasu', 
        season: 2, 
        totalEpisodes: 24,
        title: 'Mushoku Tensei Season 2'
    },
    '178789': { 
        slug: 'mushoku-tensei-isekai-ittara-honki-dasu-3', 
        season: 3, 
        totalEpisodes: 2,
        title: 'Mushoku Tensei Season 3'
    },
    
    // ============================================================
    // DEATH NOTE
    // ============================================================
    '1535': { 
        slug: 'death-note', 
        season: 1, 
        totalEpisodes: 37,
        title: 'Death Note'
    },
    
    // ============================================================
    // TOKYO GHOUL
    // ============================================================
    '22319': { 
        slug: 'tokyo-ghoul', 
        season: 1, 
        totalEpisodes: 12,
        title: 'Tokyo Ghoul'
    },
    '22319_T2': { 
        slug: 'tokyo-ghoul-2', 
        season: 2, 
        totalEpisodes: 12,
        title: 'Tokyo Ghoul Season 2'
    },
    
    // ============================================================
    // CHAINSAW MAN
    // ============================================================
    '127230': { 
        slug: 'chainsaw-man', 
        season: 1, 
        totalEpisodes: 12,
        title: 'Chainsaw Man'
    },
    
    // ============================================================
    // SPY X FAMILY
    // ============================================================
    '130003': { 
        slug: 'spy-x-family', 
        season: 1, 
        totalEpisodes: 25,
        title: 'Spy x Family'
    },
    '142414': { 
        slug: 'spy-x-family-2', 
        season: 2, 
        totalEpisodes: 12,
        title: 'Spy x Family Season 2'
    },
    '153337': { 
        slug: 'spy-x-family-3', 
        season: 3, 
        totalEpisodes: 13,
        title: 'Spy x Family Season 3'
    },
    
    // ============================================================
    // SOLO LEVELING
    // ============================================================
    '151960': { 
        slug: 'solo-leveling', 
        season: 1, 
        totalEpisodes: 12,
        title: 'Solo Leveling'
    },
    '176496': { 
        slug: 'solo-leveling-season-2', 
        season: 2, 
        totalEpisodes: 13,
        title: 'Solo Leveling Season 2'
    },
    
    // ============================================================
    // KAIJU NO. 8
    // ============================================================
    '158930': { 
        slug: 'kaiju-no-8', 
        season: 1, 
        totalEpisodes: 13,
        title: 'Kaiju No. 8'
    },
    '160195': { 
        slug: 'kaiju-no-8-season-2', 
        season: 2, 
        totalEpisodes: 11,
        title: 'Kaiju No. 8 Season 2'
    },
    
    // ============================================================
    // FULLMETAL ALCHEMIST
    // ============================================================
    '121': { 
        slug: 'fullmetal-alchemist', 
        season: 1, 
        totalEpisodes: 51,
        title: 'Fullmetal Alchemist'
    },
    '5114': { 
        slug: 'fullmetal-alchemist-brotherhood', 
        season: 1, 
        totalEpisodes: 64,
        title: 'Fullmetal Alchemist Brotherhood'
    },
    
    // ============================================================
    // HUNTER X HUNTER
    // ============================================================
    '1_HXH_1999': { 
        slug: 'hunter-x-hunter', 
        season: 1, 
        totalEpisodes: 62,
        title: 'Hunter x Hunter (1999)'
    },
    '11061': { 
        slug: 'hunter-x-hunter-2011', 
        season: 1, 
        totalEpisodes: 148,
        title: 'Hunter x Hunter (2011)'
    },
    
    // ============================================================
    // SWORD ART ONLINE
    // ============================================================
    '11757': { 
        slug: 'sword-art-online', 
        season: 1, 
        totalEpisodes: 25,
        title: 'Sword Art Online'
    },
    '20594': { 
        slug: 'sword-art-online-ii', 
        season: 2, 
        totalEpisodes: 24,
        title: 'Sword Art Online II'
    },
    '100182': { 
        slug: 'sword-art-online-alicization', 
        season: 3, 
        totalEpisodes: 24,
        title: 'Sword Art Online: Alicization'
    },
    '108759': { 
        slug: 'sword-art-online-alicization-war-of-underworld', 
        season: 4, 
        totalEpisodes: 12,
        title: 'Sword Art Online: Alicization - War of Underworld'
    },
    '114308': { 
        slug: 'sword-art-online-alicization-war-of-underworld-2', 
        season: 4, 
        totalEpisodes: 11,
        title: 'Sword Art Online: Alicization - War of Underworld Part 2'
    },
    
    // ============================================================
    // ONE PUNCH MAN
    // ============================================================
    '21087': { 
        slug: 'one-punch-man', 
        season: 1, 
        totalEpisodes: 12,
        title: 'One Punch Man'
    },
    '97668': { 
        slug: 'one-punch-man-2', 
        season: 2, 
        totalEpisodes: 12,
        title: 'One Punch Man Season 2'
    },
    '153800': { 
        slug: 'one-punch-man-3', 
        season: 3, 
        totalEpisodes: 12,
        title: 'One Punch Man Season 3'
    },
    
    // ============================================================
    // ATTACK ON TITAN
    // ============================================================
    '16498': { 
        slug: 'shingeki-no-kyojin', 
        season: 1, 
        totalEpisodes: 25,
        title: 'Attack on Titan'
    },
    '16498_2': { 
        slug: 'attack-on-titan-2', 
        season: 2, 
        totalEpisodes: 12,
        title: 'Attack on Titan Season 2'
    },
    '99147': { 
        slug: 'attack-on-titan-3', 
        season: 3, 
        totalEpisodes: 22,
        title: 'Attack on Titan Season 3'
    },
    '110277': { 
        slug: 'attack-on-titan-the-final-season', 
        season: 4, 
        totalEpisodes: 28,
        title: 'Attack on Titan: The Final Season'
    },
    
    // ============================================================
    // BLUE LOCK
    // ============================================================
    '137822': { 
        slug: 'blue-lock', 
        season: 1, 
        totalEpisodes: 24,
        title: 'Blue Lock'
    },
    '163146': { 
        slug: 'blue-lock-vs-u-20-japan', 
        season: 2, 
        totalEpisodes: 14,
        title: 'Blue Lock Season 2'
    },
    
    // ============================================================
    // BLACK CLOVER
    // ============================================================
    '97940': { 
        slug: 'black-clover', 
        season: 1, 
        totalEpisodes: 170,
        title: 'Black Clover'
    },
    
    // ============================================================
    // MY HERO ACADEMIA (BOKU NO HERO)
    // ============================================================
    '21459': { 
        slug: 'boku-no-hero-academia', 
        season: 1, 
        totalEpisodes: 13,
        title: 'My Hero Academia'
    },
    '21856': { 
        slug: 'boku-no-hero-academia-2', 
        season: 2, 
        totalEpisodes: 25,
        title: 'My Hero Academia Season 2'
    },
    '100166': { 
        slug: 'boku-no-hero-academia-3', 
        season: 3, 
        totalEpisodes: 25,
        title: 'My Hero Academia Season 3'
    },
    '104276': { 
        slug: 'boku-no-hero-academia-4', 
        season: 4, 
        totalEpisodes: 25,
        title: 'My Hero Academia Season 4'
    },
    '117193': { 
        slug: 'boku-no-hero-academia-5', 
        season: 5, 
        totalEpisodes: 25,
        title: 'My Hero Academia Season 5'
    },
    '139630': { 
        slug: 'boku-no-hero-academia-6', 
        season: 6, 
        totalEpisodes: 25,
        title: 'My Hero Academia Season 6'
    },
    '163139': { 
        slug: 'boku-no-hero-academia-7', 
        season: 7, 
        totalEpisodes: 21,
        title: 'My Hero Academia Season 7'
    },
    '182896': { 
        slug: 'boku-no-hero-academia-final-season', 
        season: 8, 
        totalEpisodes: 11,
        title: 'My Hero Academia FINAL SEASON'
    },
    
    // ============================================================
    // NARUTO
    // ============================================================
    '20': { 
        slug: 'naruto', 
        season: 1, 
        totalEpisodes: 220,
        title: 'Naruto'
    },
    '1735': { 
        slug: 'naruto-shippuden', 
        season: 2, 
        totalEpisodes: 500,
        title: 'Naruto: Shippuden'
    },
    
    // ============================================================
    // DRAGON BALL
    // ============================================================
    '223': { 
        slug: 'dragon-ball', 
        season: 1, 
        totalEpisodes: 153,
        title: 'Dragon Ball'
    },
    '813': { 
        slug: 'dragon-ball-z', 
        season: 2, 
        totalEpisodes: 291,
        title: 'Dragon Ball Z'
    },
    '225': { 
        slug: 'dragon-ball-gt', 
        season: 3, 
        totalEpisodes: 64,
        title: 'Dragon Ball GT'
    },
    '21175': { 
        slug: 'dragon-ball-super', 
        season: 4, 
        totalEpisodes: 131,
        title: 'Dragon Ball Super'
    },
    '170083': { 
        slug: 'dragon-ball-daima', 
        season: 5, 
        totalEpisodes: 20,
        title: 'Dragon Ball Daima'
    },
    '102352': { 
        slug: 'dragon-ball-heroes', 
        season: 6, 
        totalEpisodes: 56,
        title: 'Super Dragon Ball Heroes'
    },
    
    // ============================================================
    // FAIRY TAIL
    // ============================================================
    '6702': { 
        slug: 'fairy-tail', 
        season: 1, 
        totalEpisodes: 175,
        title: 'Fairy Tail'
    },
    '20626': { 
        slug: 'fairy-tail-2014', 
        season: 2, 
        totalEpisodes: 102,
        title: 'Fairy Tail 2014'
    },
    '99749': { 
        slug: 'fairy-tail-final-series', 
        season: 3, 
        totalEpisodes: 51,
        title: 'Fairy Tail Final Series'
    },
    
    // ============================================================
    // DEMON SLAYER (KIMETSU NO YAIBA) - TODAS LAS TEMPORADAS
    // ============================================================
    '101922': { 
    slug: 'kimetsu-no-yaiba', 
    season: 1, 
    totalEpisodes: 26,
    title: 'Demon Slayer: Kimetsu no Yaiba'
    },
    '129874': { 
    slug: 'kimetsu-no-yaiba-mugen-ressha-hen', 
    season: 2, 
    totalEpisodes: 7,
    title: 'Demon Slayer: Mugen Train Arc'
    },
    '142329': { 
    slug: 'kimetsu-no-yaiba-yuukaku-hen', 
    season: 3, 
    totalEpisodes: 11,
    title: 'Demon Slayer: Entertainment District Arc'
    },
    '145139': { 
    slug: 'kimetsu-no-yaiba-katanakaji-no-sato-hen', 
    season: 4, 
    totalEpisodes: 11,
    title: 'Demon Slayer: Swordsmith Village Arc'
    },
    '166240': { 
    slug: 'kimetsu-no-yaiba-hashira-geiko-hen', 
    season: 5, 
    totalEpisodes: 8,
    title: 'Demon Slayer: Hashira Training Arc'
    },
};

// ============================================================
// 🔥 SISTEMA AUTOMÁTICO PARA DETECTAR Y COMBINAR PARTES
// ============================================================

/**
 * Detecta automáticamente si un slug tiene una versión "-part-2"
 * y combina ambos slugs en uno solo con todos los episodios
 */
export function detectAndCombineParts(
    tokens: Record<string, Record<number, string>>,
    baseSlug: string
): { episodes: Record<number, string>; total: number; slugs: string[] } | null {
    console.log(`🔍 Buscando partes para: "${baseSlug}"`);
    
    const seasonMatch = baseSlug.match(/-(\d+)$/);
    const baseSeasonNumber = seasonMatch ? parseInt(seasonMatch[1]) : 0;
    const baseWithoutNumber = baseSlug.replace(/-\d+$/, '');
    
    const allEpisodes: Record<number, string> = {};
    const usedSlugs: string[] = [];
    let counter = 1;
    
    if (tokens[baseSlug]) {
        const episodes = tokens[baseSlug];
        const episodeNumbers = Object.keys(episodes).map(Number).sort((a, b) => a - b);
        for (const num of episodeNumbers) {
            allEpisodes[counter] = episodes[num];
            counter++;
        }
        usedSlugs.push(baseSlug);
        console.log(`📺 Slug base "${baseSlug}": ${episodeNumbers.length} episodios`);
    }
    
    const partPatterns = [
        '-part-2',
        '-parte-2',
        '-cour-2',
        '-season-2-part-2',
        '-2nd-season',
    ];
    
    if (baseSeasonNumber > 0) {
        for (const pattern of partPatterns) {
            const partSlug = `${baseWithoutNumber}-${baseSeasonNumber}${pattern}`;
            if (tokens[partSlug] && !usedSlugs.includes(partSlug)) {
                const episodes = tokens[partSlug];
                const episodeNumbers = Object.keys(episodes).map(Number).sort((a, b) => a - b);
                for (const num of episodeNumbers) {
                    allEpisodes[counter] = episodes[num];
                    counter++;
                }
                usedSlugs.push(partSlug);
                console.log(`📺 Parte "${partSlug}": ${episodeNumbers.length} episodios`);
            }
        }
        
        for (const pattern of partPatterns) {
            const partSlug = `${baseSlug}${pattern}`;
            if (tokens[partSlug] && !usedSlugs.includes(partSlug)) {
                const episodes = tokens[partSlug];
                const episodeNumbers = Object.keys(episodes).map(Number).sort((a, b) => a - b);
                for (const num of episodeNumbers) {
                    allEpisodes[counter] = episodes[num];
                    counter++;
                }
                usedSlugs.push(partSlug);
                console.log(`📺 Parte "${partSlug}": ${episodeNumbers.length} episodios`);
            }
        }
    } else {
        for (const pattern of partPatterns) {
            const partSlug = `${baseSlug}${pattern}`;
            if (tokens[partSlug] && !usedSlugs.includes(partSlug)) {
                const episodes = tokens[partSlug];
                const episodeNumbers = Object.keys(episodes).map(Number).sort((a, b) => a - b);
                for (const num of episodeNumbers) {
                    allEpisodes[counter] = episodes[num];
                    counter++;
                }
                usedSlugs.push(partSlug);
                console.log(`📺 Parte "${partSlug}": ${episodeNumbers.length} episodios`);
            }
        }
    }
    
    for (const [slug, episodes] of Object.entries(tokens)) {
        if (slug === baseSlug || usedSlugs.includes(slug)) continue;
        
        const slugSeasonMatch = slug.match(/-(\d+)(?:-part-2|-parte-2|-cour-2)/);
        const slugSeason = slugSeasonMatch ? parseInt(slugSeasonMatch[1]) : 0;
        
        const isPart = /-part-2$/.test(slug) || /-parte-2$/.test(slug) || /-cour-2$/.test(slug);
        
        if (isPart && slug.startsWith(baseWithoutNumber)) {
            if (baseSeasonNumber > 0 && slugSeason === baseSeasonNumber) {
                const episodeNumbers = Object.keys(episodes).map(Number).sort((a, b) => a - b);
                for (const num of episodeNumbers) {
                    allEpisodes[counter] = episodes[num];
                    counter++;
                }
                usedSlugs.push(slug);
                console.log(`📺 Parte detectada "${slug}": ${episodeNumbers.length} episodios`);
            } else if (baseSeasonNumber === 0 && slugSeason === 0) {
                const episodeNumbers = Object.keys(episodes).map(Number).sort((a, b) => a - b);
                for (const num of episodeNumbers) {
                    allEpisodes[counter] = episodes[num];
                    counter++;
                }
                usedSlugs.push(slug);
                console.log(`📺 Parte detectada "${slug}": ${episodeNumbers.length} episodios`);
            }
        }
    }
    
    if (Object.keys(allEpisodes).length > 0 && usedSlugs.length > 1) {
        console.log(`✅ Combinación automática: ${Object.keys(allEpisodes).length} episodios totales`);
        console.log(`📂 Slugs combinados:`, usedSlugs);
        return {
            episodes: allEpisodes,
            total: Object.keys(allEpisodes).length,
            slugs: usedSlugs
        };
    }
    
    return null;
}

// ============================================================
// FUNCIÓN PARA ENCONTRAR EL SLUG CORRECTO
// ============================================================

export function findCorrectSlug(
    tokens: Record<string, Record<number, string>>,
    animeId: string,
    title: string
): { slug: string; season: number; totalEpisodes: number } | null {
    console.log(`🔍 Buscando slug para: "${title}" (ID: ${animeId})`);
    console.log(`📋 Tokens disponibles:`, Object.keys(tokens));
    
    if (ANILIST_ID_TO_SLUG[animeId]) {
        const mapping = ANILIST_ID_TO_SLUG[animeId];
        console.log(`✅ Slug por ID: "${mapping.slug}"`);
        
        if (tokens[mapping.slug]) {
            return mapping;
        }
        
        const variants = [
            mapping.slug,
            mapping.slug.replace(/-season-2$/, '-2'),
            mapping.slug.replace(/-season-2$/, '-part-2'),
            mapping.slug.replace(/-season-2$/, ''),
            mapping.slug.replace(/-2$/, '-season-2'),
            mapping.slug.replace(/-3$/, '-season-3'),
        ];
        
        for (const variant of variants) {
            if (tokens[variant]) {
                console.log(`✅ Slug por variante: "${variant}"`);
                return { ...mapping, slug: variant };
            }
        }
        
        for (const [slug, episodes] of Object.entries(tokens)) {
            if (slug.includes(mapping.slug) || mapping.slug.includes(slug)) {
                console.log(`✅ Slug por coincidencia: "${slug}"`);
                return { ...mapping, slug: slug };
            }
        }
    }
    
    const normalized = normalizeTitle(title);
    const baseTitle = removeSeasonNumber(normalized);
    const seasonNum = detectSeasonNumber(title);
    
    for (const [slug, episodes] of Object.entries(tokens)) {
        const slugNormalized = normalizeTitle(slug.replace(/-/g, ' '));
        const slugBase = removeSeasonNumber(slugNormalized);
        const slugSeason = detectSeasonNumber(slug);
        
        if (slugBase === baseTitle || slugNormalized.includes(baseTitle) || baseTitle.includes(slugNormalized)) {
            if (seasonNum === slugSeason || seasonNum === 0 || slugSeason === 0) {
                console.log(`✅ Slug por título: "${slug}"`);
                return {
                    slug: slug,
                    season: slugSeason || seasonNum || 1,
                    totalEpisodes: Object.keys(episodes).length
                };
            }
        }
    }
    
    const mappedTitle = getNormalizedTitle(title);
    for (const [slug, episodes] of Object.entries(tokens)) {
        const slugNormalized = normalizeTitle(slug.replace(/-/g, ' '));
        const mappedSlug = getNormalizedTitle(slugNormalized);
        if (mappedSlug === mappedTitle || mappedSlug.includes(mappedTitle) || mappedTitle.includes(mappedSlug)) {
            console.log(`✅ Slug por mapeo: "${slug}"`);
            return {
                slug: slug,
                season: detectSeasonNumber(slug) || 1,
                totalEpisodes: Object.keys(episodes).length
            };
        }
    }
    
    console.warn(`❌ No se encontró slug para: "${title}"`);
    console.log(`📋 Tokens disponibles:`, Object.keys(tokens));
    console.log(`💡 Sugerencia: Agrega el ID "${animeId}" a ANILIST_ID_TO_SLUG en title-matcher.ts`);
    return null;
}

// ============================================================
// FUNCIÓN PARA OBTENER EPISODIOS COMBINADOS (AUTOMÁTICO)
// ============================================================

export function getCombinedEpisodes(
    tokens: Record<string, Record<number, string>>,
    animeId: string,
    title?: string
): { episodes: Record<number, string>; total: number; slugs: string[] } | null {
    let baseSlug: string | null = null;
    
    if (ANILIST_ID_TO_SLUG[animeId]) {
        baseSlug = ANILIST_ID_TO_SLUG[animeId].slug;
    } else if (title) {
        baseSlug = generateSlug(title);
    }
    
    if (!baseSlug) {
        return null;
    }
    
    console.log(`🔍 Buscando combinación automática para: "${baseSlug}"`);
    
    const result = detectAndCombineParts(tokens, baseSlug);
    
    if (result && result.slugs.length > 1) {
        return result;
    }
    
    return null;
}