// src/lib/translations.ts

// Diccionario de traducciones para descripciones comunes
export const descriptionTranslations: Record<string, string> = {
    'loner': 'solitaria',
    'boundary-less': 'sin límites',
    'complicated': 'complicados',
    'confused': 'confundidos',
    'young people': 'jóvenes',
    'high school': 'instituto',
    'school': 'escuela',
    'student': 'estudiante',
    'students': 'estudiantes',
    'teacher': 'profesor',
    'teachers': 'profesores',
    'class': 'clase',
    'friends': 'amigos',
    'friend': 'amigo',
    'love': 'amor',
    'life': 'vida',
    'story': 'historia',
    'adventure': 'aventura',
    'journey': 'viaje',
    'world': 'mundo',
    'magic': 'magia',
    'power': 'poder',
    'battle': 'batalla',
    'fight': 'pelea',
    'war': 'guerra',
    'peace': 'paz',
    'dream': 'sueño',
    'future': 'futuro',
    'past': 'pasado',
    'present': 'presente',
    'family': 'familia',
    'father': 'padre',
    'mother': 'madre',
    'brother': 'hermano',
    'sister': 'hermana',
    'friend': 'amigo',
    'enemy': 'enemigo',
}

// Función para traducir descripciones al español
export function translateDescription(text: string | null): string | null {
    if (!text) return null
    
    let translated = text
    
    // Reemplazar palabras conocidas
    for (const [en, es] of Object.entries(descriptionTranslations)) {
        const regex = new RegExp(`\\b${en}\\b`, 'gi')
        translated = translated.replace(regex, es)
    }
    
    return translated
}

// Función para limpiar y formatear descripciones
export function cleanDescription(description: string | null): string | null {
    if (!description) return null
    
    let clean = description
    
    // Remover etiquetas HTML
    clean = clean.replace(/<br\s*\/?>/gi, ' ')
    clean = clean.replace(/<[^>]*>/g, '')
    
    // Remover caracteres especiales HTML
    clean = clean.replace(/&quot;/g, '"')
    clean = clean.replace(/&amp;/g, '&')
    clean = clean.replace(/&lt;/g, '<')
    clean = clean.replace(/&gt;/g, '>')
    clean = clean.replace(/&nbsp;/g, ' ')
    clean = clean.replace(/&#039;/g, "'")
    clean = clean.replace(/&rsquo;/g, "'")
    clean = clean.replace(/&ldquo;/g, '"')
    clean = clean.replace(/&rdquo;/g, '"')
    
    // Remover "(Source: ...)" y cosas similares
    clean = clean.replace(/\(Source:.*?\)/g, '')
    clean = clean.replace(/\(Traducción:.*?\)/g, '')
    clean = clean.replace(/\(Translated:.*?\)/g, '')
    
    // Remover múltiples espacios
    clean = clean.replace(/\s+/g, ' ')
    
    clean = clean.trim()
    
    return clean
}