// src/lib/anilist/mock-data.ts

// Datos de respaldo para cuando AniList no esté disponible
export const MOCK_ANIME = {
    trending: [
        {
            id: 1,
            title: {
                romaji: "Solo Leveling",
                english: "Solo Leveling",
                native: "나 혼자만 레벨업"
            },
            coverImage: {
                large: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx151960-1C7rV1qh7smi.jpg",
                medium: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx151960-1C7rV1qh7smi.jpg"
            },
            episodes: 12,
            genres: ["Action", "Fantasy", "Adventure"],
            averageScore: 85,
            status: "RELEASING",
            seasonYear: 2024,
            format: "TV"
        },
        {
            id: 2,
            title: {
                romaji: "Kaiju No. 8",
                english: "Kaiju No. 8",
                native: "怪獣8号"
            },
            coverImage: {
                large: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx158930-PuPVhPQPxiE2.jpg",
                medium: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx158930-PuPVhPQPxiE2.jpg"
            },
            episodes: 12,
            genres: ["Action", "Sci-Fi", "Shounen"],
            averageScore: 82,
            status: "RELEASING",
            seasonYear: 2024,
            format: "TV"
        },
        {
            id: 3,
            title: {
                romaji: "Wind Breaker",
                english: "Wind Breaker",
                native: "ウィンドブレイカー"
            },
            coverImage: {
                large: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx169338-aY4TfNpX5Nfg.jpg",
                medium: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx169338-aY4TfNpX5Nfg.jpg"
            },
            episodes: 13,
            genres: ["Action", "School", "Shounen"],
            averageScore: 78,
            status: "FINISHED",
            seasonYear: 2024,
            format: "TV"
        },
        {
            id: 4,
            title: {
                romaji: "Tensei Shitara Slime Datta Ken 3rd Season",
                english: "That Time I Got Reincarnated as a Slime Season 3",
                native: "転生したらスライムだった件 第3期"
            },
            coverImage: {
                large: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx158930-PuPVhPQPxiE2.jpg",
                medium: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx158930-PuPVhPQPxiE2.jpg"
            },
            episodes: 24,
            genres: ["Fantasy", "Adventure", "Comedy"],
            averageScore: 80,
            status: "RELEASING",
            seasonYear: 2024,
            format: "TV"
        },
        {
            id: 5,
            title: {
                romaji: "Mushoku Tensei II: Isekai Ittara Honki Dasu Part 2",
                english: "Mushoku Tensei: Jobless Reincarnation Season 2 Part 2",
                native: "無職転生 II ～異世界行ったら本気だす～ 第2クール"
            },
            coverImage: {
                large: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx162560-zV4V5YY2gIBB.jpg",
                medium: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx162560-zV4V5YY2gIBB.jpg"
            },
            episodes: 12,
            genres: ["Adventure", "Drama", "Fantasy"],
            averageScore: 87,
            status: "FINISHED",
            seasonYear: 2024,
            format: "TV"
        }
    ],
    popular: [
        {
            id: 6,
            title: {
                romaji: "One Piece",
                english: "One Piece",
                native: "ワンピース"
            },
            coverImage: {
                large: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21-2ZX4WXM8wn49.jpg",
                medium: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx21-2ZX4WXM8wn49.jpg"
            },
            episodes: 1122,
            genres: ["Action", "Adventure", "Comedy"],
            averageScore: 90,
            status: "RELEASING",
            seasonYear: 1999,
            format: "TV"
        },
        {
            id: 7,
            title: {
                romaji: "Naruto Shippuden",
                english: "Naruto Shippuden",
                native: "NARUTO 疾風伝"
            },
            coverImage: {
                large: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx1735-veqUS5x3U8ML.jpg",
                medium: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx1735-veqUS5x3U8ML.jpg"
            },
            episodes: 500,
            genres: ["Action", "Adventure", "Martial Arts"],
            averageScore: 82,
            status: "FINISHED",
            seasonYear: 2007,
            format: "TV"
        },
        {
            id: 8,
            title: {
                romaji: "Jujutsu Kaisen 2nd Season",
                english: "Jujutsu Kaisen Season 2",
                native: "呪術廻戦 第2期"
            },
            coverImage: {
                large: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx158930-PuPVhPQPxiE2.jpg",
                medium: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx158930-PuPVhPQPxiE2.jpg"
            },
            episodes: 23,
            genres: ["Action", "Fantasy", "Shounen"],
            averageScore: 88,
            status: "FINISHED",
            seasonYear: 2023,
            format: "TV"
        }
    ]
};