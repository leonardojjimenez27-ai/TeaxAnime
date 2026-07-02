import { createFileRoute } from '@tanstack/react-router'
import { AnimeGrid } from '@/components/anime-grid'
import { animeApi } from '@/lib/anilist'
import { useState, useEffect } from 'react'

export const Route = createFileRoute('/')({
  component: HomeComponent,
})

function HomeComponent() {
  const [trending, setTrending] = useState([])
  const [popular, setPopular] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        console.log('🚀 Cargando datos...')
        const [trendingData, popularData] = await Promise.all([
          animeApi.trending(1),
          animeApi.popular(1)
        ])
        
        console.log('✅ Datos cargados:', {
          trending: trendingData.results.length,
          popular: popularData.results.length
        })
        
        setTrending(trendingData.results)
        setPopular(popularData.results)
      } catch (error) {
        console.error('❌ Error:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

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

  if (trending.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-gray-500">No se encontraron animes</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">🔥 Tendencias</h1>
      <AnimeGrid animes={trending} />
      
      <h1 className="text-3xl font-bold mb-6 mt-12">⭐ Populares</h1>
      <AnimeGrid animes={popular} />
    </div>
  )
}