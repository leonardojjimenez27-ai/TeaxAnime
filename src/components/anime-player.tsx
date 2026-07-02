import { useEffect, useRef, useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import type { StreamSource, StreamSubtitle } from "@/lib/anilist";

const PLAYER_VOLUME_KEY = "anime-player-volume";
const PLAYER_TIME_KEY = "anime-player-time";

interface Props {
  sources: StreamSource[];
  subtitles?: StreamSubtitle[];
  poster?: string;
}

function pickDefault(sources: StreamSource[]): StreamSource | undefined {
  if (!sources.length) return undefined;
  const preferred =
    sources.find((s) => s.quality === "default") ||
    sources.find((s) => s.quality === "auto") ||
    sources.find((s) => s.quality === "1080p") ||
    sources.find((s) => s.quality === "720p");
  return preferred ?? sources[0];
}

export function AnimePlayer({ sources, subtitles, poster }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [current, setCurrent] = useState<StreamSource | undefined>(() => pickDefault(sources));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setCurrent(pickDefault(sources));
  }, [sources]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !current) return;
    setError(null);
    setLoading(true);

    const savedVolume = localStorage.getItem(PLAYER_VOLUME_KEY);

    if (savedVolume) {
      const volume = Number(savedVolume);

      if (!Number.isNaN(volume)) {
        video.volume = Math.min(Math.max(volume, 0), 1);
      }
    }

    let hls: import("hls.js").default | null = null;
    let cancelled = false;

    const src = current.url;
    const isM3U8 = current.isM3U8 || src.includes(".m3u8");

    async function attach() {
      if (!video) return;
      if (!isM3U8) {
        video.src = src;
        return;
      }
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = src;
        return;
      }
      const Hls = (await import("hls.js")).default;
      if (cancelled) return;
      if (Hls.isSupported()) {
        hls = new Hls({ enableWorker: true });
        hls.loadSource(src);
        hls.attachMedia(video);
        hls.on(Hls.Events.ERROR, (_e, data) => {
          if (data.fatal) setError("No se pudo cargar el video. Prueba otra calidad o servidor.");
        });
      } else {
        setError("Tu navegador no soporta HLS.");
      }
    }
    attach();

    const handleVolume = () => {
      localStorage.setItem(
        PLAYER_VOLUME_KEY,
        video.volume.toString(),
      );
    };

    video.addEventListener("volumechange", handleVolume);

    return () => {
      cancelled = true;

      video.removeEventListener("volumechange", handleVolume);

      if (hls) {
        hls.destroy();
      }
    };
  }, [current]);

  if (!sources.length) {
    return (
      <div className="grid aspect-video w-full place-items-center rounded-xl border border-border/60 bg-card text-center">
        <div className="flex flex-col items-center gap-2 p-6 text-muted-foreground">
          <AlertCircle className="h-6 w-6" />
          <p>No hay fuentes disponibles para este episodio.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-xl border border-border/60 bg-black shadow-[var(--shadow-glow)]">
        <video
          ref={videoRef}
          controls
          playsInline
          poster={poster}
          crossOrigin="anonymous"
          className="aspect-video w-full bg-black"
          onWaiting={() => setLoading(true)}
          onPlaying={() => setLoading(false)}
          onCanPlay={() => setLoading(false)}
          onError={() => setError("Error al reproducir.")}
        >
          {subtitles?.filter((s) => s.lang !== "Thumbnails").map((s, i) => (
            <track
              key={`${s.lang}-${i}`}
              src={s.url}
              kind="subtitles"
              srcLang={s.lang.slice(0, 2).toLowerCase()}
              label={s.lang}
              default={s.lang.toLowerCase().includes("english") && i === 0}
            />
          ))}
        </video>
        {loading && !error ? (
          <div className="pointer-events-none absolute inset-0 grid place-items-center bg-black/30">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : null}
        {error ? (
          <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-destructive/90 px-3 py-2 text-sm text-destructive-foreground">
            <AlertCircle className="h-4 w-4" /> {error}
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">Calidad:</span>
        {sources.map((s, i) => (
          <button
            key={`${s.quality}-${i}`}
            onClick={() => setCurrent(s)}
            className={`rounded-md border px-2 py-1 text-xs transition-colors ${
              current?.url === s.url
                ? "border-primary bg-primary/20 text-foreground"
                : "border-border bg-secondary/50 text-muted-foreground hover:text-foreground"
            }`}
          >
            {s.quality || `Fuente ${i + 1}`}
          </button>
        ))}
      </div>
    </div>
  );
}
