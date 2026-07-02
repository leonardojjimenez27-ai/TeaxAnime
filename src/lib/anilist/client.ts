// src/lib/anilist/client.ts
const ANILIST_URL = "https://graphql.anilist.co";

export async function request<T>(
    query: string,
    variables?: Record<string, unknown>,
): Promise<T> {
    console.log('📡 Fetching from AniList...');
    
    const response = await fetch(ANILIST_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": "AnimeApp/1.0",
        },
        body: JSON.stringify({
            query,
            variables,
        }),
    });

    if (!response.ok) {
        const text = await response.text();
        console.error('❌ HTTP Error:', response.status, text);
        throw new Error(`AniList HTTP ${response.status}: ${text}`);
    }

    const json = await response.json();

    if (json.errors) {
        console.error('❌ GraphQL Errors:', json.errors);
        throw new Error(json.errors[0]?.message || 'GraphQL error');
    }

    return json.data;
}