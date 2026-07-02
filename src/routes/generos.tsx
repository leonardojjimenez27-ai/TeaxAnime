import { createFileRoute } from '@tanstack/react-router'
import { Link } from '@tanstack/react-router'
import { ANIME_GENRES, GENRE_ES, slugifyGenre } from '@/lib/anilist'

export const Route = createFileRoute('/generos')({
  component: GenerosComponent,
})

function GenerosComponent() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Géneros</h1>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {ANIME_GENRES.map((genre) => {
          const slug = slugifyGenre(genre)
          return (
            <Link
              key={genre}
              to="/genero/$slug"
              params={{ slug }}
              className="bg-gray-800 hover:bg-gray-700 transition p-6 rounded-lg text-center"
            >
              <h2 className="text-lg font-semibold text-white">
                {GENRE_ES[genre] || genre}
              </h2>
              <p className="text-sm text-gray-400 mt-1">{genre}</p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}