// src/components/Player.tsx
import { useState, useRef, useEffect } from 'react';
import { usePlayer } from '@/hooks/usePlayer';

interface PlayerProps {
    animeId: number;
    animeTitle: string;
    episodeNumber: number;
    onNext?: () => void;
    onPrevious?: () => void;
    hasNext?: boolean;
    hasPrevious?: boolean;
}

export function Player({ 
    animeId, 
    animeTitle, 
    episodeNumber,
    onNext, 
    onPrevious, 
    hasNext, 
    hasPrevious 
}: PlayerProps) {
    console.log('🎬 Player component - Renderizando con:', { animeTitle, episodeNumber });
    
    const { 
        servers, 
        currentServer, 
        currentUrl, 
        currentServerName, 
        currentServerType, 
        isActive, 
        loading, 
        error, 
        switchServer 
    } = usePlayer(animeTitle, episodeNumber);
    
    console.log('🎬 Player - Servidores:', servers.map(s => s.name));
    console.log('🎬 Player - URL actual:', currentUrl);
    
    const [isLoadingPlayer, setIsLoadingPlayer] = useState(true);
    const [iframeError, setIframeError] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [showSlowLoading, setShowSlowLoading] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (isLoadingPlayer) {
                setShowSlowLoading(true);
            }
        }, 3000);
        return () => clearTimeout(timer);
    }, [isLoadingPlayer]);

    useEffect(() => {
        setIsLoadingPlayer(true);
        setIframeError(false);
        setShowSlowLoading(false);
    }, [currentUrl]);

    const handleServerChange = (index: number) => {
        switchServer(index);
        setIsLoadingPlayer(true);
        setIframeError(false);
        setShowSlowLoading(false);
        if (videoRef.current) {
            videoRef.current.load();
        }
    };

    const handleVideoLoaded = () => {
        setIsLoadingPlayer(false);
        setShowSlowLoading(false);
    };

    const handleVideoError = () => {
        setIsLoadingPlayer(false);
        setIframeError(true);
    };

    const handleIframeLoad = () => {
        console.log('✅ Iframe cargado');
        setIsLoadingPlayer(false);
        setShowSlowLoading(false);
    };

    const handleIframeError = () => {
        console.error('❌ Error al cargar iframe');
        setIsLoadingPlayer(false);
        setIframeError(true);
    };

    if (loading) {
        return (
            <div className="bg-gray-900 rounded-lg overflow-hidden">
                <div className="relative aspect-video bg-black">
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <div className="text-center">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                            <p className="mt-4 text-white">Cargando reproductor...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const renderPlayer = () => {
        if (!currentUrl || !isActive) {
            return (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="text-center text-white">
                        <p className="text-yellow-400 text-lg">⚠️ No hay servidores disponibles</p>
                        <p className="text-sm text-gray-400 mt-2">Prueba con otro servidor</p>
                    </div>
                </div>
            );
        }

        if (currentServerType === 'video') {
            return (
                <>
                    <video
                        ref={videoRef}
                        className="w-full h-full"
                        controls
                        autoPlay
                        onLoadedData={handleVideoLoaded}
                        onError={handleVideoError}
                    >
                        <source src={currentUrl} type="video/mp4" />
                        <source src={currentUrl} type="video/m3u8" />
                    </video>
                    {isLoadingPlayer && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                            <div className="text-center">
                                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                                <p className="mt-4 text-white">Cargando video...</p>
                            </div>
                        </div>
                    )}
                </>
            );
        }

        return (
            <>
                {iframeError ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <div className="text-center text-white">
                            <p className="text-yellow-400 text-lg">⚠️ El servidor no está disponible</p>
                            <p className="text-sm text-gray-400 mt-2">Intenta con otro servidor</p>
                        </div>
                    </div>
                ) : (
                    <iframe
                        src={currentUrl}
                        className="w-full h-full"
                        allowFullScreen
                        allow="encrypted-media; picture-in-picture; autoplay; fullscreen; accelerometer; gyroscope"
                        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation allow-modals"
                        loading="eager"
                        referrerPolicy="no-referrer"
                        onLoad={handleIframeLoad}
                        onError={handleIframeError}
                    />
                )}
                {isLoadingPlayer && !iframeError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <div className="text-center">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                            <p className="mt-4 text-white">Cargando video...</p>
                            <p className="text-sm text-gray-400">Servidor: {currentServerName}</p>
                            {showSlowLoading && (
                                <p className="text-xs text-gray-500 mt-2">Esto está tomando más de lo esperado...</p>
                            )}
                        </div>
                    </div>
                )}
            </>
        );
    };

    return (
        <div className="bg-gray-900 rounded-lg overflow-hidden">
            <div className="relative aspect-video bg-black">
                {renderPlayer()}
            </div>

            <div className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                        <h3 className="text-xl font-semibold">{animeTitle}</h3>
                        <p className="text-gray-400">Episodio {episodeNumber}</p>
                        <p className="text-xs text-gray-500 mt-1">Servidor: {currentServerName}</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={onPrevious}
                            disabled={!hasPrevious}
                            className="px-4 py-2 bg-gray-700 rounded-lg disabled:opacity-50 hover:bg-gray-600 transition"
                        >
                            ◀ Anterior
                        </button>
                        <button
                            onClick={onNext}
                            disabled={!hasNext}
                            className="px-4 py-2 bg-blue-600 rounded-lg disabled:opacity-50 hover:bg-blue-700 transition"
                        >
                            Siguiente ▶
                        </button>
                    </div>
                </div>

                {servers.length > 0 && (
                    <div className="mt-4">
                        <p className="text-sm text-gray-400 mb-2">Servidores:</p>
                        <div className="flex gap-2 flex-wrap">
                            {servers.map((server, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleServerChange(index)}
                                    disabled={!server.active}
                                    className={`px-3 py-1 rounded-lg text-sm transition ${
                                        currentServer === index
                                            ? server.active 
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                            : server.active
                                                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                                : 'bg-gray-800 text-gray-500 cursor-not-allowed opacity-50'
                                    }`}
                                >
                                    {server.name}
                                    {!server.active && ' 🔴'}
                                    {currentServer === index && server.active && ' ✅'}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}