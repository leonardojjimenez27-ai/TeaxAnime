// src/lib/cache/browser-cache.ts

// ============================================================
// CACHÉ DEL NAVEGADOR (para cada usuario individualmente)
// ============================================================

// Usar sessionStorage o localStorage según la persistencia deseada
const CACHE_PREFIX = 'browser_cache_';
const DEFAULT_TTL = 10 * 60 * 1000; // 10 minutos

// Verificar si estamos en el navegador
const isBrowser = typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined';
const isLocalStorageAvailable = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

interface BrowserCacheItem {
    data: any;
    timestamp: number;
    expiresAt: number;
}

class BrowserCache {
    private storage: Storage | null;
    private defaultTTL: number;
    private memoryCache: Map<string, BrowserCacheItem>; // Fallback para SSR

    constructor(storage: Storage | null = null, defaultTTL: number = DEFAULT_TTL) {
        // Si estamos en el navegador y se proporcionó storage, usarlo; si no, usar sessionStorage
        if (isBrowser && !storage) {
            this.storage = sessionStorage;
        } else if (isBrowser && storage) {
            this.storage = storage;
        } else {
            // En el servidor, usamos un Map en memoria como fallback
            this.storage = null;
        }
        this.defaultTTL = defaultTTL;
        this.memoryCache = new Map();
    }

    // Verificar si el storage está disponible
    private isStorageAvailable(): boolean {
        return this.storage !== null && isBrowser;
    }

    // Generar clave con prefijo
    private getKey(key: string): string {
        return `${CACHE_PREFIX}${key}`;
    }

    // Obtener un valor del caché
    get<T>(key: string): T | null {
        const fullKey = this.getKey(key);

        // 1. Intentar con storage (navegador)
        if (this.isStorageAvailable()) {
            try {
                const raw = this.storage!.getItem(fullKey);
                if (!raw) return null;

                const item: BrowserCacheItem = JSON.parse(raw);
                
                // Verificar expiración
                if (Date.now() > item.expiresAt) {
                    this.storage!.removeItem(fullKey);
                    return null;
                }

                console.log(`💾 Browser cache hit: ${key}`);
                return item.data as T;
            } catch (error) {
                console.error('Error leyendo browser cache:', error);
                return null;
            }
        }

        // 2. Fallback: memoryCache (para SSR)
        const memoryItem = this.memoryCache.get(fullKey);
        if (!memoryItem) return null;

        if (Date.now() > memoryItem.expiresAt) {
            this.memoryCache.delete(fullKey);
            return null;
        }

        console.log(`💾 Memory cache hit (SSR): ${key}`);
        return memoryItem.data as T;
    }

    // Guardar un valor en el caché
    set(key: string, data: any, ttl?: number): void {
        const fullKey = this.getKey(key);
        const expiresAt = Date.now() + (ttl || this.defaultTTL);
        const item: BrowserCacheItem = {
            data,
            timestamp: Date.now(),
            expiresAt
        };

        // 1. Intentar con storage (navegador)
        if (this.isStorageAvailable()) {
            try {
                this.storage!.setItem(fullKey, JSON.stringify(item));
                console.log(`💾 Browser cache set: ${key}`);
                return;
            } catch (error) {
                console.error('Error guardando en browser cache:', error);
                // Si el storage está lleno, limpiar cachés antiguos
                if (error instanceof DOMException && error.name === 'QuotaExceededError') {
                    this.cleanupOldest();
                }
            }
        }

        // 2. Fallback: memoryCache (para SSR o si el storage falla)
        this.memoryCache.set(fullKey, item);
        console.log(`💾 Memory cache set (SSR): ${key}`);
    }

    // Verificar si existe una clave en caché
    has(key: string): boolean {
        const fullKey = this.getKey(key);

        // 1. Intentar con storage (navegador)
        if (this.isStorageAvailable()) {
            try {
                const raw = this.storage!.getItem(fullKey);
                if (!raw) return false;
                const item: BrowserCacheItem = JSON.parse(raw);
                if (Date.now() > item.expiresAt) {
                    this.storage!.removeItem(fullKey);
                    return false;
                }
                return true;
            } catch {
                return false;
            }
        }

        // 2. Fallback: memoryCache (SSR)
        const memoryItem = this.memoryCache.get(fullKey);
        if (!memoryItem) return false;
        if (Date.now() > memoryItem.expiresAt) {
            this.memoryCache.delete(fullKey);
            return false;
        }
        return true;
    }

    // Eliminar una clave del caché
    delete(key: string): void {
        const fullKey = this.getKey(key);

        if (this.isStorageAvailable()) {
            this.storage!.removeItem(fullKey);
        }
        this.memoryCache.delete(fullKey);
        console.log(`🗑️ Browser cache delete: ${key}`);
    }

    // Limpiar todo el caché
    clear(): void {
        // 1. Limpiar storage (navegador)
        if (this.isStorageAvailable()) {
            const keys = this.getAllKeys();
            for (const key of keys) {
                this.storage!.removeItem(key);
            }
            console.log(`🧹 Browser cache limpiado: ${keys.length} elementos (storage)`);
        }

        // 2. Limpiar memoryCache (SSR)
        const memorySize = this.memoryCache.size;
        this.memoryCache.clear();
        console.log(`🧹 Memory cache limpiado: ${memorySize} elementos (SSR)`);
    }

    // Obtener todas las claves del caché (storage)
    private getAllKeys(): string[] {
        if (!this.isStorageAvailable()) return [];
        
        const keys: string[] = [];
        for (let i = 0; i < this.storage!.length; i++) {
            const key = this.storage!.key(i);
            if (key && key.startsWith(CACHE_PREFIX)) {
                keys.push(key);
            }
        }
        return keys;
    }

    // Limpiar los elementos más antiguos cuando el storage está lleno
    private cleanupOldest(): void {
        if (!this.isStorageAvailable()) return;
        
        console.log('🧹 Storage lleno, limpiando elementos antiguos...');
        const items: { key: string; timestamp: number }[] = [];
        
        for (let i = 0; i < this.storage!.length; i++) {
            const key = this.storage!.key(i);
            if (key && key.startsWith(CACHE_PREFIX)) {
                try {
                    const raw = this.storage!.getItem(key);
                    if (raw) {
                        const item: BrowserCacheItem = JSON.parse(raw);
                        items.push({ key, timestamp: item.timestamp });
                    }
                } catch {
                    // Ignorar elementos corruptos
                }
            }
        }
        
        // Ordenar por timestamp (más antiguo primero)
        items.sort((a, b) => a.timestamp - b.timestamp);
        
        // Eliminar el 50% más antiguo
        const toDelete = Math.ceil(items.length / 2);
        for (let i = 0; i < toDelete && i < items.length; i++) {
            this.storage!.removeItem(items[i].key);
        }
        console.log(`🧹 Eliminados ${toDelete} elementos antiguos`);
    }

    // Obtener estadísticas del caché
    getStats(): { size: number; keys: string[] } {
        const allKeys: string[] = [];

        // 1. Obtener keys del storage (navegador)
        if (this.isStorageAvailable()) {
            for (let i = 0; i < this.storage!.length; i++) {
                const key = this.storage!.key(i);
                if (key && key.startsWith(CACHE_PREFIX)) {
                    allKeys.push(key.replace(CACHE_PREFIX, ''));
                }
            }
        }

        // 2. Obtener keys del memoryCache (SSR)
        for (const key of this.memoryCache.keys()) {
            if (key.startsWith(CACHE_PREFIX)) {
                allKeys.push(key.replace(CACHE_PREFIX, ''));
            }
        }

        // Eliminar duplicados
        const uniqueKeys = [...new Set(allKeys)];

        return {
            size: uniqueKeys.length,
            keys: uniqueKeys
        };
    }
}

// Singleton del caché del navegador
// Usamos una función que devuelve la instancia para manejar SSR correctamente
let browserCacheInstance: BrowserCache | null = null;

export function getBrowserCache(): BrowserCache {
    if (!browserCacheInstance) {
        browserCacheInstance = new BrowserCache();
    }
    return browserCacheInstance;
}

// Exportar una instancia para uso directo (se crea bajo demanda)
export const browserCache = getBrowserCache();

// Funciones helper para diferentes tipos de datos
export const browserCacheHelpers = {
    anime: {
        get: (id: number) => browserCache.get(`anime:${id}`),
        set: (id: number, data: any, ttl?: number) => browserCache.set(`anime:${id}`, data, ttl)
    },
    search: {
        get: (query: string, page: number) => browserCache.get(`search:${query}:${page}`),
        set: (query: string, page: number, data: any, ttl?: number) => 
            browserCache.set(`search:${query}:${page}`, data, ttl)
    },
    trending: {
        get: (page: number) => browserCache.get(`trending:${page}`),
        set: (page: number, data: any, ttl?: number) => browserCache.set(`trending:${page}`, data, ttl)
    },
    popular: {
        get: (page: number) => browserCache.get(`popular:${page}`),
        set: (page: number, data: any, ttl?: number) => browserCache.set(`popular:${page}`, data, ttl)
    }
};