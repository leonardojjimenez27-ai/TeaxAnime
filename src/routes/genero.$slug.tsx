import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { AnimeGrid } from '@/components/anime-grid'
import { animeApi, genreFromSlug, GENRE_ES } from '@/lib/anilist'

export const Route = createFileRoute('/genero/$slug')({
  component: GeneroSlugComponent,
})

function GeneroSlugComponent() {
  const { slug } = Route.useParams()
  const [animes, setAnimes] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const genre = genreFromSlug(slug)
  const genreName = GENRE_ES[genre] || genre

  useEffect(() => {
    async function loadAnimes() {
      setLoading(true)
      try {
        const result = await animeApi.genre(genre, page)
        setAnimes(result.results)
        setTotalPages(result.pageInfo.lastPage || 1)
      } catch (error) {
        console.error('Error loading genre:', error)
        setAnimes([])
      } finally {
        setLoading(false)
      }
    }

    loadAnimes()
  }, [genre, page])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-500">Cargando animes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link to="/generos" className="text-blue-400 hover:text-blue-300 transition">
          ← Todos los géneros
        </Link>
        <h1 className="text-3xl font-bold mt-4">{genreName}</h1>
        <p className="text-gray-400">{animes.length} animes encontrados</p>
      </div>

      {animes.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No se encontraron animes de este género
        </div>
      ) : (
        <>
          <AnimeGrid animes={animes} />
          
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-gray-700 rounded-lg disabled:opacity-50 hover:bg-gray-600 transition"
              >
                Anterior
              </button>
              <span className="px-4 py-2 text-gray-300">
                Página {page} de {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 bg-gray-700 rounded-lg disabled:opacity-50 hover:bg-gray-600 transition"
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}