export interface EpisodeDetails {
    id: number;
    number: number;
    title: string | null;
    description: string | null;
    thumbnail: string | null;
    airDate: string | null;
    duration: number | null;
}

export interface SeasonInfo {
    id: number;
    name: string;
    seasonNumber: number;
    episodes: EpisodeDetails[];
    year: number | null;
    startDate: string | null;
    endDate: string | null;
    isSpecial: boolean;
}

export function calculateSeasons(totalEpisodes: number, animeTitle: string): SeasonInfo[] {
    if (totalEpisodes <= 0) {
        return [{
            id: 1,
            name: 'Temporada 1',
            seasonNumber: 1,
            episodes: [],
            year: null,
            startDate: null,
            endDate: null,
            isSpecial: false,
        }]
    }

    let seasonSize = 12
    if (totalEpisodes <= 13) seasonSize = totalEpisodes
    else if (totalEpisodes <= 24) seasonSize = 12
    else if (totalEpisodes <= 26) seasonSize = 13
    else if (totalEpisodes <= 50) seasonSize = 12
    else if (totalEpisodes <= 100) seasonSize = 12
    else seasonSize = 12

    const totalSeasons = Math.ceil(totalEpisodes / seasonSize)
    const seasons: SeasonInfo[] = []

    for (let i = 0; i < totalSeasons; i++) {
        const start = i * seasonSize + 1
        const end = Math.min((i + 1) * seasonSize, totalEpisodes)
        const episodes: EpisodeDetails[] = []

        for (let j = start; j <= end; j++) {
            episodes.push({
                id: j,
                number: j,
                title: `Episodio ${j}`,
                description: `Episodio ${j} de ${animeTitle}`,
                thumbnail: null,
                airDate: null,
                duration: null,
            })
        }

        seasons.push({
            id: i + 1,
            name: `Temporada ${i + 1}`,
            seasonNumber: i + 1,
            episodes: episodes,
            year: null,
            startDate: null,
            endDate: null,
            isSpecial: false,
        })
    }

    return seasons
}