# TeaxAnime — Plan de implementación

Sitio web para ver anime online usando la API pública de **Consumet** (proveedor **Zoro/AniWatch**, sub + dub HD), reproductor HLS integrado, diseño **oscuro neón morado/rosa** y SEO optimizado.

> Nota importante: las instancias públicas de Consumet pueden caerse o tener rate limits. Para que la web siga funcionando si la instancia falla, expondré la URL base como variable de entorno (`VITE_CONSUMET_BASE`) editable en 1 línea. Por defecto usaré `https://consumet-api-puce.vercel.app` (instancia comunitaria activa). Si la cambias, todo sigue funcionando.

## Páginas (rutas)

```text
/                    Home: trending, populares, recién agregados, top airing
/buscar              Búsqueda con resultados live (?q=...)
/catalogo            Catálogo paginado con filtros (género, tipo, estado)
/anime/$id           Ficha del anime: sinopsis, info, lista de episodios
/ver/$id/$episodeId  Reproductor HLS + selector de servidor/calidad + episodios
/generos             Lista de géneros
/genero/$slug        Animes por género (paginado)
/sitemap.xml         Sitemap dinámico (SSR)
```

Todos los `<Link>` usan rutas tipadas de TanStack Router (sin `<a href>` interpolado), así que toda navegación funciona sin recargar.

## Conexión a Consumet (Zoro)

Wrapper en `src/lib/anime-api.ts` con las llamadas:

- `GET /meta/anilist/trending` — home trending
- `GET /meta/anilist/popular` — populares
- `GET /meta/anilist/recent-episodes?provider=zoro` — últimos capítulos
- `GET /meta/anilist/airing-schedule` — top airing
- `GET /meta/anilist/{id}?provider=zoro` — ficha + episodios
- `GET /meta/anilist/watch/{episodeId}?provider=zoro` — fuentes HLS (m3u8) + subtítulos
- `GET /meta/anilist/advanced-search?query=...&page=...&genres=[]` — búsqueda y catálogo
- `GET /meta/anilist/genre?genres=[...]` — por género

Usaré **AniList como metadata layer** (siempre actualizado: animes nuevos y clásicos) con Zoro como provider de streaming → cubre todo el catálogo nuevo y antiguo con sus capítulos.

## Reproductor

- Componente `<AnimePlayer>` usando **hls.js** (Safari usa HLS nativo).
- Controles personalizados sobre `<video>`: play/pausa, volumen, fullscreen, selector de calidad, selector de subtítulos, selector de servidor (sub/dub), siguiente/anterior episodio.
- Lista de episodios al lado en desktop / abajo en mobile.

## Data layer

- **TanStack Query** + loaders de ruta con `ensureQueryData` (SSR + caché).
- `QueryClient` instanciado por request en `getRouter()` (ya está en el template).
- Búsqueda usa `validateSearch` (`?q=&page=`) → URL compartible.

## Diseño (Oscuro neón morado/rosa)

Tokens en `src/styles.css` (oklch):

- `--background` #0a0014 / `--card` #1a0033 / `--foreground` casi blanco
- `--primary` morado `#a855f7` con glow
- `--accent` rosa `#ec4899`
- `--gradient-primary`: linear-gradient morado→rosa para CTAs y hero
- `--shadow-glow`: sombra ne ón sutil en cards al hover
- Tipografía: **Outfit** (display) + **Inter** (body) vía `@fontsource`

Componentes (shadcn): Card, Button, Input, Badge, Skeleton, Pagination, Tabs, Sheet (menú mobile).

Layout:

- Header sticky con logo TeaxAnime (wordmark con gradiente), búsqueda y nav.
- Hero en home con carrusel de trending (poster grande + sinopsis + CTA "Ver ahora").
- Grids de tarjetas con poster, título, badges (sub/dub, EP n.º), hover con glow + zoom suave.
- Skeletons mientras carga, estados de error y "no encontrado" con CTA volver.
- Footer minimal con enlaces y disclaimer.

## SEO

- `head()` por ruta: title único, description, og:title/description/type/url, twitter card.
- Ficha y reproductor generan título y description desde datos (ej. _"Ver {anime} Episodio {n} Sub Español — TeaxAnime"_).
- **JSON-LD**: `WebSite` + `SearchAction` en root, `TVSeries` en ficha, `TVEpisode` en reproductor, `BreadcrumbList` en rutas profundas.
- Canonical relativo por ruta (leaf only).
- `public/robots.txt` con `Allow: /`.
- `src/routes/sitemap[.]xml.ts` dinámico: rutas estáticas + top animes (trending/popular paginado) y sus episodios.
- Imágenes con `loading="lazy"`, `alt` descriptivo, dimensiones explícitas.
- H1 único por página, HTML semántico (header/main/article/nav/footer).

## Performance

- Loaders con `staleTime` por tipo (trending 5min, ficha 1h).
- Preload de rutas en hover de `<Link>`.
- `hls.js` cargado dinámicamente solo en `/ver/...`.
- Imágenes con `fetchpriority="high"` en LCP del hero.

## Detalles técnicos

- Stack actual: TanStack Start + React + Tailwind v4 + shadcn (sin cambios).
- Dependencias nuevas: `hls.js`, `@fontsource/outfit`, `@fontsource/inter`.
- Variable: `VITE_CONSUMET_BASE` (con default hardcodeado por si no se setea).
- Sin backend propio (todo client-side fetch a Consumet); no se requiere Lovable Cloud.
- Manejo de errores: si Consumet devuelve error, mostrar estado claro con botón reintentar y sugerencia de cambiar instancia.

## Entregable

Después de aprobar este plan implemento todo de una vez: rutas, wrapper API, reproductor HLS, diseño completo, SEO, sitemap y robots.
