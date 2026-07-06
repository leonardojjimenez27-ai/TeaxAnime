// src/routes/admin.tsx
import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
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
    
    // ============================================================
    // NUEVO: Estado para la gestión de tokens
    // ============================================================
    const [savedTokens, setSavedTokens] = useState<Record<string, Record<number, string>>>({})
    const [selectedToken, setSelectedToken] = useState<string | null>(null)
    const [importStatus, setImportStatus] = useState<string | null>(null)
    const [showConfirmModal, setShowConfirmModal] = useState(false)
    const [tokenToDelete, setTokenToDelete] = useState<string | null>(null)
    const [updateStatus, setUpdateStatus] = useState<string | null>(null)
    
    // ============================================================
    // NUEVO: Estado para caché
    // ============================================================
    const [cacheStats, setCacheStats] = useState<{ size: number; keys: string[] } | null>(null)
    const [cacheStatus, setCacheStatus] = useState<string | null>(null)

    // ============================================================
    // Cargar tokens al montar el componente
    // ============================================================
    useEffect(() => {
        loadTokens()
    }, [])

    const loadTokens = () => {
        try {
            const saved = localStorage.getItem('blogger_tokens')
            if (saved) {
                setSavedTokens(JSON.parse(saved))
            } else {
                setSavedTokens({})
            }
        } catch (e) {
            console.error('Error cargando tokens:', e)
        }
    }

    // ============================================================
    // Función para extraer episodios (existente)
    // ============================================================
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
            
            // Recargar tokens después de guardar
            loadTokens()
            
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

    // ============================================================
    // NUEVO: Eliminar un token específico
    // ============================================================
    const handleDeleteToken = (slug: string) => {
        setTokenToDelete(slug)
        setShowConfirmModal(true)
    }

    const confirmDelete = () => {
        if (!tokenToDelete) return
        
        const newTokens = { ...savedTokens }
        delete newTokens[tokenToDelete]
        
        localStorage.setItem('blogger_tokens', JSON.stringify(newTokens))
        setSavedTokens(newTokens)
        setShowConfirmModal(false)
        setTokenToDelete(null)
        setImportStatus(`🗑️ Eliminado: ${tokenToDelete}`)
        
        if (selectedToken === tokenToDelete) {
            setSelectedToken(null)
        }
        
        setTimeout(() => setImportStatus(null), 3000)
    }

    const cancelDelete = () => {
        setShowConfirmModal(false)
        setTokenToDelete(null)
    }

    // ============================================================
    // NUEVO: Exportar tokens a archivo JSON
    // ============================================================
    const handleExportTokens = () => {
        try {
            const saved = localStorage.getItem('blogger_tokens')
            if (!saved || saved === '{}') {
                alert('⚠️ No hay tokens para exportar')
                return
            }

            const data = JSON.parse(saved)
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            
            const link = document.createElement('a')
            link.href = url
            link.download = `blogger-tokens-${new Date().toISOString().split('T')[0]}.json`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)
            
            setImportStatus(`✅ Exportados ${Object.keys(data).length} animes`)
            setTimeout(() => setImportStatus(null), 3000)
        } catch (error) {
            console.error('Error exportando:', error)
            alert('Error al exportar los tokens')
        }
    }

    // ============================================================
    // NUEVO: Importar tokens desde archivo JSON
    // ============================================================
    const handleImportTokens = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string
                const importedData = JSON.parse(content)
                
                if (typeof importedData !== 'object' || Array.isArray(importedData)) {
                    alert('❌ El archivo no tiene el formato correcto')
                    return
                }

                const action = confirm(
                    '¿Cómo quieres importar los datos?\n\n' +
                    '✅ "Aceptar" → Reemplazar todos los tokens actuales\n' +
                    '❌ "Cancelar" → Fusionar con los tokens existentes'
                )

                let newTokens = {}
                if (action) {
                    newTokens = importedData
                    setImportStatus(`✅ Importados ${Object.keys(importedData).length} animes (reemplazado)`)
                } else {
                    const currentTokens = JSON.parse(localStorage.getItem('blogger_tokens') || '{}')
                    newTokens = { ...currentTokens, ...importedData }
                    setImportStatus(`✅ Importados ${Object.keys(importedData).length} animes (fusionado)`)
                }

                localStorage.setItem('blogger_tokens', JSON.stringify(newTokens))
                setSavedTokens(newTokens)
                
                setTimeout(() => setImportStatus(null), 3000)
            } catch (error) {
                console.error('Error importando:', error)
                alert('❌ Error al leer el archivo. Asegúrate de que sea un JSON válido.')
            }
        }
        reader.readAsText(file)
        event.target.value = ''
    }

    // ============================================================
    // NUEVO: Limpiar todos los tokens
    // ============================================================
    const handleClearAllTokens = () => {
        if (confirm('⚠️ ¿Estás seguro de eliminar TODOS los tokens? Esta acción no se puede deshacer.')) {
            localStorage.removeItem('blogger_tokens')
            setSavedTokens({})
            setSelectedToken(null)
            setImportStatus('🗑️ Todos los tokens eliminados')
            setTimeout(() => setImportStatus(null), 3000)
        }
    }

    // ============================================================
    // NUEVO: Ver detalles de un token
    // ============================================================
    const handleSelectToken = (slug: string) => {
        setSelectedToken(selectedToken === slug ? null : slug)
    }

    // ============================================================
    // NUEVO: Copiar token al portapapeles
    // ============================================================
    const handleCopyToken = (slug: string) => {
        const token = savedTokens[slug]
        if (!token) return
        
        const text = `${slug}: ${Object.keys(token).length} episodios`
        navigator.clipboard.writeText(text)
        setImportStatus(`📋 Copiado: ${slug}`)
        setTimeout(() => setImportStatus(null), 2000)
    }

    // ============================================================
    // NUEVO: Función para actualización manual
    // ============================================================
    const handleManualUpdate = async () => {
        setUpdateStatus('🔄 Buscando episodios nuevos...')
        try {
            const { manualUpdate } = await import('@/lib/tokens/auto-updater')
            await manualUpdate()
            setUpdateStatus('✅ Actualización completada')
            loadTokens()
            setTimeout(() => setUpdateStatus(null), 3000)
        } catch (error) {
            console.error('Error en actualización:', error)
            setUpdateStatus('❌ Error en actualización')
            setTimeout(() => setUpdateStatus(null), 3000)
        }
    }

    // ============================================================
    // 🔥 NUEVO: Funciones de gestión de caché (Paso 5)
    // ============================================================
    
    // Ver estadísticas del caché
    const handleViewCacheStats = async () => {
        setCacheStatus('📊 Obteniendo estadísticas...')
        try {
            const response = await fetch('/api/cache/stats')
            const data = await response.json()
            if (data.success) {
                setCacheStats(data.stats)
                setCacheStatus(`📊 Caché: ${data.stats.size} elementos`)
                setTimeout(() => setCacheStatus(null), 5000)
            } else {
                setCacheStatus('❌ Error obteniendo estadísticas')
                setTimeout(() => setCacheStatus(null), 3000)
            }
        } catch (error) {
            console.error('Error obteniendo estadísticas:', error)
            setCacheStatus('❌ Error de conexión')
            setTimeout(() => setCacheStatus(null), 3000)
        }
    }

    // Limpiar caché del servidor
    const handleClearServerCache = async () => {
        if (confirm('⚠️ ¿Estás seguro de limpiar el caché del servidor?')) {
            setCacheStatus('🧹 Limpiando caché del servidor...')
            try {
                const response = await fetch('/api/cache/clear', { method: 'DELETE' })
                const data = await response.json()
                if (data.success) {
                    setCacheStats(null)
                    setCacheStatus('🧹 Caché del servidor limpiado')
                    setTimeout(() => setCacheStatus(null), 3000)
                } else {
                    setCacheStatus('❌ Error limpiando caché')
                    setTimeout(() => setCacheStatus(null), 3000)
                }
            } catch (error) {
                console.error('Error limpiando caché:', error)
                setCacheStatus('❌ Error de conexión')
                setTimeout(() => setCacheStatus(null), 3000)
            }
        }
    }

    // Limpiar caché del navegador
    const handleClearBrowserCache = () => {
        if (confirm('⚠️ ¿Estás seguro de limpiar el caché del navegador?')) {
            try {
                // Usar sessionStorage directamente
                const keysToRemove: string[] = []
                for (let i = 0; i < sessionStorage.length; i++) {
                    const key = sessionStorage.key(i)
                    if (key && key.startsWith('browser_cache_')) {
                        keysToRemove.push(key)
                    }
                }
                for (const key of keysToRemove) {
                    sessionStorage.removeItem(key)
                }
                setCacheStats(null)
                setCacheStatus(`🧹 Caché del navegador limpiado (${keysToRemove.length} elementos)`)
                setTimeout(() => setCacheStatus(null), 3000)
            } catch (error) {
                console.error('Error limpiando caché del navegador:', error)
                setCacheStatus('❌ Error limpiando caché')
                setTimeout(() => setCacheStatus(null), 3000)
            }
        }
    }

    // ============================================================
    // Renderizado
    // ============================================================
    const totalAnimes = Object.keys(savedTokens).length
    const totalEpisodios = Object.values(savedTokens).reduce(
        (sum, token) => sum + Object.keys(token).length, 0
    )

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6">🔧 Administrador de Tokens</h1>
            <p className="text-gray-400 mb-6">
                Extrae automáticamente todos los tokens de Blogger de un anime
            </p>

            {/* SECCIÓN DE EXTRACCIÓN (existente) */}
            <div className="bg-gray-800 rounded-lg p-6 mb-6">
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

                <div className="flex gap-3 flex-wrap">
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

            {/* SECCIÓN DE GESTIÓN DE TOKENS */}
            <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                    <h2 className="text-2xl font-bold">📦 Tokens Guardados</h2>
                    <div className="flex gap-2 flex-wrap">
                        <button
                            onClick={handleExportTokens}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition text-sm"
                        >
                            💾 Exportar JSON
                        </button>
                        <label className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition text-sm cursor-pointer">
                            📂 Importar JSON
                            <input
                                type="file"
                                accept=".json"
                                onChange={handleImportTokens}
                                className="hidden"
                            />
                        </label>
                        <button
                            onClick={handleClearAllTokens}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition text-sm"
                        >
                            🗑️ Limpiar todo
                        </button>
                        <button
                            onClick={handleManualUpdate}
                            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg transition text-sm"
                        >
                            🔄 Buscar episodios nuevos
                        </button>
                    </div>
                </div>

                {/* Estadísticas */}
                <div className="flex gap-4 mb-4 text-sm flex-wrap">
                    <span className="text-gray-400">📊 Animes: <span className="text-white font-semibold">{totalAnimes}</span></span>
                    <span className="text-gray-400">📺 Episodios totales: <span className="text-white font-semibold">{totalEpisodios}</span></span>
                </div>

                {updateStatus && (
                    <div className="mb-4 p-3 bg-gray-700 rounded-lg text-sm text-center text-white">
                        {updateStatus}
                    </div>
                )}

                {importStatus && (
                    <div className="mb-4 p-3 bg-gray-700 rounded-lg text-sm text-center text-white">
                        {importStatus}
                    </div>
                )}

                {totalAnimes === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <p className="text-lg">No hay tokens guardados</p>
                        <p className="text-sm">Extrae algunos episodios para comenzar</p>
                    </div>
                ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {Object.entries(savedTokens).map(([slug, episodes]) => {
                            const episodeCount = Object.keys(episodes).length
                            const isSelected = selectedToken === slug
                            const episodeNumbers = Object.keys(episodes).map(Number).sort((a, b) => a - b)

                            return (
                                <div key={slug} className="bg-gray-700 rounded-lg overflow-hidden">
                                    <div 
                                        className="flex justify-between items-center p-3 cursor-pointer hover:bg-gray-600 transition"
                                        onClick={() => handleSelectToken(slug)}
                                    >
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <span className="font-mono text-sm truncate">{slug}</span>
                                            <span className="text-xs bg-blue-600 px-2 py-0.5 rounded-full">
                                                {episodeCount} eps
                                            </span>
                                        </div>
                                        <div className="flex gap-2 flex-shrink-0">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleCopyToken(slug)
                                                }}
                                                className="px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded text-xs transition"
                                                title="Copiar información"
                                            >
                                                📋
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleDeleteToken(slug)
                                                }}
                                                className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs transition"
                                                title="Eliminar este token"
                                            >
                                                🗑️
                                            </button>
                                            <span className="text-gray-400 text-xs">
                                                {isSelected ? '▲' : '▼'}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    {isSelected && (
                                        <div className="p-3 bg-gray-800 border-t border-gray-600">
                                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-1 max-h-40 overflow-y-auto">
                                                {episodeNumbers.map((num) => (
                                                    <div key={num} className="text-xs bg-gray-700 p-1 rounded text-center">
                                                        Ep. {num}
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="mt-2 flex gap-2 flex-wrap">
                                                <button
                                                    onClick={() => {
                                                        const text = `${slug}:\n${episodeNumbers.map(n => `  ${n}: ${episodes[n]}`).join('\n')}`
                                                        navigator.clipboard.writeText(text)
                                                        setImportStatus(`📋 Copiados ${episodeCount} episodios de ${slug}`)
                                                        setTimeout(() => setImportStatus(null), 2000)
                                                    }}
                                                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs transition"
                                                >
                                                    📋 Copiar episodios
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        const code = `'${slug}': {\n${episodeNumbers.map(n => `    ${n}: '${episodes[n]}'`).join(',\n')}\n},`
                                                        navigator.clipboard.writeText(code)
                                                        setImportStatus(`📋 Código exportado para ${slug}`)
                                                        setTimeout(() => setImportStatus(null), 2000)
                                                    }}
                                                    className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-xs transition"
                                                >
                                                    📋 Exportar código
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* ============================================================
                🔥 SECCIÓN DE GESTIÓN DE CACHÉ (Paso 5)
            ============================================================ */}
            <div className="mt-6 bg-gray-800 rounded-lg p-6">
                <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                    <h2 className="text-2xl font-bold">⚡ Gestión de Caché</h2>
                    <div className="flex gap-2 flex-wrap">
                        <button
                            onClick={handleViewCacheStats}
                            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 rounded-lg transition text-sm"
                        >
                            📊 Ver caché
                        </button>
                        <button
                            onClick={handleClearServerCache}
                            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg transition text-sm"
                        >
                            🗑️ Limpiar caché servidor
                        </button>
                        <button
                            onClick={handleClearBrowserCache}
                            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 rounded-lg transition text-sm"
                        >
                            🗑️ Limpiar caché navegador
                        </button>
                    </div>
                </div>

                {/* Estado del caché */}
                {cacheStatus && (
                    <div className="mb-4 p-3 bg-gray-700 rounded-lg text-sm text-center text-white">
                        {cacheStatus}
                    </div>
                )}

                {/* Estadísticas del caché */}
                {cacheStats && (
                    <div className="mt-4 p-3 bg-gray-700 rounded-lg text-sm">
                        <p className="text-white font-semibold">📊 Estadísticas del caché</p>
                        <p className="text-gray-300">Elementos: {cacheStats.size}</p>
                        <div className="mt-2 max-h-32 overflow-y-auto">
                            {cacheStats.keys.slice(0, 10).map(key => (
                                <div key={key} className="text-xs text-gray-400 truncate font-mono">
                                    {key}
                                </div>
                            ))}
                            {cacheStats.keys.length > 10 && (
                                <div className="text-xs text-gray-500 mt-1">
                                    ... y {cacheStats.keys.length - 10} más
                                </div>
                            )}
                            {cacheStats.keys.length === 0 && (
                                <div className="text-xs text-gray-500">El caché está vacío</div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* MODAL DE CONFIRMACIÓN */}
            {showConfirmModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                    <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-xl font-bold mb-4">⚠️ Confirmar eliminación</h3>
                        <p className="text-gray-300 mb-2">
                            ¿Estás seguro de que quieres eliminar el token:
                        </p>
                        <p className="text-white font-mono bg-gray-700 p-2 rounded mb-4 break-all">
                            {tokenToDelete}
                        </p>
                        <p className="text-red-400 text-sm mb-4">
                            Esta acción no se puede deshacer.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={cancelDelete}
                                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg transition"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition"
                            >
                                🗑️ Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* INSTRUCCIONES (actualizadas) */}
            <div className="mt-6 bg-gray-800 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-2">💡 Instrucciones:</h3>
                <ol className="text-sm text-gray-400 list-decimal list-inside space-y-1">
                    <li>Ingresa el título del anime exactamente como aparece en VerAnimeOnline</li>
                    <li>Ingresa el número total de episodios</li>
                    <li>Haz clic en "Extraer Todos" (puede tomar varios minutos)</li>
                    <li>Los tokens se guardarán automáticamente</li>
                    <li>Usa "Exportar Código" para copiar los tokens al código</li>
                    <li className="text-blue-400">🆕 Puedes exportar/importar todos los tokens como archivo JSON</li>
                    <li className="text-blue-400">🆕 Haz clic en un token para ver sus episodios</li>
                    <li className="text-blue-400">🆕 Elimina tokens que ya no necesites</li>
                    <li className="text-yellow-400">🆕 Usa "Buscar episodios nuevos" para actualizar automáticamente</li>
                    <li className="text-teal-400">⚡ Nueva sección de gestión de caché para mejorar el rendimiento</li>
                </ol>
            </div>
        </div>
    )
}