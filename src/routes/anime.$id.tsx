import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { GENRE_ES } from '@/lib/anilist'
import { EpisodeList } from '@/components/EpisodeList'
import { cleanAndTranslateDescription } from '@/lib/translator'

// Función para obtener datos del anime directamente de AniList
async function getAnimeInfo(id: number) {
    const response = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: JSON.stringify({
            query: `
                query ($id: Int) {
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
                        }
                        bannerImage
                        episodes
                        genres
                        averageScore
                        description(asHtml: false)
                        status
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
                    }
                }
            `,
            variables: { id }
        })
    })
    
    const json = await response.json()
    const media = json.data.Media
    
    // Limpiar y traducir la descripción
    let description = media.description || null
    if (description) {
        description = await cleanAndTranslateDescription(description)
    }
    
    return {
        id: media.id,
        title: media.title.english || media.title.romaji || media.title.native,
        image: media.coverImage.extraLarge || media.coverImage.large,
        bannerImage: media.bannerImage,
        episodes: media.episodes || 0,
        genres: media.genres || [],
        averageScore: media.averageScore,
        description: description,
        status: media.status,
        year: media.seasonYear,
        format: media.format,
        duration: media.duration,
        popularity: media.popularity,
        favourites: media.favourites,
        studios: media.studios?.nodes.map((s: any) => s.name) || [],
    }
}

// Función para generar episodios
function generateEpisodes(totalEpisodes: number, animeTitle: string) {
    const episodes = []
    for (let i = 1; i <= totalEpisodes; i++) {
        let description = ''
        if (i === 1) {
            description = `Primer episodio de "${animeTitle}". Comienza la historia.`
        } else if (i === totalEpisodes) {
            description = `Episodio final de "${animeTitle}". Conclusión de la historia.`
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

export const Route = createFileRoute('/anime/$id')({
    component: AnimeDetailComponent,
})

function AnimeDetailComponent() {
    const { id } = Route.useParams()
    const [anime, setAnime] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function loadAnime() {
            setLoading(true)
            setError(null)
            try {
                console.log('🔄 Cargando anime ID:', id)
                const data = await getAnimeInfo(Number(id))
                console.log('✅ Anime cargado:', data.title)
                setAnime(data)
            } catch (err) {
                console.error('❌ Error:', err)
                setError('Error al cargar el anime')
            } finally {
                setLoading(false)
            }
        }

        loadAnime()
    }, [id])

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <p className="mt-4 text-gray-500">Cargando información...</p>
                </div>
            </div>
        )
    }

    if (error || !anime) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="text-center py-12">
                    <p className="text-red-500">{error || 'No se encontró el anime'}</p>
                    <Link to="/" className="mt-4 inline-block px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700">
                        Volver al inicio
                    </Link>
                </div>
            </div>
        )
    }

    // Generar episodios
    const totalEpisodes = anime.episodes || 12
    const episodes = generateEpisodes(totalEpisodes, anime.title)
    const seasons = [
        {
            id: 1,
            name: 'Temporada 1',
            seasonNumber: 1,
            episodes: episodes,
        }
    ]

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Banner */}
            {anime.bannerImage && (
                <div className="relative h-64 md:h-80 rounded-lg overflow-hidden mb-8">
                    <img
                        src={anime.bannerImage}
                        alt={anime.title}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
                </div>
            )}

            {/* Contenido principal */}
            <div className="flex flex-col md:flex-row gap-8">
                {/* Imagen de portada */}
                <div className="md:w-1/4 flex-shrink-0">
                    <img
                        src={anime.image}
                        alt={anime.title}
                        className="w-full rounded-lg shadow-lg"
                    />
                </div>

                {/* Información */}
                <div className="md:w-3/4">
                    <h1 className="text-3xl font-bold mb-2">{anime.title}</h1>
                    
                    {/* Puntuación */}
                    {anime.averageScore && (
                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-yellow-400 text-xl">★</span>
                            <span className="text-lg font-semibold">{(anime.averageScore / 10).toFixed(1)}</span>
                            <span className="text-gray-400">/ 10</span>
                            {anime.popularity && (
                                <span className="text-gray-400 ml-4">👁️ {anime.popularity.toLocaleString()}</span>
                            )}
                            {anime.favourites && (
                                <span className="text-gray-400 ml-4">❤️ {anime.favourites.toLocaleString()}</span>
                            )}
                        </div>
                    )}

                    {/* Géneros */}
                    {anime.genres && anime.genres.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                            {anime.genres.map((genre: string) => (
                                <Link
                                    key={genre}
                                    to="/genero/$slug"
                                    params={{ slug: genre.toLowerCase().replace(/\s+/g, '-') }}
                                    className="px-3 py-1 bg-gray-700 rounded-full text-sm hover:bg-gray-600 transition"
                                >
                                    {GENRE_ES[genre] || genre}
                                </Link>
                            ))}
                        </div>
                    )}

                    {/* Detalles */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6 text-sm">
                        {anime.episodes > 0 && (
                            <div>
                                <span className="text-gray-400">Episodios:</span>
                                <p className="font-semibold">{anime.episodes}</p>
                            </div>
                        )}
                        {anime.status && (
                            <div>
                                <span className="text-gray-400">Estado:</span>
                                <p className="font-semibold">
                                    {anime.status === 'RELEASING' ? 'En emisión' : 
                                     anime.status === 'FINISHED' ? 'Finalizado' : 
                                     anime.status === 'NOT_YET_RELEASED' ? 'Próximamente' : 
                                     anime.status}
                                </p>
                            </div>
                        )}
                        {anime.format && (
                            <div>
                                <span className="text-gray-400">Formato:</span>
                                <p className="font-semibold">{anime.format}</p>
                            </div>
                        )}
                        {anime.duration && (
                            <div>
                                <span className="text-gray-400">Duración:</span>
                                <p className="font-semibold">{anime.duration} min</p>
                            </div>
                        )}
                        {anime.year && (
                            <div>
                                <span className="text-gray-400">Año:</span>
                                <p className="font-semibold">{anime.year}</p>
                            </div>
                        )}
                    </div>

                    {/* Sinopsis */}
                    {anime.description && (
                        <div className="mt-4">
                            <h2 className="text-xl font-semibold mb-2">📖 Sinopsis</h2>
                            <p className="text-gray-300 leading-relaxed whitespace-pre-line">
                                {anime.description}
                            </p>
                        </div>
                    )}

                    {/* Estudios */}
                    {anime.studios && anime.studios.length > 0 && (
                        <div className="mt-4">
                            <h2 className="text-xl font-semibold mb-2">🏢 Estudios</h2>
                            <p className="text-gray-300">{anime.studios.join(', ')}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Lista de episodios */}
            <EpisodeList
                animeId={anime.id}
                animeTitle={anime.title}
                seasons={seasons}
            />
        </div>
    )
}