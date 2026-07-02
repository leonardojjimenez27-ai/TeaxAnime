// src/lib/anilist/index.ts
export * from './types'
export * from './queries'
export { request } from './client'
export { cache } from './cache'
export { mapToAnimeResult, mapToAnimeInfo } from './mapper'
export { animeApi } from './api'
export { getAnimeWithEpisodes } from './episodes'
export { animeApi as default } from './api'