import { createServerFn } from '@tanstack/start'
import { animeApi } from '@/lib/anilist'

export const GET = createServerFn({
    method: 'GET',
    handler: async () => {
        try {
            // Obtener animes populares para el sitemap
            const { results } = await animeApi.popular(1)
            
            // Construir el sitemap XML
            const baseUrl = 'https://tudominio.com' // Cambia esto por tu dominio
            
            const urls = results.map(anime => `
                <url>
                    <loc>${baseUrl}/anime/${anime.id}</loc>
                    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
                    <changefreq>weekly</changefreq>
                    <priority>0.8</priority>
                </url>
            `).join('')

            const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>${baseUrl}/</loc>
        <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
    </url>
    <url>
        <loc>${baseUrl}/catalogo</loc>
        <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
        <changefreq>daily</changefreq>
        <priority>0.9</priority>
    </url>
    ${urls}
</urlset>`

            return new Response(xml, {
                headers: {
                    'Content-Type': 'application/xml',
                    'Cache-Control': 'public, max-age=3600',
                },
            })
        } catch (error) {
            console.error('Error generating sitemap:', error)
            return new Response('Error generating sitemap', { status: 500 })
        }
    }
})