// src/lib/player/jkanime-extractor.ts

// ============================================================
// FUNCIONES PARA CARGAR Y GUARDAR TOKENS
// ============================================================

function loadTokens(): Record<string, Record<number, string>> {
    if (typeof window === 'undefined') return {}
    try {
        const saved = localStorage.getItem('blogger_tokens')
        if (saved) {
            return JSON.parse(saved)
        }
    } catch (e) {
        console.error('Error cargando tokens:', e)
    }
    return {}
}

function cleanTitle(title: string): string {
    return title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
}

function cleanJKanimeTitle(title: string): string {
    if (!title) return ''
    
    let clean = title
        .replace(/\s*[-|]\s*(anime|online|jk|jkanime|ver|capitulo|episodio|sub|latino|hd)/gi, '')
        .replace(/\s*-\s*.*?(?:anime|online|jk|jkanime).*$/i, '')
        .replace(/\s*\(.*?\)/g, '')
        .trim()
    
    clean = clean.replace(/\s*-\s*anime\s+.*$/i, '')
    clean = clean.replace(/\s+online\s+jkanime$/i, '')
    clean = clean.replace(/\s+jkanime$/i, '')
    
    clean = clean.replace(/^(Mushoku Tensei)\s+III\s+.*$/i, 'Mushoku Tensei III')
    clean = clean.replace(/^(Mushoku Tensei)\s+.*$/i, 'Mushoku Tensei')
    clean = clean.replace(/^(One Piece)\s+.*$/i, 'One Piece')
    clean = clean.replace(/^(Naruto)\s+.*$/i, 'Naruto')
    clean = clean.replace(/^(Attack on Titan)\s+.*$/i, 'Attack on Titan')
    
    if (clean.length > 60) {
        clean = clean.substring(0, 60).trim()
    }
    
    return clean
}

function getTitleFromUrl(url: string): string {
    const slug = url.split('/').filter(Boolean).pop() || ''
    return slug
        .replace(/-/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase())
        .replace(/Iii/g, 'III')
        .replace(/Iii/g, 'III')
        .replace(/Ii/g, 'II')
        .trim()
}

// ============================================================
// FUNCIÓN PARA OBTENER EL HTML DE JKANIME
// ============================================================

async function fetchJKanimePage(url: string): Promise<string> {
    console.log(`🔍 Fetching JKanime page: ${url}`)
    const response = await fetch(`/api/blogger?url=${encodeURIComponent(url)}`)
    
    if (!response.ok) {
        throw new Error(`Error al obtener la página: ${response.status}`)
    }
    
    const data = await response.json()
    if (data.success && data.html) {
        return data.html
    }
    
    throw new Error('No se pudo obtener el contenido de la página')
}

// ============================================================
// FUNCIÓN PARA OBTENER VIDEO DE UN EPISODIO
// ============================================================

async function fetchEpisodeVideo(animeSlug: string, episodeNum: number): Promise<string | null> {
    console.log(`🔍 Buscando video para episodio ${episodeNum}...`)
    const response = await fetch(`/api/blogger?anime=${animeSlug}&episode=${episodeNum}`)
    
    if (!response.ok) {
        return null
    }
    
    const data = await response.json()
    if (data.success && data.videoUrl) {
        return data.videoUrl
    }
    
    return null
}

// ============================================================
// FUNCIÓN PRINCIPAL PARA EXTRAER EPISODIOS DE JKANIME
// ============================================================

export async function extractJKanimeEpisodes(
    animeUrl: string,
    animeTitle: string,
    onProgress?: (progress: number) => void
): Promise<{ episode: number; url: string | null }[]> {
    const results: { episode: number; url: string | null }[] = []
    
    try {
        let cleanAnimeTitle = animeTitle
        if (!cleanAnimeTitle || cleanAnimeTitle === '') {
            cleanAnimeTitle = getTitleFromUrl(animeUrl)
        }
        cleanAnimeTitle = cleanJKanimeTitle(cleanAnimeTitle)
        
        console.log('🌐 Extrayendo de JKanime:', animeUrl)
        console.log('📌 Título limpio:', cleanAnimeTitle)
        
        const slug = animeUrl.split('/').filter(Boolean).pop() || ''
        console.log('📌 Slug:', slug)
        
        // ============================================================
        // PASO 1: Obtener el HTML de la página
        // ============================================================
        const html = await fetchJKanimePage(animeUrl)
        console.log('📊 HTML obtenido, longitud:', html.length)
        
        // ============================================================
        // PASO 2: Extraer lista de episodios
        // ============================================================
        const episodeUrls: { num: number; url: string }[] = []
        
        const capRegex = /<li\s+class="cap_num">\s*<a\s+href="([^"]*)"[^>]*>\s*(\d+)\s*<\/a>/gi
        let match
        while ((match = capRegex.exec(html)) !== null) {
            const href = match[1]
            const num = parseInt(match[2])
            if (href && num > 0) {
                const fullUrl = href.startsWith('http') ? href : `https://jkanime.net${href}`
                if (fullUrl.includes(slug) && !episodeUrls.some(e => e.num === num)) {
                    episodeUrls.push({ num, url: fullUrl })
                }
            }
        }
        
        // Si no se encontraron episodios, construir manualmente
        if (episodeUrls.length === 0) {
            console.log('🔍 Construyendo URLs manualmente...')
            let total = 24
            const totalMatch = html.match(/(\d+)\s*(?:episodios|capítulos)/i)
            if (totalMatch) {
                total = parseInt(totalMatch[1])
            }
            
            for (let i = 1; i <= total; i++) {
                episodeUrls.push({ num: i, url: `https://jkanime.net/ver/${slug}/${i}/` })
            }
        }
        
        episodeUrls.sort((a, b) => a.num - b.num)
        console.log(`📊 Total de episodios encontrados: ${episodeUrls.length}`)
        
        if (episodeUrls.length === 0) {
            console.warn('⚠️ No se encontraron episodios')
            return results
        }
        
        // ============================================================
        // PASO 3: Extraer URLs de video de cada episodio
        // ============================================================
        let processed = 0
        const total = episodeUrls.length
        
        for (const ep of episodeUrls) {
            try {
                console.log(`🔍 Extrayendo episodio ${ep.num}...`)
                
                const videoUrl = await fetchEpisodeVideo(slug, ep.num)
                
                if (videoUrl) {
                    console.log(`✅ Episodio ${ep.num}: URL encontrada`)
                    results.push({ episode: ep.num, url: videoUrl })
                } else {
                    console.warn(`⚠️ Episodio ${ep.num}: Sin URL`)
                    results.push({ episode: ep.num, url: null })
                }
                
                processed++
                if (onProgress) onProgress((processed / total) * 100)
                await new Promise(resolve => setTimeout(resolve, 300))
                
            } catch (e) {
                console.error(`❌ Error en episodio ${ep.num}:`, e)
                results.push({ episode: ep.num, url: null })
                processed++
                if (onProgress) onProgress((processed / total) * 100)
            }
        }
        
        const found = results.filter(r => r.url !== null).length
        console.log(`✅ Extracción completada: ${found} de ${results.length} episodios`)
        return results
        
    } catch (error) {
        console.error('❌ Error en JKanime:', error)
        return results
    }
}

// ============================================================
// FUNCIONES PARA GUARDAR Y EXPORTAR
// ============================================================

export function saveJKanimeTokens(
    animeTitle: string,
    episodes: { episode: number; url: string | null }[]
): void {
    try {
        const cleanTitleName = cleanJKanimeTitle(animeTitle)
        const key = cleanTitle(cleanTitleName)
        const tokens = loadTokens()
        
        const episodeMap: Record<number, string> = {}
        episodes.forEach(ep => {
            if (ep.url) {
                episodeMap[ep.episode] = ep.url
            }
        })
        
        tokens[key] = episodeMap
        localStorage.setItem('blogger_tokens', JSON.stringify(tokens))
        
        console.log(`✅ Tokens de "${cleanTitleName}" guardados (${Object.keys(episodeMap).length} episodios)`)
    } catch (e) {
        console.error('Error guardando tokens:', e)
    }
}

export function exportJKanimeTokensAsCode(
    animeTitle: string,
    episodes: { episode: number; url: string | null }[]
): string {
    const cleanTitleName = cleanJKanimeTitle(animeTitle)
    const key = cleanTitle(cleanTitleName)
    const validEpisodes = episodes.filter(e => e.url !== null)
    
    let code = `// ============================================================\n`
    code += `// Tokens para "${cleanTitleName}" (extraídos de JKanime)\n`
    code += `// ${validEpisodes.length} de ${episodes.length} episodios encontrados\n`
    code += `// Fecha: ${new Date().toLocaleString()}\n`
    code += `// ============================================================\n\n`
    code += `const tokens = {\n`
    code += `  "${key}": {\n`
    
    validEpisodes.forEach((ep, index) => {
        const comma = index < validEpisodes.length - 1 ? ',' : ''
        code += `    ${ep.episode}: "${ep.url}"${comma}\n`
    })
    
    code += `  }\n`
    code += `}\n\n`
    code += `// Guardar en localStorage\n`
    code += `localStorage.setItem('blogger_tokens', JSON.stringify(tokens));\n`
    code += `\n// Verificar que se guardaron correctamente\n`
    code += `console.log('✅ Tokens guardados:', Object.keys(JSON.parse(localStorage.getItem('blogger_tokens') || '{}')));\n`
    
    return code
}