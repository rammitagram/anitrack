import { NextRequest, NextResponse } from 'next/server';

const QUERY = `query($q:String,$sort:[MediaSort],$genre:String,$status:MediaStatus,$page:Int){Page(page:$page,perPage:30){pageInfo{hasNextPage} media(type:ANIME,search:$q,sort:$sort,genre:$genre,status:$status,isAdult:false){id title{romaji english native} coverImage{extraLarge} bannerImage description(asHtml:false) episodes duration format status seasonYear averageScore genres}}}`;
const SORTS = ['POPULARITY_DESC', 'SCORE_DESC', 'TRENDING_DESC', 'START_DATE_DESC'];
const STATUSES = ['RELEASING', 'FINISHED', 'NOT_YET_RELEASED'];

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const q = (p.get('q') || '').trim() || null;
  const s = p.get('sort') || '';
  const sort = SORTS.includes(s) ? s : q ? 'SEARCH_MATCH' : 'POPULARITY_DESC';
  const st = p.get('status') || '';
  const status = STATUSES.includes(st) ? st : null;
  const page = Math.min(Math.max(parseInt(p.get('page') || '1', 10) || 1, 1), 100);
  const variables: Record<string, unknown> = { sort: [sort], page };
  const genre = p.get('genre');
  if (q) variables.q = q;
  if (genre) variables.genre = genre;
  if (status) variables.status = status;
  try {
    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: QUERY, variables }),
      next: { revalidate: 3600 },
    });
    if (!res.ok) return NextResponse.json({ error: 'AniList no respondió. Probá de nuevo en un rato.' }, { status: 502 });
    const json = await res.json();
    const results = (json.data?.Page?.media || []).map((m: any) => ({
      id: m.id, title: m.title.english || m.title.romaji, nativeTitle: m.title.native || '',
      cover: m.coverImage?.extraLarge || '', banner: m.bannerImage || null,
      description: (m.description || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
      episodes: m.episodes, year: m.seasonYear, score: m.averageScore, format: m.format,
      status: m.status, duration: m.duration, genres: m.genres || [],
    }));
    return NextResponse.json({ results, hasNext: !!json.data?.Page?.pageInfo?.hasNextPage });
  } catch {
    return NextResponse.json({ error: 'No se pudo conectar con AniList.' }, { status: 502 });
  }
}
