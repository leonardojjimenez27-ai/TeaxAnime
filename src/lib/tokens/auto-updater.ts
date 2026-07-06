// src/lib/tokens/auto-updater.ts

// ============================================================
// ACTUALIZACIÓN AUTOMÁTICA DE EPISODIOS
// ============================================================

import { extractAllEpisodes } from '@/lib/player/batch-extractor';
import { saveTokensWithBackup } from './tokens-manager';

// Configuración
const CHECK_INTERVAL = 24 * 60 * 60 * 1000; // 24 horas
const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 segundos

// Estado
let isRunning = false;
let intervalId: NodeJS.Timeout | null = null;
let lastCheckTime: number = 0;

// Obtener animes que están en emisión (desde AniList o Jikan)
async function getAiringAnimes(): Promise<string[]> {
    try {
        // Intentar obtener desde AniList
        const response = await fetch('/api/anilist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query: `
                    query {
                        Page(page: 1, perPage: 50) {
                            media(type: ANIME, status: RELEASING, sort: POPULARITY_DESC) {
                                title {
                                    romaji
                                    english
                                }
                            }
                        }
                    }
                `
            })
        });
        
        const data = await response.json();
        const titles = data.data?.Page?.media?.map((m: any) => 
            m.title.english || m.title.romaji
        ) || [];
        
        return titles;
    } catch (error) {
        console.error('❌ Error obteniendo animes en emisión:', error);
        return [];
    }
}

// Verificar si un anime tiene episodios nuevos
async function checkForNewEpisodes(
    animeTitle: string,
    currentEpisodes: number
): Promise<{ hasNew: boolean; newCount: number }> {
    try {
        // Extraer episodios actuales
        const results = await extractAllEpisodes(animeTitle, 20); // Verificar hasta 20 episodios nuevos
        
        const found = results.filter(r => r.url !== null);
        const newEpisodes = found.filter(r => r.episode > currentEpisodes);
        
        return {
            hasNew: newEpisodes.length > 0,
            newCount: newEpisodes.length
        };
    } catch (error) {
        console.error(`❌ Error verificando ${animeTitle}:`, error);
        return { hasNew: false, newCount: 0 };
    }
}

// Función principal de actualización
export async function autoUpdateEpisodes(): Promise<void> {
    if (isRunning) {
        console.log('⏳ Actualización ya en curso...');
        return;
    }
    
    isRunning = true;
    console.log('🔄 Iniciando actualización automática de episodios...');
    
    try {
        // 1. Obtener tokens actuales
        const saved = localStorage.getItem('blogger_tokens');
        if (!saved) {
            console.log('ℹ️ No hay tokens para actualizar');
            return;
        }
        
        const currentTokens = JSON.parse(saved);
        const animeSlugs = Object.keys(currentTokens);
        
        if (animeSlugs.length === 0) {
            console.log('ℹ️ No hay animes guardados para actualizar');
            return;
        }
        
        console.log(`📊 Verificando ${animeSlugs.length} animes...`);
        
        // 2. Obtener animes en emisión
        const airingAnimes = await getAiringAnimes();
        console.log(`📺 ${airingAnimes.length} animes en emisión detectados`);
        
        // 3. Verificar cada anime guardado
        let totalNewEpisodes = 0;
        const updates: string[] = [];
        
        for (const slug of animeSlugs) {
            const currentEp = Object.keys(currentTokens[slug]).length;
            
            // Intentar con el slug como título
            const title = slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            
            // Verificar si está en emisión (para no hacer peticiones innecesarias)
            const isAiring = airingAnimes.some((a: string) => 
                a.toLowerCase().includes(title.toLowerCase()) ||
                title.toLowerCase().includes(a.toLowerCase())
            );
            
            if (!isAiring) {
                console.log(`⏭️ ${slug} no está en emisión, omitiendo...`);
                continue;
            }
            
            console.log(`🔍 Verificando ${slug}...`);
            
            const result = await checkForNewEpisodes(title, currentEp);
            
            if (result.hasNew) {
                console.log(`✅ Nuevos episodios para ${slug}: ${result.newCount}`);
                totalNewEpisodes += result.newCount;
                updates.push(`${slug} (+${result.newCount} eps)`);
                
                // Extraer y guardar los nuevos episodios
                const newResults = await extractAllEpisodes(title, currentEp + result.newCount);
                const newTokens: Record<number, string> = {};
                
                for (const r of newResults) {
                    if (r.url && r.episode > currentEp) {
                        newTokens[r.episode] = r.url;
                    }
                }
                
                // Guardar con backup
                saveTokensWithBackup(slug, newTokens);
            }
        }
        
        // 4. Notificar resultados
        if (totalNewEpisodes > 0) {
            console.log(`🎉 Actualización completada: ${totalNewEpisodes} nuevos episodios`);
            console.log(`📝 Animes actualizados: ${updates.join(', ')}`);
            
            // Mostrar notificación en la UI
            showNotification(`📺 ${totalNewEpisodes} episodios nuevos encontrados!`, updates);
        } else {
            console.log('✅ No se encontraron episodios nuevos');
        }
        
        lastCheckTime = Date.now();
        
    } catch (error) {
        console.error('❌ Error en actualización automática:', error);
    } finally {
        isRunning = false;
    }
}

// Mostrar notificación en la UI
function showNotification(message: string, details: string[]): void {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #1a1a2e;
        color: white;
        padding: 16px 20px;
        border-radius: 12px;
        border: 1px solid #4a4a8a;
        z-index: 9999;
        max-width: 400px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.5);
        animation: slideIn 0.5s ease;
    `;
    
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px;">
            <span style="font-size: 24px;">📺</span>
            <div>
                <div style="font-weight: bold; margin-bottom: 4px;">${message}</div>
                <div style="font-size: 12px; color: #aaa;">
                    ${details.join(' • ')}
                </div>
                <div style="font-size: 11px; color: #666; margin-top: 6px;">
                    Haz clic para cerrar
                </div>
            </div>
        </div>
    `;
    
    notification.onclick = () => notification.remove();
    
    document.body.appendChild(notification);
    
    // Auto-cerrar después de 10 segundos
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 10000);
}

// Iniciar el sistema de actualización automática
export function startAutoUpdater(): void {
    if (intervalId) {
        console.log('⏳ Actualizador automático ya está corriendo');
        return;
    }
    
    console.log('🔄 Iniciando actualizador automático...');
    
    // Ejecutar primera verificación inmediatamente
    setTimeout(() => {
        autoUpdateEpisodes();
    }, 5000); // Esperar 5 segundos para que la página cargue
    
    // Configurar intervalo
    intervalId = setInterval(autoUpdateEpisodes, CHECK_INTERVAL);
    
    console.log(`✅ Actualizador automático configurado (cada ${CHECK_INTERVAL / 3600000} horas)`);
}

// Detener el sistema de actualización automática
export function stopAutoUpdater(): void {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
        console.log('⏹️ Actualizador automático detenido');
    }
}

// Obtener estado del actualizador
export function getAutoUpdaterStatus(): {
    isRunning: boolean;
    lastCheck: Date | null;
    intervalHours: number;
} {
    return {
        isRunning: isRunning,
        lastCheck: lastCheckTime ? new Date(lastCheckTime) : null,
        intervalHours: CHECK_INTERVAL / 3600000
    };
}

// Función para actualizar manualmente (desde la UI)
export async function manualUpdate(): Promise<void> {
    console.log('🔄 Ejecutando actualización manual...');
    await autoUpdateEpisodes();
}