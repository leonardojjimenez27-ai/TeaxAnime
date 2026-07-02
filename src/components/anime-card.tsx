import { Link } from '@tanstack/react-router'
import type { AnimeResult } from '@/lib/anilist'

interface AnimeCardProps {
  anime: AnimeResult
}

export function AnimeCard({ anime }: AnimeCardProps) {
  return (
    <Link
      to="/anime/$id"
      params={{ id: String(anime.id) }}
      className="group block cursor-pointer"
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-gray-800">
        <img
          src={anime.image}
          alt={anime.title}
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = 'https://via.placeholder.com/300x450?text=No+Image'
          }}
        />
        {anime.averageScore && (
          <div className="absolute top-2 right-2 bg-black/70 px-2 py-1 rounded text-sm font-semibold text-yellow-400">
            ★ {(anime.averageScore / 10).toFixed(1)}
          </div>
        )}
        {anime.episodes && (
          <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-1 rounded text-xs">
            {anime.episodes} episodios
          </div>
        )}
      </div>
      <h3 className="mt-2 text-sm font-medium line-clamp-2 group-hover:text-blue-400">
        {anime.title}
      </h3>
      {anime.genres && anime.genres.length > 0 && (
        <p className="text-xs text-gray-400 line-clamp-1">
          {anime.genres.slice(0, 3).join(' • ')}
        </p>
      )}
    </Link>
  )
}