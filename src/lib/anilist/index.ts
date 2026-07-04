// src/lib/anilist/index.ts
export * from './types'
export * from './queries'
export { request } from './client'
export { cache } from './cache'
export { mapToAnimeResult, mapToAnimeInfo } from './mapper'
export { animeApi } from './api'
export { getAnimeWithEpisodes } from './episodes'

// Exportar funciones de utilidad
export { getTitle } from './mapper'

// Exportación por defecto
export { animeApi as default } from './api'