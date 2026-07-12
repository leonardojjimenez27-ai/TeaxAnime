// src/routes/ver.$id.$episodeId.tsx
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState, useEffect, useRef } from 'react'
import { animeApi } from '@/lib/anilist'
import { getFamilyEpisodes, groupTokensByFamily, getAnimeFamily, getEpisodesForCurrentSeason } from '@/lib/anime/season-grouping'
import { findCorrectSlug, normalizeTitle, getCombinedEpisodes } from '@/lib/anime/title-matcher'

// ============================================================
// FUNCIONES DINÁMICAS PARA DETECTAR TEMPORADAS
// ============================================================

// Función para cargar tokens desde localStorage
function loadTokens(): Record<string, Record<number, string>> {
    if (typeof window === 'undefined') return {};
    try {
        const saved = localStorage.getItem('blogger_tokens');
        if (saved) {
            return JSON.parse(saved);
        }
    } catch (e) {
        console.error('Error cargando tokens:', e);
    }
    return {};
}

// Función para limpiar el título
function cleanTitle(title: string): string {
    return title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}

// ============================================================
// FUNCIÓN: Obtener URL de episodio CON MAPEO DE NUMERACIÓN
// ============================================================

function getEpisodeUrl(animeTitle: string, episodeId: string, animeId?: string): string | null {
    const tokens = loadTokens();
    if (!tokens || Object.keys(tokens).length === 0) {
        console.log('❌ No hay tokens en localStorage');
        return null;
    }
    
    const episodeNum = Number(episodeId);
    console.log(`🔍 Buscando episodio ${episodeNum} para "${animeTitle}" (ID: ${animeId || 'N/A'})`);
    
    // ============================================================
    // 1. PRIMERO: Verificar si tiene partes combinadas
    // ============================================================
    if (animeId) {
        const combined = getCombinedEpisodes(tokens, animeId, animeTitle);
        if (combined && combined.total > 0) {
            console.log(`✅ Usando combinación automática: ${combined.total} episodios`);
            console.log(`📂 Slugs combinados:`, combined.slugs);
            
            // 🔥 MAPEO: Encontrar en qué slug está el episodio
            let counter = 1;
            for (const slug of combined.slugs) {
                if (tokens[slug]) {
                    const episodes = tokens[slug];
                    const episodeNumbers = Object.keys(episodes).map(Number).sort((a, b) => a - b);
                    console.log(`📺 "${slug}": ${episodeNumbers.length} episodios (${episodeNumbers.join(', ')})`);
                    
                    // Verificar si el episodio buscado está en este rango
                    if (episodeNum >= counter && episodeNum < counter + episodeNumbers.length) {
                        const relativeIndex = episodeNum - counter;
                        const originalEpisodeNumber = episodeNumbers[relativeIndex];
                        if (originalEpisodeNumber !== undefined && episodes[originalEpisodeNumber]) {
                            console.log(`✅ Episodio ${episodeNum} → "${slug}" (episodio original: ${originalEpisodeNumber})`);
                            return episodes[originalEpisodeNumber];
                        }
                    }
                    counter += episodeNumbers.length;
                }
            }
            
            // Si no encontró con el mapeo, intentar búsqueda directa en todos los slugs combinados
            for (const slug of combined.slugs) {
                if (tokens[slug] && tokens[slug][episodeNum]) {
                    console.log(`✅ Episodio encontrado en "${slug}" (directo)`);
                    return tokens[slug][episodeNum];
                }
            }
        }
    }
    
    // ============================================================
    // 2. Usar el sistema de mapeo de title-matcher
    // ============================================================
    if (animeId) {
        const result = findCorrectSlug(tokens, animeId, animeTitle);
        if (result) {
            const slug = result.slug;
            console.log(`✅ Slug encontrado por title-matcher: "${slug}"`);
            
            if (tokens[slug] && tokens[slug][episodeNum]) {
                console.log(`✅ Episodio encontrado en "${slug}"`);
                return tokens[slug][episodeNum];
            }
            
            // Buscar en slugs relacionados (ej: attack-on-titan-3-part-2)
            const allSlugs = Object.keys(tokens);
            for (const s of allSlugs) {
                if (s.includes(slug) || slug.includes(s)) {
                    if (tokens[s] && tokens[s][episodeNum]) {
                        console.log(`✅ Episodio encontrado en slug relacionado: "${s}"`);
                        return tokens[s][episodeNum];
                    }
                }
            }
        }
    }
    
    // ============================================================
    // 3. Búsqueda manual por título (fallback)
    // ============================================================
    console.log(`🔍 Buscando manualmente por título...`);
    const clean = cleanTitle(animeTitle);
    
    // Buscar en TODOS los slugs que contengan el título limpio
    const matchingSlugs: string[] = [];
    for (const slug of Object.keys(tokens)) {
        if (slug.includes(clean) || clean.includes(slug)) {
            matchingSlugs.push(slug);
        }
    }
    
    // Ordenar slugs por número (para que -part-2 venga después)
    matchingSlugs.sort((a, b) => {
        const numA = parseInt(a.match(/-(\d+)$/)?.[1] || '0');
        const numB = parseInt(b.match(/-(\d+)$/)?.[1] || '0');
        return numA - numB;
    });
    
    console.log(`📂 Slugs encontrados por coincidencia:`, matchingSlugs);
    
    // Buscar en todos los slugs coincidentes
    for (const slug of matchingSlugs) {
        if (tokens[slug] && tokens[slug][episodeNum]) {
            console.log(`✅ Episodio encontrado en "${slug}"`);
            return tokens[slug][episodeNum];
        }
    }
    
    console.log(`❌ No se encontró el episodio ${episodeNum} para "${animeTitle}"`);
    console.log(`💡 Sugerencia: Verifica que el token exista en localStorage`);
    return null;
}

// ============================================================
// FUNCIÓN: Detectar temporadas USANDO getEpisodesForCurrentSeason
// ============================================================

function detectSeasons(animeTitle: string, animeId?: string): { key: string; episodeCount: number }[] {
    const tokens = loadTokens();
    const seasons: { key: string; episodeCount: number }[] = [];
    
    if (animeId) {
        const result = getEpisodesForCurrentSeason(tokens, animeTitle, animeId);
        if (result && result.total > 0) {
            console.log(`✅ getEpisodesForCurrentSeason encontró ${result.total} episodios para "${animeTitle}"`);
            seasons.push({ key: result.seasonKey || 'all-episodes', episodeCount: result.total });
            return seasons;
        }
    }
    
    const clean = cleanTitle(animeTitle);
    const variants = [
        clean,
        animeTitle.toLowerCase().replace(/\s+/g, '-'),
        animeTitle.toLowerCase().replace(/\s+/g, '_'),
        animeTitle.toLowerCase().replace(/\s+/g, ''),
    ];
    
    for (let i = 1; i <= 20; i++) {
        variants.push(`${clean}-${i}`);
        variants.push(`${clean}-season-${i}`);
        variants.push(`${clean}-part-${i}`);
        variants.push(`${clean}-${i}-season`);
        variants.push(`${clean}-${i}-part`);
    }
    
    variants.push(`${clean}-final-season`);
    variants.push(`${clean}-the-final-season`);
    variants.push(`${clean}-final`);
    variants.push(`${clean}-the-final`);
    variants.push(`${clean}-final-season-part-1`);
    variants.push(`${clean}-final-season-part-2`);
    variants.push(`${clean}-final-season-part-3`);
    variants.push(`${clean}-the-final-season-part-1`);
    variants.push(`${clean}-the-final-season-part-2`);
    variants.push(`${clean}-the-final-season-part-3`);
    
    for (let i = 1; i <= 10; i++) {
        variants.push(`${clean}-part-${i}`);
        variants.push(`${clean}-parte-${i}`);
    }
    
    for (let i = 1; i <= 10; i++) {
        variants.push(`${clean}-cour-${i}`);
        variants.push(`${clean}-season-${i}-cour-1`);
        variants.push(`${clean}-season-${i}-cour-2`);
    }
    
    const uniqueVariants = [...new Set(variants)];
    
    for (const variant of uniqueVariants) {
        if (tokens[variant]) {
            const episodeCount = Object.keys(tokens[variant]).length;
            if (episodeCount > 0) {
                const exists = seasons.some(s => s.key === variant);
                if (!exists) {
                    seasons.push({ key: variant, episodeCount });
                }
            }
        }
    }
    
    seasons.sort((a, b) => b.episodeCount - a.episodeCount);
    return seasons;
}

function getTotalEpisodes(seasons: { key: string; episodeCount: number }[]): number {
    return seasons.reduce((sum, s) => sum + s.episodeCount, 0);
}

function getSeasonName(key: string, index: number): string {
    if (!key.match(/-\d+$/) && !key.includes('season') && !key.includes('part') && !key.includes('final')) {
        return 'Temporada 1';
    }
    
    const numMatch = key.match(/-(\d+)/);
    if (numMatch) {
        return `Temporada ${numMatch[1]}`;
    }
    
    if (key.includes('final')) {
        return 'Temporada Final';
    }
    
    return `Temporada ${index + 1}`;
}

function getSeasonKeyForEpisode(episodeNum: number, seasons: { key: string; episodeCount: number }[], animeId?: string): { key: string; relativeEpisode: number; seasonIndex: number } {
    let accumulated = 0;
    for (let i = 0; i < seasons.length; i++) {
        const season = seasons[i];
        if (episodeNum <= accumulated + season.episodeCount) {
            return {
                key: season.key,
                relativeEpisode: episodeNum - accumulated,
                seasonIndex: i
            };
        }
        accumulated += season.episodeCount;
    }
    return { key: '', relativeEpisode: episodeNum, seasonIndex: 0 };
}

// ============================================================
// MAPA DE EPISODIOS CONOCIDOS
// ============================================================

const KNOWN_EPISODES: Record<string, number> = {
    'one piece': 1122,
    'naruto': 220,
    'naruto shippuden': 500,
    'bleach': 366,
    'attack on titan': 87,
    'boku no hero academia': 150,
    'my hero academia': 150,
    'hunter x hunter': 148,
    'hunter x hunter 2011': 148,
    'death note': 37,
    'fullmetal alchemist brotherhood': 64,
    'sword art online': 96,
    'tokyo ghoul': 24,
    'dragon ball': 153,
    'dragon ball z': 291,
    'dragon ball super': 131,
    'jujutsu kaisen': 47,
    'demon slayer': 55,
    'kimetsu no yaiba': 55,
    'one punch man': 12,
    'one punch man 2': 12,
    'one punch man 3': 12,
};

function getKnownEpisodes(title: string): number {
    const titleLower = title.toLowerCase().trim();
    for (const [key, episodes] of Object.entries(KNOWN_EPISODES)) {
        if (titleLower.includes(key)) {
            return episodes;
        }
    }
    return 0;
}

// ============================================================
// 📝 SISTEMA DE COMENTARIOS CON NOMBRE Y CORREO OBLIGATORIOS (CORREO OCULTO)
// ============================================================

interface Comment {
    id: string;
    username: string;
    email: string; // Se guarda internamente pero NO se muestra
    text: string;
    timestamp: number;
    likes: number;
    replies: Comment[];
}

function getCommentsKey(animeId: string, episodeId: string): string {
    return `comments_${animeId}_${episodeId}`;
}

function loadComments(animeId: string, episodeId: string): Comment[] {
    try {
        const key = getCommentsKey(animeId, episodeId);
        const saved = localStorage.getItem(key);
        if (saved) {
            return JSON.parse(saved);
        }
    } catch (e) {
        console.error('Error cargando comentarios:', e);
    }
    return [];
}

function saveComments(animeId: string, episodeId: string, comments: Comment[]): void {
    try {
        const key = getCommentsKey(animeId, episodeId);
        localStorage.setItem(key, JSON.stringify(comments));
    } catch (e) {
        console.error('Error guardando comentarios:', e);
    }
}

function formatTime(timestamp: number): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now.getTime() - timestamp) / 1000);
    
    if (diff < 60) return 'Ahora mismo';
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
    return date.toLocaleDateString('es-ES');
}

function isValidEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

// ============================================================
// 🔥 COMPONENTE DE COMENTARIOS CON VALIDACIÓN (CORREO OCULTO)
// ============================================================

function CommentsSection({ animeId, episodeId, animeTitle }: { animeId: string; episodeId: string; animeTitle: string }) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [replyText, setReplyText] = useState('');
    const [showReplyInput, setShowReplyInput] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showLoginForm, setShowLoginForm] = useState(false);
    const [usernameError, setUsernameError] = useState('');
    const [emailError, setEmailError] = useState('');

    // Cargar datos del usuario desde localStorage
    useEffect(() => {
        const savedUsername = localStorage.getItem('comment_username');
        const savedEmail = localStorage.getItem('comment_email');
        
        if (savedUsername && savedEmail) {
            setUsername(savedUsername);
            setEmail(savedEmail);
            setShowLoginForm(false);
        } else {
            setShowLoginForm(true);
        }
    }, []);

    // Cargar comentarios
    useEffect(() => {
        const loaded = loadComments(animeId, episodeId);
        setComments(loaded);
        setIsLoading(false);
    }, [animeId, episodeId]);

    // Guardar comentarios cuando cambian
    useEffect(() => {
        if (!isLoading) {
            saveComments(animeId, episodeId, comments);
        }
    }, [comments, animeId, episodeId, isLoading]);

    const validateUser = (): boolean => {
        let valid = true;
        
        if (!username.trim() || username.trim().length < 3) {
            setUsernameError('El nombre debe tener al menos 3 caracteres');
            valid = false;
        } else {
            setUsernameError('');
        }
        
        if (!email.trim() || !isValidEmail(email.trim())) {
            setEmailError('Ingresa un correo electrónico válido');
            valid = false;
        } else {
            setEmailError('');
        }
        
        return valid;
    };

    const handleLogin = () => {
        if (validateUser()) {
            localStorage.setItem('comment_username', username.trim());
            localStorage.setItem('comment_email', email.trim());
            setShowLoginForm(false);
        }
    };

    const handleAddComment = () => {
        if (!username.trim() || !email.trim()) {
            setShowLoginForm(true);
            return;
        }
        
        if (!newComment.trim()) return;

        const comment: Comment = {
            id: `c_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            username: username.trim(),
            email: email.trim(),
            text: newComment.trim(),
            timestamp: Date.now(),
            likes: 0,
            replies: [],
        };

        setComments([comment, ...comments]);
        setNewComment('');
    };

    const handleAddReply = (parentId: string) => {
        if (!username.trim() || !email.trim()) {
            setShowLoginForm(true);
            return;
        }
        
        if (!replyText.trim()) return;

        const reply: Comment = {
            id: `r_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            username: username.trim(),
            email: email.trim(),
            text: replyText.trim(),
            timestamp: Date.now(),
            likes: 0,
            replies: [],
        };

        const updatedComments = comments.map(c => {
            if (c.id === parentId) {
                return { ...c, replies: [...c.replies, reply] };
            }
            return c;
        });

        setComments(updatedComments);
        setReplyText('');
        setShowReplyInput(null);
    };

    const handleLike = (commentId: string) => {
        const updatedComments = comments.map(c => {
            if (c.id === commentId) {
                return { ...c, likes: c.likes + 1 };
            }
            const updatedReplies = c.replies.map(r => {
                if (r.id === commentId) {
                    return { ...r, likes: r.likes + 1 };
                }
                return r;
            });
            return { ...c, replies: updatedReplies };
        });
        setComments(updatedComments);
    };

    const handleDeleteComment = (commentId: string) => {
        if (!confirm('¿Eliminar este comentario?')) return;
        const updatedComments = comments.filter(c => c.id !== commentId);
        setComments(updatedComments);
    };

    // ============================================================
    // 📝 COMPONENTE DE COMENTARIO - SIN MOSTRAR CORREO
    // ============================================================
    const CommentItem = ({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) => {
        // El correo NO se muestra, solo se guarda internamente

        return (
            <div className={`${isReply ? 'ml-8 mt-3' : 'mt-4'} bg-gray-800/50 rounded-lg p-4 border border-gray-700/50`}>
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-600/30 flex items-center justify-center text-blue-400 font-bold text-sm">
                            {comment.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <span className="font-semibold text-sm text-white">{comment.username}</span>
                            <span className="text-xs text-gray-400 ml-2">• {formatTime(comment.timestamp)}</span>
                        </div>
                    </div>
                    <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="text-gray-500 hover:text-red-400 text-xs transition"
                        title="Eliminar"
                    >
                        🗑️
                    </button>
                </div>
                <p className="text-gray-300 text-sm mt-2 leading-relaxed whitespace-pre-wrap break-words">
                    {comment.text}
                </p>
                <div className="flex items-center gap-4 mt-2">
                    <button
                        onClick={() => handleLike(comment.id)}
                        className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-400 transition"
                    >
                        ❤️ {comment.likes > 0 && <span>{comment.likes}</span>}
                    </button>
                    {!isReply && (
                        <button
                            onClick={() => setShowReplyInput(showReplyInput === comment.id ? null : comment.id)}
                            className="text-xs text-gray-400 hover:text-blue-400 transition"
                        >
                            💬 Responder
                        </button>
                    )}
                </div>
                {showReplyInput === comment.id && !isReply && (
                    <div className="mt-3 flex gap-2">
                        <input
                            type="text"
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Escribe una respuesta..."
                            className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleAddReply(comment.id);
                                }
                            }}
                        />
                        <button
                            onClick={() => handleAddReply(comment.id)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm text-white transition"
                        >
                            Responder
                        </button>
                    </div>
                )}
                {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-3 space-y-2">
                        {comment.replies.map((reply) => (
                            <CommentItem key={reply.id} comment={reply} isReply={true} />
                        ))}
                    </div>
                )}
            </div>
        );
    };

    // ============================================================
    // FORMULARIO DE LOGIN (Nombre + Correo)
    // ============================================================
    if (showLoginForm) {
        return (
            <div className="mt-8" id="comments">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        💬 Comentarios
                        <span className="text-sm text-gray-400 font-normal">
                            ({comments.length})
                        </span>
                    </h3>
                </div>
                
                <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700/50">
                    <h4 className="text-lg font-semibold text-white mb-2">👋 Inicia sesión para comentar</h4>
                    <p className="text-sm text-gray-400 mb-4">
                        Ingresa tu nombre y correo electrónico para participar en la conversación.
                        <br />
                        <span className="text-xs text-gray-500">Tu correo no será mostrado públicamente.</span>
                    </p>
                    
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm text-gray-300 mb-1">
                                Nombre de usuario <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Ej: Juan Perez"
                                className={`w-full px-4 py-2 bg-gray-700 border ${usernameError ? 'border-red-500' : 'border-gray-600'} rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                            />
                            {usernameError && (
                                <p className="text-red-400 text-xs mt-1">{usernameError}</p>
                            )}
                        </div>
                        
                        <div>
                            <label className="block text-sm text-gray-300 mb-1">
                                Correo electrónico <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="ejemplo@correo.com"
                                className={`w-full px-4 py-2 bg-gray-700 border ${emailError ? 'border-red-500' : 'border-gray-600'} rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                            />
                            {emailError && (
                                <p className="text-red-400 text-xs mt-1">{emailError}</p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">🔒 Tu correo no será mostrado públicamente.</p>
                        </div>
                        
                        <button
                            onClick={handleLogin}
                            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm text-white font-medium transition"
                        >
                            Continuar para comentar
                        </button>
                    </div>
                    
                    {comments.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-700">
                            <p className="text-xs text-gray-500">
                                📚 {comments.length} comentario{comments.length !== 1 ? 's' : ''} disponibles. 
                                Inicia sesión para verlos y participar.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ============================================================
    // SECCIÓN DE COMENTARIOS (Usuario logueado)
    // ============================================================
    return (
        <div className="mt-8" id="comments">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold flex items-center gap-2">
                    💬 Comentarios
                    <span className="text-sm text-gray-400 font-normal">
                        ({comments.length})
                    </span>
                </h3>
                <button
                    onClick={() => {
                        localStorage.removeItem('comment_username');
                        localStorage.removeItem('comment_email');
                        setShowLoginForm(true);
                    }}
                    className="text-xs text-gray-500 hover:text-blue-400 transition"
                >
                    🔄 Cambiar usuario
                </button>
            </div>

            {/* Input de comentario */}
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-blue-600/30 flex items-center justify-center text-blue-400 font-bold text-sm flex-shrink-0">
                        {username.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm text-gray-400">
                        Comentando como <span className="text-white font-medium">{username}</span>
                    </span>
                </div>
                <div className="flex gap-2">
                    <input
                        id="comment-input"
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder={`Comenta sobre el episodio ${episodeId}...`}
                        className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleAddComment();
                            }
                        }}
                    />
                    <button
                        onClick={handleAddComment}
                        disabled={!newComment.trim()}
                        className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm text-white font-medium transition"
                    >
                        Enviar
                    </button>
                </div>
            </div>

            {/* Lista de comentarios */}
            {isLoading ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                    Cargando comentarios...
                </div>
            ) : comments.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm border border-dashed border-gray-700 rounded-lg">
                    💭 No hay comentarios aún. ¡Sé el primero en comentar!
                </div>
            ) : (
                <div className="mt-4 space-y-2 max-h-[600px] overflow-y-auto pr-2">
                    {comments.map((comment) => (
                        <CommentItem key={comment.id} comment={comment} />
                    ))}
                </div>
            )}
        </div>
    );
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export const Route = createFileRoute('/ver/$id/$episodeId')({
    component: WatchComponent,
})

function WatchComponent() {
    const { id, episodeId } = Route.useParams()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [anime, setAnime] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)
    const [videoUrl, setVideoUrl] = useState<string | null>(null)
    const [seasonKey, setSeasonKey] = useState<string>('')
    const [seasonName, setSeasonName] = useState<string>('')
    const [totalEpisodes, setTotalEpisodes] = useState(12)
    const [seasons, setSeasons] = useState<{ key: string; episodeCount: number }[]>([])
    const [selectedSeason, setSelectedSeason] = useState<number>(0)
    const [currentPage, setCurrentPage] = useState<number>(1)
    const [isNavigating, setIsNavigating] = useState(false)
    const EPISODES_PER_PAGE = 10
    
    const loadingRef = useRef(false)
    const previousEpisodeId = useRef<string>(episodeId)

    // Cargar anime y detectar temporadas (solo cuando cambia el ID)
    useEffect(() => {
        async function loadAnime() {
            if (loadingRef.current) return;
            loadingRef.current = true;
            setLoading(true);
            
            try {
                console.log('🔄 Cargando anime ID:', id);
                
                const response = await fetch('/api/anilist', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        query: `
                            query ($id: Int) {
                                Media(id: $id, type: ANIME) {
                                    id
                                    title {
                                        romaji
                                        english
                                        native
                                    }
                                    coverImage {
                                        extraLarge
                                        large
                                        medium
                                    }
                                    bannerImage
                                    episodes
                                    genres
                                    averageScore
                                    description(asHtml: false)
                                    status
                                    seasonYear
                                    format
                                    duration
                                    popularity
                                    favourites
                                    studios {
                                        nodes {
                                            name
                                        }
                                    }
                                    externalLinks {
                                        url
                                        site
                                        type
                                    }
                                }
                            }
                        `,
                        variables: { id: Number(id) }
                    })
                });
                const json = await response.json();
                const info = json?.data?.Media;
                
                if (!info) {
                    throw new Error('No se encontró el anime');
                }
                
                console.log('✅ Anime cargado:', info.title.english || info.title.romaji);
                console.log('📌 ID de AniList:', info.id);
                
                if (info.id !== Number(id)) {
                    console.warn(`⚠️ El ID devuelto (${info.id}) no coincide con el solicitado (${id})`);
                }
                
                const animeData = {
                    id: info.id,
                    title: info.title.english || info.title.romaji || info.title.native || 'Sin título',
                    image: info.coverImage?.extraLarge || info.coverImage?.large || '',
                    bannerImage: info.bannerImage || '',
                    episodes: info.episodes || 0,
                    genres: info.genres || [],
                    averageScore: info.averageScore || 0,
                    description: info.description || '',
                    status: info.status || 'UNKNOWN',
                    seasonYear: info.seasonYear || 0,
                    format: info.format || 'TV',
                    duration: info.duration || 0,
                    popularity: info.popularity || 0,
                    favourites: info.favourites || 0,
                    studios: info.studios?.nodes?.map((s: any) => s.name) || [],
                    malId: null,
                    totalEpisodes: info.episodes || 0,
                    titleForNames: info.title.english || info.title.romaji || 'Sin título',
                };
                
                setAnime(animeData);
                
                const tokens = loadTokens();
                const seasonResult = getEpisodesForCurrentSeason(tokens, animeData.title, id);
                
                let detectedSeasons: { key: string; episodeCount: number }[] = [];
                let total = 0;
                
                if (seasonResult && seasonResult.total > 0) {
                    console.log(`✅ getEpisodesForCurrentSeason encontró ${seasonResult.total} episodios`);
                    detectedSeasons = [{ key: seasonResult.seasonKey || 'all-episodes', episodeCount: seasonResult.total }];
                    total = seasonResult.total;
                    console.log(`📊 Temporadas detectadas: ${detectedSeasons.length}`);
                    console.log(`📺 Total de episodios: ${total}`);
                } else {
                    detectedSeasons = detectSeasons(animeData.title, id);
                    total = getTotalEpisodes(detectedSeasons);
                    if (total === 0) {
                        total = animeData.episodes || getKnownEpisodes(animeData.title) || 12;
                    }
                    console.log(`📊 Temporadas detectadas (fallback): ${detectedSeasons.length}`);
                    console.log(`📺 Total de episodios (fallback): ${total}`);
                }
                
                setSeasons(detectedSeasons);
                setTotalEpisodes(total);
                
            } catch (err) {
                console.error('❌ Error:', err);
                setError('Error al cargar el anime');
            } finally {
                setLoading(false);
                loadingRef.current = false;
            }
        }
        loadAnime();
    }, [id]);

    // Buscar el token para el episodio (se ejecuta cuando cambia episodeId O anime)
    useEffect(() => {
        if (previousEpisodeId.current !== episodeId) {
            console.log(`🔄 EpisodeId cambió de ${previousEpisodeId.current} a ${episodeId}`);
            previousEpisodeId.current = episodeId;
            setIsNavigating(false);
        }
        
        if (typeof window === 'undefined' || !anime) return;
        
        const episodeNum = Number(episodeId);
        console.log(`🔍 Buscando token para "${anime.title}" - Episodio ${episodeNum}`);
        
        const token = getEpisodeUrl(anime.title, episodeId, String(id));
        
        let sName = '';
        let seasonIdx = 0;
        const seasonData = getSeasonKeyForEpisode(episodeNum, seasons, id);
        if (seasonData.key) {
            sName = getSeasonName(seasonData.key, seasonData.seasonIndex);
            seasonIdx = seasonData.seasonIndex;
            setSeasonKey(seasonData.key);
        }
        
        console.log('🎯 Token encontrado:', token ? '✅' : '❌');
        if (token) {
            console.log('🔗 URL del video:', token.substring(0, 80) + '...');
        } else {
            console.log('💡 Tokens disponibles:', Object.keys(loadTokens()));
        }
        
        setVideoUrl(null);
        setTimeout(() => {
            setVideoUrl(token || null);
        }, 50);
        
        setSeasonName(sName);
        setSelectedSeason(seasonIdx);
    }, [episodeId, anime, seasons, id]);

    // Posicionar la lista de episodios
    useEffect(() => {
        if (!anime || !seasons || seasons.length === 0) return;
        
        const episodeNum = Number(episodeId);
        
        let startEpisode = 1;
        for (let i = 0; i < selectedSeason; i++) {
            startEpisode += (seasons[i]?.episodeCount || 0);
        }
        const currentSeason = seasons[selectedSeason];
        if (!currentSeason) return;
        
        const seasonEpisodes = Array.from(
            { length: currentSeason.episodeCount }, 
            (_, i) => startEpisode + i
        );
        
        const page = Math.floor((episodeNum - startEpisode) / EPISODES_PER_PAGE) + 1;
        const totalPages = Math.ceil(seasonEpisodes.length / EPISODES_PER_PAGE);
        const newPage = Math.max(1, Math.min(page, totalPages));
        
        if (newPage !== currentPage) {
            setCurrentPage(newPage);
        }
    }, [episodeId, selectedSeason, seasons, currentPage]);

    const changeSeason = (seasonIndex: number) => {
        setSelectedSeason(seasonIndex);
        setCurrentPage(1);
        const season = seasons[seasonIndex];
        if (season) {
            let startEpisode = 1;
            for (let i = 0; i < seasonIndex; i++) {
                startEpisode += (seasons[i]?.episodeCount || 0);
            }
            setIsNavigating(true);
            navigate({
                to: '/ver/$id/$episodeId',
                params: { id, episodeId: String(startEpisode) },
            });
        }
    };

    // ============================================================
    // FUNCIÓN DE PAGINACIÓN
    // ============================================================
    
    // Calcular startEpisode para la paginación (fuera del render para que esté disponible)
    let startEpisode = 1;
    for (let i = 0; i < selectedSeason; i++) {
        startEpisode += (seasons[i]?.episodeCount || 0);
    }
    
    const changePage = (page: number) => {
        // Calcular el primer episodio de la página
        const startIndex = (page - 1) * EPISODES_PER_PAGE;
        const firstEpisode = startEpisode + startIndex;
        
        // Navegar al primer episodio de la página
        if (firstEpisode <= totalEpisodes) {
            console.log(`📄 Navegando a página ${page}, episodio ${firstEpisode}`);
            setIsNavigating(true);
            navigate({
                to: '/ver/$id/$episodeId',
                params: { id, episodeId: String(firstEpisode) },
            });
        }
        
        document.getElementById('episode-list')?.scrollIntoView({ behavior: 'smooth' });
    };

    // ============================================================
    // FUNCIONES DE NAVEGACIÓN DEL REPRODUCTOR
    // ============================================================
    
    const episodeNumber = Number(episodeId)
    const hasNext = episodeNumber < totalEpisodes
    const hasPrevious = episodeNumber > 1

    const handleNext = () => {
        if (hasNext && !isNavigating) {
            const newEpisode = episodeNumber + 1;
            console.log(`➡️ Navegando al episodio ${newEpisode}`);
            setIsNavigating(true);
            navigate({
                to: '/ver/$id/$episodeId',
                params: { id, episodeId: String(newEpisode) },
            });
        }
    }

    const handlePrevious = () => {
        if (hasPrevious && !isNavigating) {
            const newEpisode = episodeNumber - 1;
            console.log(`⬅️ Navegando al episodio ${newEpisode}`);
            setIsNavigating(true);
            navigate({
                to: '/ver/$id/$episodeId',
                params: { id, episodeId: String(newEpisode) },
            });
        }
    }

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <p className="mt-4 text-gray-500">Cargando...</p>
                </div>
            </div>
        )
    }

    if (error || !anime) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="text-center py-12">
                    <p className="text-red-500">{error || 'Error'}</p>
                    <Link to="/" className="mt-4 inline-block px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700">
                        Volver
                    </Link>
                </div>
            </div>
        )
    }

    const currentSeason = seasons[selectedSeason];
    const seasonEpisodes = currentSeason 
        ? Array.from({ length: currentSeason.episodeCount }, (_, i) => startEpisode + i)
        : [];

    const totalPages = Math.ceil(seasonEpisodes.length / EPISODES_PER_PAGE);
    const startIndex = (currentPage - 1) * EPISODES_PER_PAGE;
    const endIndex = startIndex + EPISODES_PER_PAGE;
    const paginatedEpisodes = seasonEpisodes.slice(startIndex, endIndex);

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-4">
                <Link to="/anime/$id" params={{ id }} className="text-blue-400 hover:text-blue-300 transition">
                    ← Volver a {anime.title}
                </Link>
            </div>

            <h1 className="text-2xl font-bold mb-2">{anime.title}</h1>
            <p className="text-gray-400 mb-4">
                Episodio {episodeId} de {totalEpisodes}
                {seasonName && <span className="text-xs text-gray-500 ml-2">({seasonName})</span>}
            </p>

            <div className="bg-gray-900 rounded-lg overflow-hidden">
                <div className="relative aspect-video bg-black">
                    {videoUrl ? (
                        <iframe
                            key={videoUrl}
                            src={videoUrl}
                            className="w-full h-full"
                            allowFullScreen
                            allow="encrypted-media; picture-in-picture; autoplay; fullscreen"
                            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
                            loading="eager"
                            referrerPolicy="no-referrer"
                        />
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 p-4 text-center">
                            <p className="text-yellow-400 text-lg font-semibold">⚠️ Video no disponible</p>
                            <p className="text-sm text-gray-400 mt-2 max-w-md">
                                No se encontró un enlace de video para este episodio.
                            </p>
                            <p className="text-xs text-gray-500 mt-4">
                                {anime.title} - Episodio {episodeId}
                            </p>
                            <p className="text-xs text-gray-500 mt-2">
                                Tokens disponibles: {Object.keys(loadTokens()).join(', ')}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex justify-between mt-4">
                <button
                    onClick={handlePrevious}
                    disabled={!hasPrevious || isNavigating}
                    className="px-6 py-2 bg-gray-700 rounded-lg disabled:opacity-50 hover:bg-gray-600 transition"
                >
                    ◀ Anterior
                </button>
                <span className="text-gray-400 text-sm self-center">
                    Episodio {episodeId} de {totalEpisodes}
                </span>
                <button
                    onClick={handleNext}
                    disabled={!hasNext || isNavigating}
                    className="px-6 py-2 bg-blue-600 rounded-lg disabled:opacity-50 hover:bg-blue-700 transition"
                >
                    Siguiente ▶
                </button>
            </div>

            <div className="mt-8" id="episode-list">
                <h3 className="text-lg font-semibold mb-4">📺 Lista de episodios</h3>
                
                {seasons.length > 0 && (
                    <div className="flex gap-2 mb-4 flex-wrap">
                        {seasons.map((season, index) => (
                            <button
                                key={season.key}
                                onClick={() => changeSeason(index)}
                                className={`px-4 py-2 rounded-lg text-sm transition ${
                                    selectedSeason === index
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                }`}
                            >
                                {getSeasonName(season.key, index)}
                                <span className="text-xs ml-1 text-gray-400">
                                    ({season.episodeCount} eps)
                                </span>
                            </button>
                        ))}
                    </div>
                )}

                {totalPages > 1 && (
                    <div className="flex justify-between items-center mb-3">
                        <div className="text-sm text-gray-400">
                            Página {currentPage} de {totalPages}
                            <span className="ml-2">
                                ({paginatedEpisodes.length} de {seasonEpisodes.length} episodios)
                            </span>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => changePage(currentPage - 1)}
                                disabled={currentPage === 1 || isNavigating}
                                className="px-3 py-1 bg-gray-700 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-600 transition"
                            >
                                ◀
                            </button>
                            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                let pageNum;
                                if (totalPages <= 5) {
                                    pageNum = i + 1;
                                } else if (currentPage <= 3) {
                                    pageNum = i + 1;
                                } else if (currentPage >= totalPages - 2) {
                                    pageNum = totalPages - 4 + i;
                                } else {
                                    pageNum = currentPage - 2 + i;
                                }
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => changePage(pageNum)}
                                        disabled={isNavigating}
                                        className={`px-3 py-1 rounded-lg text-sm transition ${
                                            currentPage === pageNum
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                        }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                            <button
                                onClick={() => changePage(currentPage + 1)}
                                disabled={currentPage === totalPages || isNavigating}
                                className="px-3 py-1 bg-gray-700 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-600 transition"
                            >
                                ▶
                            </button>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                    {paginatedEpisodes.map((num) => (
                        <Link
                            key={num}
                            to="/ver/$id/$episodeId"
                            params={{ id, episodeId: String(num) }}
                            className={`px-3 py-2 rounded-lg text-center text-sm transition ${
                                num === episodeNumber
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                            }`}
                            onClick={() => setIsNavigating(true)}
                        >
                            Ep. {num}
                        </Link>
                    ))}
                </div>

                {totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-4">
                        <button
                            onClick={() => changePage(currentPage - 1)}
                            disabled={currentPage === 1 || isNavigating}
                            className="px-3 py-1 bg-gray-700 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-600 transition"
                        >
                            ◀ Anterior
                        </button>
                        <span className="px-3 py-1 text-gray-400 text-sm">
                            {currentPage} / {totalPages}
                        </span>
                        <button
                            onClick={() => changePage(currentPage + 1)}
                            disabled={currentPage === totalPages || isNavigating}
                            className="px-3 py-1 bg-gray-700 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-600 transition"
                        >
                            Siguiente ▶
                        </button>
                    </div>
                )}
                
                {paginatedEpisodes.length === 0 && (
                    <p className="text-center text-gray-500 text-sm mt-4">
                        No hay episodios en esta temporada
                    </p>
                )}
            </div>

            {/* ============================================================ */}
            {/* 📝 SECCIÓN DE COMENTARIOS - SIN CORREO VISIBLE */}
            {/* ============================================================ */}
            <CommentsSection 
                animeId={id} 
                episodeId={episodeId} 
                animeTitle={anime?.title || 'Anime'} 
            />
        </div>
    )
}