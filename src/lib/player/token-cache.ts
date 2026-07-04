// src/lib/player/token-cache.ts

interface TokenCacheEntry {
    token: string;
    timestamp: number;
    expiresIn: number; // milisegundos
}

class TokenCache {
    private cache: Map<string, TokenCacheEntry> = new Map();
    private readonly DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24 horas por defecto

    // Generar una clave única para cada anime y episodio
    private getKey(animeTitle: string, episodeNumber: number): string {
        const cleanTitle = animeTitle
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
        return `${cleanTitle}-episodio-${episodeNumber}`;
    }

    // Guardar un token en caché
    set(animeTitle: string, episodeNumber: number, token: string, ttl?: number): void {
        const key = this.getKey(animeTitle, episodeNumber);
        this.cache.set(key, {
            token,
            timestamp: Date.now(),
            expiresIn: ttl || this.DEFAULT_TTL
        });
        console.log(`💾 Token guardado en caché para: ${animeTitle} - Episodio ${episodeNumber}`);
    }

    // Obtener un token de la caché
    get(animeTitle: string, episodeNumber: number): string | null {
        const key = this.getKey(animeTitle, episodeNumber);
        const entry = this.cache.get(key);
        
        if (!entry) {
            console.log(`❌ Token no encontrado en caché para: ${animeTitle} - Episodio ${episodeNumber}`);
            return null;
        }

        // Verificar si el token ha expirado
        const now = Date.now();
        if (now - entry.timestamp > entry.expiresIn) {
            console.log(`⏰ Token expirado para: ${animeTitle} - Episodio ${episodeNumber}`);
            this.cache.delete(key);
            return null;
        }

        console.log(`✅ Token encontrado en caché para: ${animeTitle} - Episodio ${episodeNumber}`);
        return entry.token;
    }

    // Limpiar la caché completa
    clear(): void {
        this.cache.clear();
        console.log('🗑️ Caché de tokens limpiada');
    }

    // Limpiar tokens expirados
    cleanExpired(): void {
        const now = Date.now();
        let count = 0;
        for (const [key, entry] of this.cache.entries()) {
            if (now - entry.timestamp > entry.expiresIn) {
                this.cache.delete(key);
                count++;
            }
        }
        if (count > 0) {
            console.log(`🧹 ${count} tokens expirados limpiados`);
        }
    }

    // Obtener estadísticas de la caché
    getStats(): { total: number; expired: number } {
        const now = Date.now();
        let expired = 0;
        for (const entry of this.cache.values()) {
            if (now - entry.timestamp > entry.expiresIn) {
                expired++;
            }
        }
        return {
            total: this.cache.size,
            expired
        };
    }
}

// Exportar una instancia única de la caché
export const tokenCache = new TokenCache();