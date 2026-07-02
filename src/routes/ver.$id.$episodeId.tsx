// src/routes/ver.$id.$episodeId.tsx
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { animeApi } from '@/lib/anilist'

async function getEpisodeData(animeId: number, episodeNumber: number) {
    try {
        const animeInfo = await animeApi.info(animeId)
        const totalEpisodes = animeInfo.episodes || 12
        const episodes = Array.from({ length: totalEpisodes }, (_, i) => ({
            id: i + 1,
            number: i + 1,
            title: `Episodio ${i + 1}`,
        }))
        const currentEpisode = episodes.find(e => e.number === episodeNumber)
        return {
            anime: animeInfo,
            episodes,
            currentEpisode,
            totalEpisodes,
        }
    } catch (error) {
        console.error('Error loading episode:', error)
        throw error
    }
}

export const Route = createFileRoute('/ver/$id/$episodeId')({
    component: WatchComponent,
})

function WatchComponent() {
    const { id, episodeId } = Route.useParams()
    const navigate = useNavigate()
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [selectedServer, setSelectedServer] = useState(0)
    const [isLoadingPlayer, setIsLoadingPlayer] = useState(true)

    const servers = [
        { name: 'Servidor 1', url: `https://www.example.com/embed/${id}/${episodeId}` },
        { name: 'Servidor 2', url: `https://www.example2.com/embed/${id}/${episodeId}` },
        { name: 'Servidor 3', url: `https://www.example3.com/embed/${id}/${episodeId}` },
    ]

    useEffect(() => {
        async function loadEpisode() {
            setLoading(true)
            try {
                const result = await getEpisodeData(Number(id), Number(episodeId))
                setData(result)
            } catch (error) {
                console.error('Error:', error)
            } finally {
                setLoading(false)
            }
        }
        loadEpisode()
    }, [id, episodeId])

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <p className="mt-4 text-gray-500">Cargando episodio...</p>
                </div>
            </div>
        )
    }

    if (!data || !data.currentEpisode) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="text-center py-12">
                    <p className="text-red-500">Episodio no encontrado</p>
                    <Link to="/" className="mt-4 inline-block px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700">
                        Volver al inicio
                    </Link>
                </div>
            </div>
        )
    }

    const { anime, episodes, currentEpisode, totalEpisodes } = data
    const episodeNumber = Number(episodeId)
    const hasNext = episodeNumber < totalEpisodes
    const hasPrevious = episodeNumber > 1

    const handleNext = () => {
        if (hasNext) {
            navigate({
                to: '/ver/$id/$episodeId',
                params: { id, episodeId: String(episodeNumber + 1) }
            })
        }
    }

    const handlePrevious = () => {
        if (hasPrevious) {
            navigate({
                to: '/ver/$id/$episodeId',
                params: { id, episodeId: String(episodeNumber - 1) }
            })
        }
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-4">
                <Link to="/anime/$id" params={{ id }} className="text-blue-400 hover:text-blue-300 transition">
                    ← Volver a {anime.title}
                </Link>
            </div>

            <div className="bg-gray-900 rounded-lg overflow-hidden">
                <div className="relative aspect-video bg-black">
                    <iframe
                        src={servers[selectedServer].url}
                        className="w-full h-full"
                        allowFullScreen
                        allow="encrypted-media; picture-in-picture; autoplay"
                        onLoad={() => setIsLoadingPlayer(false)}
                    />
                    {isLoadingPlayer && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                            <div className="text-center">
                                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                                <p className="mt-4 text-white">Cargando reproductor...</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                            <h2 className="text-xl font-semibold">{anime.title}</h2>
                            <p className="text-gray-400">Episodio {currentEpisode.number}</p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handlePrevious}
                                disabled={!hasPrevious}
                                className="px-4 py-2 bg-gray-700 rounded-lg disabled:opacity-50 hover:bg-gray-600 transition"
                            >
                                ◀ Anterior
                            </button>
                            <button
                                onClick={handleNext}
                                disabled={!hasNext}
                                className="px-4 py-2 bg-blue-600 rounded-lg disabled:opacity-50 hover:bg-blue-700 transition"
                            >
                                Siguiente ▶
                            </button>
                        </div>
                    </div>

                    <div className="mt-4">
                        <p className="text-sm text-gray-400 mb-2">Servidores:</p>
                        <div className="flex gap-2 flex-wrap">
                            {servers.map((server, index) => (
                                <button
                                    key={index}
                                    onClick={() => {
                                        setSelectedServer(index)
                                        setIsLoadingPlayer(true)
                                    }}
                                    className={`px-3 py-1 rounded-lg text-sm transition ${
                                        selectedServer === index
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    }`}
                                >
                                    {server.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">📺 Lista de episodios</h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                    {episodes.map((ep: any) => (
                        <Link
                            key={ep.id}
                            to="/ver/$id/$episodeId"
                            params={{ id, episodeId: String(ep.number) }}
                            className={`px-3 py-2 rounded-lg text-center text-sm transition ${
                                ep.number === episodeNumber
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                            }`}
                        >
                            Ep. {ep.number}
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    )
}