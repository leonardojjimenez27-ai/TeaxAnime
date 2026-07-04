// src/lib/translator.ts

// Función para limpiar descripciones
export function cleanDescription(text: string | null): string | null {
    if (!text) return null
    
    let clean = text
    clean = clean.replace(/<br\s*\/?>/gi, ' ')
    clean = clean.replace(/<[^>]*>/g, '')
    clean = clean.replace(/&quot;/g, '"')
    clean = clean.replace(/&amp;/g, '&')
    clean = clean.replace(/&lt;/g, '<')
    clean = clean.replace(/&gt;/g, '>')
    clean = clean.replace(/&nbsp;/g, ' ')
    clean = clean.replace(/&#039;/g, "'")
    clean = clean.replace(/&rsquo;/g, "'")
    clean = clean.replace(/&ldquo;/g, '"')
    clean = clean.replace(/&rdquo;/g, '"')
    clean = clean.replace(/\(Source:.*?\)/g, '')
    clean = clean.replace(/\(Traducción:.*?\)/g, '')
    clean = clean.replace(/\(Translated:.*?\)/g, '')
    clean = clean.replace(/\s+/g, ' ')
    clean = clean.trim()
    
    return clean
}

// Función para traducir al español usando Google Translate
export async function translateToSpanish(text: string): Promise<string> {
    try {
        const response = await fetch(
            `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=es&dt=t&q=${encodeURIComponent(text)}`
        )
        const data = await response.json()
        if (data && data[0]) {
            const translated = data[0].map((item: any[]) => item[0]).join('')
            return translated
        }
        return text
    } catch (error) {
        console.error('Error traduciendo:', error)
        return text
    }
}

// Función principal para limpiar y traducir
export async function cleanAndTranslateDescription(description: string | null): Promise<string | null> {
    if (!description) return null
    
    const clean = cleanDescription(description)
    if (!clean) return null
    
    // Detectar si está en inglés
    const englishWords = ['the', 'is', 'and', 'to', 'of', 'for', 'with', 'on', 'at', 'from', 'by']
    const hasEnglish = englishWords.some(word => clean.toLowerCase().includes(` ${word} `))
    
    if (hasEnglish && clean.length > 50) {
        try {
            const translated = await translateToSpanish(clean)
            return translated
        } catch (error) {
            return clean
        }
    }
    
    return clean
}