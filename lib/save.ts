import { supabase } from './supabase';
import { AnimeResult } from './types';

export async function saveEntry(userId: string, a: AnimeResult, status: string, exists: boolean): Promise<string | null> {
  const sb = supabase;
  if (!sb) return 'Supabase no está configurado.';
  const patch: Record<string, unknown> = { status };
  if (status === 'Completado' && a.episodes) patch.episodes_watched = a.episodes;
  const update = () => sb.from('anime_entries').update(patch).eq('user_id', userId).eq('anilist_id', a.id);
  let r;
  if (exists) r = await update();
  else r = await sb.from('anime_entries').insert({
    user_id: userId, anilist_id: a.id, title: a.title, native_title: a.nativeTitle || null,
    cover_url: a.cover || null, format: a.format, episodes_total: a.episodes, duration_min: a.duration,
    genres: a.genres, status, episodes_watched: status === 'Completado' ? (a.episodes ?? 0) : 0,
  });
  if (r.error?.code === '23505') r = await update();
  return r.error ? r.error.message : null;
}
