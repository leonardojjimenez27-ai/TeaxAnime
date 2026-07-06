import { Link, useNavigate } from "@tanstack/react-router";
import { Menu, Flame, Tv, Compass } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { SearchBar } from "./SearchBar";

const NAV = [
  { to: "/", label: "Inicio", icon: Flame },
  { to: "/catalogo", label: "Catálogo", icon: Tv },
  { to: "/generos", label: "Géneros", icon: Compass },
] as const;

export function SiteHeader() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const query = q.trim();
    if (!query) return;
    navigate({ to: "/buscar", search: { q: query, page: 1 } });
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4">
        {/* Menú móvil */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden" aria-label="Abrir menú">
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 border-border bg-card">
            <nav className="mt-8 flex flex-col gap-1">
              {NAV.map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-secondary"
                  activeProps={{ className: "bg-secondary" }}
                >
                  <n.icon className="h-4 w-4" />
                  {n.label}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 flex-shrink-0">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--gradient-primary)] font-display text-base font-bold text-primary-foreground shadow-[var(--shadow-glow)]">
            T
          </span>
          <span className="font-display text-xl font-bold tracking-tight">
            Teax<span className="gradient-text">Anime</span>
          </span>
        </Link>

        {/* Navegación desktop */}
        <nav className="ml-6 hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              activeProps={{ className: "bg-secondary text-foreground" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        {/* 🔥 BUSCADOR EN VIVO (reemplaza el formulario anterior) */}
        <div className="ml-auto flex w-full max-w-sm items-center">
          <SearchBar />
        </div>
      </div>
    </header>
  );
}