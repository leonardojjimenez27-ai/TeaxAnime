// src/lib/anilist/episodes.ts
import { request } from './client'
import { ANIME_INFO_WITH_EPISODES_QUERY } from './queries'
import { mapToAnimeInfo } from './mapper'
import { cache } from './cache'
import { cleanDescription } from '../translations'
import { calculateSeasons, organizeEpisodesBySeasons } from './seasons'
import type { AnimeFullInfo, EpisodeDetails, SeasonInfo } from './types'

function generateEpisodes(totalEpisodes: number, animeTitle: string): EpisodeDetails[] {
    const episodes: EpisodeDetails[] = []
    for (let i = 1; i <= totalEpisodes; i++) {
        let description = ''
        if (i === 1) {
            description = `Primer episodio de "${animeTitle}". Comienza la historia.`
        } else if (i === totalEpisodes) {
            description = `Episodio final de "${animeTitle}". Conclusión de la historia.`
        } else if (i % 10 === 0) {
            description = `Episodio ${i} de "${animeTitle}". Momento importante en la historia.`
        } else {
            description = `Episodio ${i} de "${animeTitle}". Continúa la aventura.`
        }
        
        episodes.push({
            id: i,
            number: i,
            title: `Episodio ${i}`,
            description: description,
            thumbnail: null,
            airDate: null,
            duration: null,
        })
    }
    return episodes
}

export async function getAnimeWithEpisodes(id: number): Promise<AnimeFullInfo> {
    const cacheKey = `anime-full:${id}`
    const cached = cache.get<AnimeFullInfo>(cacheKey)
    if (cached) return cached

    try {
        const data = await request<any>(ANIME_INFO_WITH_EPISODES_QUERY, { id })
        const media = data.Media
        
        const baseInfo = mapToAnimeInfo(media)
        
        const totalEpisodes = media.episodes || 12
        const episodes = generateEpisodes(totalEpisodes, baseInfo.title)
        
        // Organizar episodios por temporadas
        const seasons = calculateSeasons(totalEpisodes, baseInfo.title)
        
        // Verificar si tiene múltiples temporadas
        const hasMultipleSeasons = seasons.length > 1

        const relations = media.relations?.edges?.map((edge: any) => {
            const title = edge.node.title.english || edge.node.title.romaji || edge.node.title.native || ''
            return {
                id: edge.node.id,
                title: title,
                image: edge.node.coverImage.large,
                relationType: edge.relationType,
            }
        }) || []

        const fullInfo: AnimeFullInfo = {
            ...baseInfo,
            episodes,
            seasons,
            nextAiring: media.nextAiringEpisode ? {
                episode: media.nextAiringEpisode.episode,
                timeUntilAiring: media.nextAiringEpisode.timeUntilAiring,
            } : null,
            relations,
            hasMultipleSeasons,
            totalSeasons: seasons.length,
        }

        cache.set(cacheKey, fullInfo, 30 * 60 * 1000)
        return fullInfo
    } catch (error) {
        console.error('Error fetching anime with episodes:', error)
        throw error
    }
}