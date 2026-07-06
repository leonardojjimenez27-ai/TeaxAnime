// src/lib/cache/server-cache.ts

// ============================================================
// CACHÉ DEL SERVIDOR (para compartir entre todos los usuarios)
// ============================================================

interface CacheItem {
    data: any;
    timestamp: number;
    expiresAt: number;
}

class ServerCache {
    private cache: Map<string, CacheItem>;
    private defaultTTL: number; // Tiempo de vida en milisegundos

    constructor(defaultTTL: number = 5 * 60 * 1000) { // 5 minutos por defecto
        this.cache = new Map();
        this.defaultTTL = defaultTTL;
        
        // Limpiar caché cada 10 minutos para evitar acumulación
        setInterval(() => this.cleanup(), 10 * 60 * 1000);
    }

    // Obtener un valor del caché
    get<T>(key: string): T | null {
        const item = this.cache.get(key);
        
        if (!item) {
            return null;
        }

        // Verificar si expiró
        if (Date.now() > item.expiresAt) {
            this.cache.delete(key);
            return null;
        }

        console.log(`💾 Cache hit: ${key}`);
        return item.data as T;
    }

    // Guardar un valor en el caché
    set(key: string, data: any, ttl?: number): void {
        const expiresAt = Date.now() + (ttl || this.defaultTTL);
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            expiresAt
        });
        console.log(`💾 Cache set: ${key} (expira en ${(expiresAt - Date.now()) / 1000}s)`);
    }

    // Verificar si existe una clave en caché
    has(key: string): boolean {
        const item = this.cache.get(key);
        if (!item) return false;
        if (Date.now() > item.expiresAt) {
            this.cache.delete(key);
            return false;
        }
        return true;
    }

    // Eliminar una clave del caché
    delete(key: string): void {
        this.cache.delete(key);
        console.log(`🗑️ Cache delete: ${key}`);
    }

    // Limpiar todo el caché
    clear(): void {
        this.cache.clear();
        console.log('🧹 Cache limpiado completamente');
    }

    // Limpiar elementos expirados
    private cleanup(): void {
        const now = Date.now();
        let deletedCount = 0;
        for (const [key, item] of this.cache.entries()) {
            if (now > item.expiresAt) {
                this.cache.delete(key);
                deletedCount++;
            }
        }
        if (deletedCount > 0) {
            console.log(`🧹 Cache limpiado: ${deletedCount} elementos expirados`);
        }
    }

    // Obtener estadísticas del caché
    getStats(): { size: number; keys: string[] } {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }
}

// Singleton global del caché del servidor
export const serverCache = new ServerCache();

// Funciones helper para diferentes tipos de datos
export const cacheHelpers = {
    // Caché para animes
    anime: {
        get: (id: number) => serverCache.get(`anime:${id}`),
        set: (id: number, data: any, ttl?: number) => serverCache.set(`anime:${id}`, data, ttl),
        delete: (id: number) => serverCache.delete(`anime:${id}`)
    },
    // Caché para búsquedas
    search: {
        get: (query: string, page: number) => serverCache.get(`search:${query}:${page}`),
        set: (query: string, page: number, data: any, ttl?: number) => 
            serverCache.set(`search:${query}:${page}`, data, ttl),
        delete: (query: string, page: number) => serverCache.delete(`search:${query}:${page}`)
    },
    // Caché para trending
    trending: {
        get: (page: number) => serverCache.get(`trending:${page}`),
        set: (page: number, data: any, ttl?: number) => serverCache.set(`trending:${page}`, data, ttl),
        delete: (page: number) => serverCache.delete(`trending:${page}`)
    },
    // Caché para popular
    popular: {
        get: (page: number) => serverCache.get(`popular:${page}`),
        set: (page: number, data: any, ttl?: number) => serverCache.set(`popular:${page}`, data, ttl),
        delete: (page: number) => serverCache.delete(`popular:${page}`)
    },
    // Caché para episodios de VerAnimeOnline
    episode: {
        get: (slug: string, episode: number) => serverCache.get(`episode:${slug}:${episode}`),
        set: (slug: string, episode: number, data: any, ttl?: number) => 
            serverCache.set(`episode:${slug}:${episode}`, data, ttl),
        delete: (slug: string, episode: number) => serverCache.delete(`episode:${slug}:${episode}`)
    }
};