import { Link, useNavigate } from "@tanstack/react-router";
import { Menu, Flame, Tv, Compass, Moon, Sun } from "lucide-react";
import { useState, type FormEvent, useEffect } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { SearchBar } from "./SearchBar";

const NAV_ITEMS = [
  { to: "/", label: "Inicio", icon: Flame },
  { to: "/catalogo", label: "Catálogo", icon: Tv },
  { to: "/generos", label: "Géneros", icon: Compass },
] as const;

export function SiteHeader() {
  const navigate = useNavigate();
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [mounted, setMounted] = useState(false);

  // Inicializar tema
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    setTheme(initialTheme);
    document.documentElement.classList.add(initialTheme);
    setMounted(true);
  }, []);

  // Cambiar tema
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.classList.remove('dark', 'light');
    document.documentElement.classList.add(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/70 backdrop-blur-xl transition-colors duration-300">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4">
        {/* Menú móvil */}
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label="Abrir menú de navegación"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 border-border bg-card">
            <nav className="mt-8 flex flex-col gap-1" aria-label="Navegación móvil">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-secondary"
                  activeProps={{ className: "bg-secondary" }}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>

        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 flex-shrink-0"
          aria-label="Ir al inicio"
        >
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--gradient-primary)] font-display text-base font-bold text-primary-foreground shadow-[var(--shadow-glow)]">
            T
          </span>
          <span className="font-display text-xl font-bold tracking-tight">
            Teax<span className="gradient-text">Anime</span>
          </span>
        </Link>

        {/* Navegación desktop */}
        <nav className="ml-6 hidden items-center gap-1 md:flex" aria-label="Navegación principal">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              activeProps={{ className: "bg-secondary text-foreground" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Buscador + ThemeToggle */}
        <div className="ml-auto flex w-full max-w-sm items-center gap-2">
          <SearchBar />
          {mounted && (
            <button
              onClick={toggleTheme}
              className="relative h-9 w-9 rounded-lg bg-secondary/50 hover:bg-secondary transition-all duration-300 flex items-center justify-center group flex-shrink-0"
              aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              title={theme === 'dark' ? '☀️ Modo claro' : '🌙 Modo oscuro'}
            >
              {theme === 'dark' ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
              <span 
                className="absolute inset-0 rounded-lg transition-opacity duration-300 opacity-0 group-hover:opacity-100 pointer-events-none"
                style={{
                  boxShadow: theme === 'dark' 
                    ? '0 0 20px -4px color-mix(in oklab, var(--color-primary) 40%, transparent)'
                    : '0 0 20px -4px color-mix(in oklab, var(--color-primary) 30%, transparent)'
                }}
              />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}