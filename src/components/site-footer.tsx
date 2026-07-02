import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border/60 bg-background/40">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-[var(--gradient-primary)] font-display text-sm font-bold text-primary-foreground">
              T
            </span>
            <span className="font-display text-lg font-bold">
              Teax<span className="gradient-text">Anime</span>
            </span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Ver anime online en HD, sub y doblado. Animes nuevos, clásicos y todos sus episodios.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold">Explorar</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/" className="hover:text-foreground">Inicio</Link></li>
            <li><Link to="/catalogo" className="hover:text-foreground">Catálogo</Link></li>
            <li><Link to="/generos" className="hover:text-foreground">Géneros</Link></li>
            <li><Link to="/buscar" search={{ q: "", page: 1 }} className="hover:text-foreground">Buscar</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold">Aviso</h3>
          <p className="mt-3 text-sm text-muted-foreground">
            TeaxAnime no aloja archivos de video. Todo el contenido proviene de servicios públicos de
            terceros. Consulta los términos de cada fuente.
          </p>
        </div>
      </div>
      <div className="border-t border-border/60 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} TeaxAnime
      </div>
    </footer>
  );
}
