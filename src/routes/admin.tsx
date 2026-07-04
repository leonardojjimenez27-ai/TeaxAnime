// src/routes/admin.tsx
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { extractAllEpisodes, saveTokensToLocalStorage, exportTokensAsCode } from '@/lib/player/batch-extractor'

export const Route = createFileRoute('/admin')({
    component: AdminComponent,
})

function AdminComponent() {
    const [animeTitle, setAnimeTitle] = useState('')
    const [totalEpisodes, setTotalEpisodes] = useState(12)
    const [loading, setLoading] = useState(false)
    const [results, setResults] = useState<{ episode: number; url: string | null }[]>([])
    const [progress, setProgress] = useState(0)

    const handleExtract = async () => {
        if (!animeTitle || totalEpisodes < 1) {
            alert('Ingresa un título y número de episodios válido')
            return
        }

        setLoading(true)
        setResults([])
        setProgress(0)

        try {
            const extracted = await extractAllEpisodes(animeTitle, totalEpisodes)
            setResults(extracted)
            setProgress(100)
            
            // Guardar automáticamente
            saveTokensToLocalStorage(animeTitle, extracted)
            
            const found = extracted.filter(r => r.url !== null).length
            alert(`✅ Extracción completada!\n${found} de ${totalEpisodes} episodios encontrados`)
        } catch (error) {
            console.error('Error:', error)
            alert('Error al extraer episodios')
        } finally {
            setLoading(false)
        }
    }

    const handleExportCode = () => {
        if (results.length === 0) {
            alert('Primero extrae los episodios')
            return
        }
        const code = exportTokensAsCode(animeTitle, results)
        navigator.clipboard.writeText(code)
        alert('✅ Código copiado al portapapeles!')
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6">🔧 Administrador de Tokens</h1>
            <p className="text-gray-400 mb-6">
                Extrae automáticamente todos los tokens de Blogger de un anime
            </p>

            <div className="bg-gray-800 rounded-lg p-6">
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Título del Anime</label>
                    <input
                        type="text"
                        value={animeTitle}
                        onChange={(e) => setAnimeTitle(e.target.value)}
                        placeholder="Ej: Attack on Titan"
                        className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Número de Episodios</label>
                    <input
                        type="number"
                        value={totalEpisodes}
                        onChange={(e) => setTotalEpisodes(parseInt(e.target.value) || 0)}
                        min="1"
                        max="999"
                        className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={handleExtract}
                        disabled={loading}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition disabled:opacity-50"
                    >
                        {loading ? 'Extrayendo...' : '🔍 Extraer Todos'}
                    </button>
                    
                    {results.length > 0 && (
                        <button
                            onClick={handleExportCode}
                            className="px-6 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition"
                        >
                            📋 Exportar Código
                        </button>
                    )}
                </div>

                {loading && (
                    <div className="mt-4">
                        <div className="w-full bg-gray-700 rounded-full h-2">
                            <div 
                                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                        <p className="text-sm text-gray-400 mt-2">Extrayendo episodios...</p>
                    </div>
                )}

                {results.length > 0 && (
                    <div className="mt-6">
                        <h3 className="text-lg font-semibold mb-2">Resultados:</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-60 overflow-y-auto">
                            {results.map((result) => (
                                <div
                                    key={result.episode}
                                    className={`p-2 rounded-lg text-center text-sm ${
                                        result.url ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
                                    }`}
                                >
                                    Ep. {result.episode}
                                    {result.url ? ' ✅' : ' ❌'}
                                </div>
                            ))}
                        </div>
                        <p className="text-sm text-gray-400 mt-2">
                            {results.filter(r => r.url !== null).length} de {results.length} episodios encontrados
                        </p>
                    </div>
                )}
            </div>

            <div className="mt-6 bg-gray-800 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-2">💡 Instrucciones:</h3>
                <ol className="text-sm text-gray-400 list-decimal list-inside space-y-1">
                    <li>Ingresa el título del anime exactamente como aparece en VerAnimeOnline</li>
                    <li>Ingresa el número total de episodios</li>
                    <li>Haz clic en "Extraer Todos" (puede tomar varios minutos)</li>
                    <li>Los tokens se guardarán automáticamente</li>
                    <li>Usa "Exportar Código" para copiar los tokens al código</li>
                </ol>
            </div>
        </div>
    )
}