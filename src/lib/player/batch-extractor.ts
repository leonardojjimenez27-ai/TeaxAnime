// src/lib/player/batch-extractor.ts

// Función para extraer todos los episodios de un anime
export async function extractAllEpisodes(animeTitle: string, totalEpisodes: number): Promise<{ episode: number; url: string | null }[]> {
    const results: { episode: number; url: string | null }[] = [];
    
    console.log(`🔍 Extrayendo todos los episodios de: ${animeTitle}`);
    console.log(`📺 Total de episodios: ${totalEpisodes}`);
    
    const cleanTitle = animeTitle
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    
    // Procesar episodios en lotes de 5 para no sobrecargar
    const batchSize = 5;
    for (let i = 1; i <= totalEpisodes; i += batchSize) {
        const batch = [];
        for (let j = i; j < Math.min(i + batchSize, totalEpisodes + 1); j++) {
            batch.push(j);
        }
        
        console.log(`🔄 Procesando episodios ${batch[0]} - ${batch[batch.length - 1]}...`);
        
        // Procesar en paralelo
        const batchResults = await Promise.all(
            batch.map(async (episodeNumber) => {
                try {
                    const episodeUrl = `https://veranimeonline.co/episodio/${cleanTitle}-episodio-${episodeNumber}/`;
                    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(episodeUrl)}`;
                    
                    const response = await fetch(proxyUrl, {
                        signal: AbortSignal.timeout(10000)
                    });
                    
                    if (!response.ok) {
                        console.log(`❌ Episodio ${episodeNumber}: Error ${response.status}`);
                        return { episode: episodeNumber, url: null };
                    }
                    
                    const html = await response.text();
                    
                    // Buscar el iframe de Blogger
                    const patterns = [
                        /<iframe[^>]*class="[^"]*metaframe[^"]*rptss[^"]*"[^>]*src="(https?:\/\/[^"]*blogger\.com\/video\.g\?[^"]+)"[^>]*>/i,
                        /<iframe[^>]*src="(https?:\/\/[^"]*blogger\.com\/video\.g\?[^"]+)"[^>]*>/i,
                        /src="(https?:\/\/[^"]*blogger\.com\/video\.g\?[^"]+)"/i,
                        /(https?:\/\/[^"]*blogger\.com\/video\.g\?[^"'\s]+)/i,
                    ];
                    
                    for (const pattern of patterns) {
                        const match = html.match(pattern);
                        if (match) {
                            const iframeUrl = match[1] || match[0];
                            console.log(`✅ Episodio ${episodeNumber}: Encontrado`);
                            return { episode: episodeNumber, url: iframeUrl };
                        }
                    }
                    
                    console.log(`❌ Episodio ${episodeNumber}: No encontrado`);
                    return { episode: episodeNumber, url: null };
                } catch (error) {
                    console.log(`❌ Episodio ${episodeNumber}: Error - ${error.message}`);
                    return { episode: episodeNumber, url: null };
                }
            })
        );
        
        results.push(...batchResults);
        
        // Esperar entre lotes para no sobrecargar
        if (i + batchSize < totalEpisodes) {
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    
    // Mostrar resumen
    const found = results.filter(r => r.url !== null).length;
    console.log(`📊 Resumen: ${found} de ${totalEpisodes} episodios encontrados`);
    
    return results;
}

// Función para guardar los tokens encontrados
export function saveTokensToLocalStorage(animeTitle: string, results: { episode: number; url: string | null }[]): void {
    const cleanTitle = animeTitle
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    
    // Cargar tokens existentes
    const saved = localStorage.getItem('blogger_tokens');
    const tokens = saved ? JSON.parse(saved) : {};
    
    if (!tokens[cleanTitle]) {
        tokens[cleanTitle] = {};
    }
    
    // Agregar nuevos tokens
    for (const result of results) {
        if (result.url) {
            tokens[cleanTitle][result.episode] = result.url;
        }
    }
    
    // Guardar
    localStorage.setItem('blogger_tokens', JSON.stringify(tokens));
    console.log(`💾 Tokens guardados en localStorage para ${animeTitle}`);
}

// Función para exportar tokens como código
export function exportTokensAsCode(animeTitle: string, results: { episode: number; url: string | null }[]): string {
    const cleanTitle = animeTitle
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    
    let code = `'${cleanTitle}': {\n`;
    for (const result of results) {
        if (result.url) {
            code += `    ${result.episode}: '${result.url}',\n`;
        }
    }
    code += '},';
    
    return code;
}