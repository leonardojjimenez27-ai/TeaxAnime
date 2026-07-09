// src/lib/images.ts

export const DEFAULT_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='450' viewBox='0 0 300 450'%3E%3Crect width='300' height='450' fill='%232a2a2a'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial, sans-serif' font-size='20' fill='%23666' text-anchor='middle' dy='.3em'%3ENo Image%3C/text%3E%3C/svg%3E";

export function getEpisodeThumbnail(epNum: number): string {
    // Generar colores diferentes según el episodio
    const hue = (epNum * 37) % 360;
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='450' viewBox='0 0 300 450'%3E%3Crect width='300' height='450' fill='hsl(${hue}, 40%25, 15%25)'/%3E%3Ctext x='50%25' y='45%25' font-family='Arial, sans-serif' font-size='28' fill='%23666' text-anchor='middle' dy='.3em'%3EEP %3C/text%3E%3Ctext x='50%25' y='65%25' font-family='Arial, sans-serif' font-size='36' fill='%23888' text-anchor='middle' font-weight='bold'%3E${epNum}%3C/text%3E%3C/svg%3E`;
}

export function getSafeImage(url: string | null | undefined): string {
    if (!url) return DEFAULT_IMAGE;
    if (url.includes('via.placeholder.com')) return DEFAULT_IMAGE;
    return url;
}