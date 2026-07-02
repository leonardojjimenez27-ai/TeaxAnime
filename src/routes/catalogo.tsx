import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { AnimeGrid } from '@/components/anime-grid'
import { animeApi, ANIME_GENRES, GENRE_ES } from '@/lib/anilist'

export const Route = createFileRoute('/catalogo')({
  component: CatalogoComponent,
})

function CatalogoComponent() {
  const [animes, setAnimes] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedGenre, setSelectedGenre] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    async function loadAnimes() {
      setLoading(true)
      try {
        let result
        if (searchQuery) {
          result = await animeApi.search(searchQuery, currentPage)
        } else if (selectedGenre) {
          result = await animeApi.genre(selectedGenre, currentPage)
        } else {
          result = await animeApi.popular(currentPage)
        }
        
        setAnimes(result.results)
        setTotalPages(result.pageInfo.lastPage || 1)
      } catch (error) {
        console.error('Error loading catalog:', error)
        setAnimes([])
      } finally {
        setLoading(false)
      }
    }

    loadAnimes()
  }, [currentPage, selectedGenre, searchQuery])

  const handleGenreChange = (genre: string) => {
    setSelectedGenre(genre)
    setCurrentPage(1)
    setSearchQuery('')
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Catálogo</h1>
      
      {/* Búsqueda y filtros */}
      <div className="mb-6 space-y-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            placeholder="Buscar anime..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Buscar
          </button>
        </form>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleGenreChange('')}
            className={`px-3 py-1 rounded-full text-sm transition ${
              !selectedGenre ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Todos
          </button>
          {ANIME_GENRES.map((genre) => (
            <button
              key={genre}
              onClick={() => handleGenreChange(genre)}
              className={`px-3 py-1 rounded-full text-sm transition ${
                selectedGenre === genre ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {GENRE_ES[genre] || genre}
            </button>
          ))}
        </div>
      </div>

      {/* Resultados */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-500">Cargando animes...</p>
        </div>
      ) : animes.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No se encontraron animes
        </div>
      ) : (
        <>
          <AnimeGrid animes={animes} />
          
          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-gray-700 rounded-lg disabled:opacity-50 hover:bg-gray-600 transition"
              >
                Anterior
              </button>
              <span className="px-4 py-2 text-gray-300">
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
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