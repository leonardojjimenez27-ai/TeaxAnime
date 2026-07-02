interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number; // Tiempo de vida en milisegundos
}

class Cache {
    private store: Map<string, CacheEntry<any>> = new Map();

    set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
        this.store.set(key, {
            data,
            timestamp: Date.now(),
            ttl,
        });
    }

    get<T>(key: string): T | null {
        const entry = this.store.get(key);
        if (!entry) return null;

        const now = Date.now();
        if (now - entry.timestamp > entry.ttl) {
            this.store.delete(key);
            return null;
        }

        return entry.data as T;
    }

    clear(): void {
        this.store.clear();
    }

    delete(key: string): void {
        this.store.delete(key);
    }
}

export const cache = new Cache();