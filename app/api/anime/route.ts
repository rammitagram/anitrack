import { NextRequest, NextResponse } from 'next/server';

const FIELDS = `id title{romaji english native} coverImage{extraLarge} bannerImage description(asHtml:false) episodes duration format status seasonYear averageScore genres`;
const LIST = `query($q:String,$sort:[MediaSort],$genre:String,$status:MediaStatus,$season:MediaSeason,$year:Int,$format:MediaFormat,$page:Int){Page(page:$page,perPage:30){pageInfo{hasNextPage} media(type:ANIME,search:$q,sort:$sort,genre:$genre,status:$status,season:$season,seasonYear:$year,format:$format,isAdult:false){${FIELDS}}}}`;
const SIMILAR = `query($id:Int){Media(id:$id,type:ANIME){recommendations(sort:RATING_DESC,perPage:12){nodes{mediaRecommendation{${FIELDS}}}}}}`;
const SORTS = ['POPULARITY_DESC', 'SCORE_DESC', 'TRENDING_DESC', 'START_DATE_DESC'];
const STATUSES = ['RELEASING', 'FINISHED', 'NOT_YET_RELEASED'];
const SEASONS = ['WINTER', 'SPRING', 'SUMMER', 'FALL'];
const FORMATS = ['TV', 'TV_SHORT', 'MOVIE', 'OVA', 'ONA', 'SPECIAL'];

const map = (m: any) => ({
  id: m.id, title: m.title.english || m.title.romaji, nativeTitle: m.title.native || '',
  cover: m.coverImage?.extraLarge || '', banner: m.bannerImage || null,
  description: (m.description || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
  episodes: m.episodes, year: m.seasonYear, score: m.averageScore, format: m.format,
  status: m.status, duration: m.duration, genres: m.genres || [],
});

async function anilist(query: string, variables: Record<string, unknown>) {
  const res = await fetch('https://graphql.anilist.co', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }), next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error('http');
  return res.json();
}

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  try {
    const id = parseInt(p.get('id') || '', 10);
    if (id) {
      const json = await anilist(SIMILAR, { id });
      const nodes = json.data?.Media?.recommendations?.nodes || [];
      return NextResponse.json({ results: nodes.map((n: any) => n.mediaRecommendation).filter(Boolean).map(map), hasNext: false });
    }
    const q = (p.get('q') || '').trim();
    const s = p.get('sort') || '';
    const v: Record<string, unknown> = { sort: [SORTS.includes(s) ? s : q ? 'SEARCH_MATCH' : 'POPULARITY_DESC'] };
    v.page = Math.min(Math.max(parseInt(p.get('page') || '1', 10) || 1, 1), 100);
    if (q) v.q = q;
    if (p.get('genre')) v.genre = p.get('genre');
    if (STATUSES.includes(p.get('status') || '')) v.status = p.get('status');
    if (SEASONS.includes(p.get('season') || '')) v.season = p.get('season');
    if (FORMATS.includes(p.get('format') || '')) v.format = p.get('format');
    const y = parseInt(p.get('year') || '', 10);
    if (y >= 1960 && y <= 2100) v.year = y;
    const json = await anilist(LIST, v);
    return NextResponse.json({ results: (json.data?.Page?.media || []).map(map), hasNext: !!json.data?.Page?.pageInfo?.hasNextPage });
  } catch {
    return NextResponse.json({ error: 'No se pudo conectar con AniList. Probá de nuevo en un rato.' }, { status: 502 });
  }
}
