// src/lib/anilist/queries.ts

export const TRENDING_QUERY = `
query Trending($page: Int = 1, $perPage: Int = 20) {
    Page(page: $page, perPage: $perPage) {
        pageInfo {
            total
            currentPage
            lastPage
            hasNextPage
            perPage
        }
        media(type: ANIME, sort: TRENDING_DESC) {
            id
            title {
                romaji
                english
                native
            }
            coverImage {
                extraLarge
                large
                medium
                color
            }
            bannerImage
            episodes
            genres
            averageScore
            status
            season
            seasonYear
            format
            duration
            popularity
            favourites
            description(asHtml: false)
        }
    }
}
`;

export const POPULAR_QUERY = `
query Popular($page: Int = 1, $perPage: Int = 20) {
    Page(page: $page, perPage: $perPage) {
        pageInfo {
            total
            currentPage
            lastPage
            hasNextPage
            perPage
        }
        media(type: ANIME, sort: POPULARITY_DESC) {
            id
            title {
                romaji
                english
                native
            }
            coverImage {
                extraLarge
                large
                medium
                color
            }
            bannerImage
            episodes
            genres
            averageScore
            status
            season
            seasonYear
            format
            duration
            popularity
            favourites
            description(asHtml: false)
        }
    }
}
`;

export const SEARCH_QUERY = `
query Search($page: Int = 1, $perPage: Int = 20, $search: String) {
    Page(page: $page, perPage: $perPage) {
        pageInfo {
            total
            currentPage
            lastPage
            hasNextPage
            perPage
        }
        media(type: ANIME, search: $search) {
            id
            title {
                romaji
                english
                native
            }
            coverImage {
                extraLarge
                large
                medium
                color
            }
            bannerImage
            episodes
            genres
            averageScore
            status
            season
            seasonYear
            format
            duration
            popularity
            favourites
            description(asHtml: false)
        }
    }
}
`;

export const ANIME_INFO_QUERY = `
query AnimeInfo($id: Int) {
    Media(id: $id, type: ANIME) {
        id
        title {
            romaji
            english
            native
        }
        coverImage {
            extraLarge
            large
            medium
            color
        }
        bannerImage
        episodes
        genres
        averageScore
        description(asHtml: false)
        status
        season
        seasonYear
        format
        duration
        popularity
        favourites
        studios {
            nodes {
                name
            }
        }
        characters(sort: ROLE, perPage: 10) {
            nodes {
                id
                name {
                    full
                }
                image {
                    large
                }
                gender
            }
        }
    }
}
`;

export const SEASON_QUERY = `
query Season($page: Int = 1, $perPage: Int = 20, $season: MediaSeason, $seasonYear: Int) {
    Page(page: $page, perPage: $perPage) {
        pageInfo {
            total
            currentPage
            lastPage
            hasNextPage
            perPage
        }
        media(type: ANIME, season: $season, seasonYear: $seasonYear, sort: POPULARITY_DESC) {
            id
            title {
                romaji
                english
                native
            }
            coverImage {
                extraLarge
                large
                medium
                color
            }
            bannerImage
            episodes
            genres
            averageScore
            status
            season
            seasonYear
            format
            duration
            popularity
            favourites
            description(asHtml: false)
        }
    }
}
`;

export const GENRE_QUERY = `
query Genre($page: Int = 1, $perPage: Int = 20, $genre: String) {
    Page(page: $page, perPage: $perPage) {
        pageInfo {
            total
            currentPage
            lastPage
            hasNextPage
            perPage
        }
        media(type: ANIME, genre: $genre, sort: POPULARITY_DESC) {
            id
            title {
                romaji
                english
                native
            }
            coverImage {
                extraLarge
                large
                medium
                color
            }
            bannerImage
            episodes
            genres
            averageScore
            status
            season
            seasonYear
            format
            duration
            popularity
            favourites
            description(asHtml: false)
        }
    }
}
`;

export const ANIME_INFO_WITH_EPISODES_QUERY = `
query AnimeInfoWithEpisodes($id: Int) {
    Media(id: $id, type: ANIME) {
        id
        title {
            romaji
            english
            native
        }
        coverImage {
            extraLarge
            large
            medium
            color
        }
        bannerImage
        episodes
        genres
        averageScore
        description(asHtml: false)
        status
        season
        seasonYear
        format
        duration
        popularity
        favourites
        studios {
            nodes {
                name
            }
        }
        characters(sort: ROLE, perPage: 10) {
            nodes {
                id
                name {
                    full
                }
                image {
                    large
                }
                gender
            }
        }
        streamingEpisodes {
            id
            title
            thumbnail
            url
            site
        }
        nextAiringEpisode {
            episode
            timeUntilAiring
        }
        relations {
            edges {
                relationType
                node {
                    id
                    title {
                        romaji
                        english
                        native
                    }
                    coverImage {
                        large
                    }
                }
            }
        }
    }
}
`;