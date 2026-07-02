import { AnimeCard } from './anime-card'
import type { AnimeResult } from '@/lib/anilist'

interface AnimeGridProps {
  animes: AnimeResult[]
  columns?: number
}

export function AnimeGrid({ animes, columns = 5 }: AnimeGridProps) {
  if (!animes || animes.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No se encontraron animes
      </div>
    )
  }

  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-${columns} gap-4`}>
      {animes.map((anime) => (
        <AnimeCard key={anime.id} anime={anime} />
      ))}
    </div>
  )
}