// src/lib/translator.ts

// Función para traducir texto usando la API de Google Translate (gratuita)
export async function translateToSpanish(text: string): Promise<string> {
    try {
        // Usamos la API de traducción gratuita de Google (sin necesidad de API key)
        const response = await fetch(
            `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=es&dt=t&q=${encodeURIComponent(text)}`
        )
        
        const data = await response.json()
        
        if (data && data[0]) {
            // Extraer el texto traducido
            const translated = data[0].map((item: any[]) => item[0]).join('')
            return translated
        }
        
        return text // Si falla, devolver el texto original
    } catch (error) {
        console.error('Error traduciendo:', error)
        return text // Si hay error, devolver el texto original
    }
}

// Función para limpiar y traducir descripciones
export async function cleanAndTranslateDescription(description: string | null): Promise<string | null> {
    if (!description) return null
    
    // Primero limpiar el texto
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
    clean = clean.replace(/\(Note:.*?\)/g, '')
    
    // Remover múltiples espacios
    clean = clean.replace(/\s+/g, ' ')
    clean = clean.trim()
    
    // Si el texto está en inglés, traducirlo
    // Detectamos si tiene palabras en inglés comunes
    const englishWords = ['the', 'is', 'and', 'to', 'of', 'for', 'with', 'on', 'at', 'from', 'by']
    const hasEnglish = englishWords.some(word => clean.toLowerCase().includes(` ${word} `))
    
    if (hasEnglish && clean.length > 50) {
        try {
            console.log('🔄 Traduciendo descripción...')
            const translated = await translateToSpanish(clean)
            console.log('✅ Descripción traducida')
            return translated
        } catch (error) {
            console.error('❌ Error traduciendo:', error)
            return clean // Si falla, devolver el texto limpio
        }
    }
    
    return clean
}