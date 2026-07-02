import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { AnimeGrid } from '@/components/anime-grid'
import { animeApi } from '@/lib/anilist'

export const Route = createFileRoute('/buscar')({
  component: SearchComponent,
})

function SearchComponent() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [animes, setAnimes] = useState([])
  const [loading, setLoading] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    try {
      const result = await animeApi.search(query)
      setAnimes(result.results)
    } catch (error) {
      console.error('Error searching:', error)
      setAnimes([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Búsqueda</h1>
      
      <form onSubmit={handleSearch} className="flex gap-2 mb-8">
        <input
          type="text"
          placeholder="Buscar anime..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Buscar
        </button>
      </form>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-500">Buscando...</p>
        </div>
      ) : query && animes.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No se encontraron resultados para "{query}"
        </div>
      ) : query && animes.length > 0 ? (
        <>
          <p className="text-gray-400 mb-4">{animes.length} resultados encontrados</p>
          <AnimeGrid animes={animes} />
        </>
      ) : (
        <div className="text-center py-12 text-gray-500">
          Escribe algo para buscar
        </div>
      )}
    </div>
  )
}