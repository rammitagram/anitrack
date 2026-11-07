import { NextResponse } from 'next/server';

const ANILIST_ENDPOINT = 'https://graphql.anilist.co';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get('q') || '').trim();
  if (query.length < 2) return NextResponse.json({ results: [] });

  const graphql = `query ($search: String) {
    Page(page: 1, perPage: 12) {
      media(search: $search, type: ANIME, sort: POPULARITY_DESC) {
        id
        title { romaji english native }
        coverImage { large }
        episodes
        seasonYear
        averageScore
        format
        status
        duration
        genres
      }
    }
  }`;

  try {
    const response = await fetch(ANILIST_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ query: graphql, variables: { search: query } }),
      next: { revalidate: 3600 },
    });
    if (!response.ok) return NextResponse.json({ error: 'No pudimos consultar el catálogo ahora.' }, { status: 502 });
    const payload = await response.json();
    const results = (payload?.data?.Page?.media || []).map((anime: any) => ({
      id: anime.id,
      title: anime.title?.english || anime.title?.romaji || anime.title?.native || 'Anime sin título',
      nativeTitle: anime.title?.native || '',
      cover: anime.coverImage?.large || '',
      episodes: anime.episodes,
      year: anime.seasonYear,
      score: anime.averageScore,
      format: anime.format,
      status: anime.status,
      duration: anime.duration,
      genres: anime.genres || [],
    }));
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ error: 'Error de conexión con el catálogo.' }, { status: 502 });
  }
}
