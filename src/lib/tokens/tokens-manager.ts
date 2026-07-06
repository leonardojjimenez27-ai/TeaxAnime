// src/lib/tokens/tokens-manager.ts

// ============================================================
// GESTIÓN DE TOKENS CON RESPALDO EN JSON
// ============================================================

const BACKUP_KEY = 'blogger_tokens_backup';

// Guardar tokens en localStorage y en JSON automáticamente
export function saveTokensWithBackup(
    animeTitle: string,
    tokens: Record<number, string>
): void {
    // 1. Guardar en localStorage (como siempre)
    const saved = localStorage.getItem('blogger_tokens');
    const allTokens = saved ? JSON.parse(saved) : {};
    
    if (!allTokens[animeTitle]) {
        allTokens[animeTitle] = {};
    }
    
    // Agregar nuevos tokens sin sobrescribir los existentes
    for (const [ep, url] of Object.entries(tokens)) {
        if (url) {
            allTokens[animeTitle][Number(ep)] = url;
        }
    }
    
    localStorage.setItem('blogger_tokens', JSON.stringify(allTokens));
    
    // 2. Guardar copia de seguridad en JSON (automático)
    exportTokensToJson(allTokens);
    
    console.log('💾 Tokens guardados y respaldados en JSON');
}

// Exportar tokens a JSON (descarga automática o guardado en servidor)
export function exportTokensToJson(tokens: Record<string, Record<number, string>>): void {
    try {
        // Guardar en localStorage como backup (para recuperación)
        localStorage.setItem(BACKUP_KEY, JSON.stringify(tokens));
        
        // También intentar guardar en el servidor (si hay endpoint)
        if (typeof window !== 'undefined' && window.navigator) {
            // Opción 1: Descarga automática (silenciosa)
            // No forzamos descarga automática para no molestar al usuario
            
            // Opción 2: Guardar en IndexedDB para mayor persistencia
            saveToIndexedDB(tokens);
        }
    } catch (error) {
        console.error('Error al exportar tokens a JSON:', error);
    }
}

// Guardar en IndexedDB (más persistente que localStorage)
function saveToIndexedDB(tokens: Record<string, Record<number, string>>): void {
    try {
        const request = indexedDB.open('AnimeTokensDB', 1);
        
        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains('tokens')) {
                db.createObjectStore('tokens', { keyPath: 'id' });
            }
        };
        
        request.onsuccess = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            const transaction = db.transaction(['tokens'], 'readwrite');
            const store = transaction.objectStore('tokens');
            
            // Guardar cada token por separado
            for (const [key, value] of Object.entries(tokens)) {
                store.put({ id: key, data: value });
            }
            
            console.log('💾 Tokens guardados en IndexedDB');
        };
        
        request.onerror = (error) => {
            console.error('Error guardando en IndexedDB:', error);
        };
    } catch (error) {
        console.error('Error con IndexedDB:', error);
    }
}

// Recuperar tokens desde el backup (si se perdió localStorage)
export function recoverTokensFromBackup(): Record<string, Record<number, string>> | null {
    try {
        // Intentar recuperar desde localStorage backup
        const backup = localStorage.getItem(BACKUP_KEY);
        if (backup) {
            return JSON.parse(backup);
        }
        
        // Intentar recuperar desde IndexedDB
        return null;
    } catch (error) {
        console.error('Error recuperando tokens:', error);
        return null;
    }
}

// Cargar tokens automáticamente al iniciar
export function autoLoadTokens(): Record<string, Record<number, string>> {
    // 1. Intentar desde localStorage principal
    const saved = localStorage.getItem('blogger_tokens');
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch (e) {
            console.error('Error cargando tokens:', e);
        }
    }
    
    // 2. Si no hay, intentar recuperar desde backup
    const backup = recoverTokensFromBackup();
    if (backup && Object.keys(backup).length > 0) {
        console.log('♻️ Recuperando tokens desde backup...');
        localStorage.setItem('blogger_tokens', JSON.stringify(backup));
        return backup;
    }
    
    return {};
}