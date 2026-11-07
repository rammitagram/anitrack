'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { AnimeResult } from '@/lib/types';

const OPTIONS = [['Completado', 'Ya visto'], ['Viendo', 'Viendo'], ['Pendiente', 'Quiero ver']];
const STATUS_ES: Record<string, string> = { RELEASING: 'En emisión', FINISHED: 'Finalizado', NOT_YET_RELEASED: 'Próximamente', CANCELLED: 'Cancelado', HIATUS: 'En pausa' };

export default function Detail({ a, userId, onClose, onChanged, onLogin }: {
  a: AnimeResult; userId: string | null; onClose: () => void; onChanged: () => void; onLogin: () => void;
}) {
  const [cur, setCur] = useState<string | null>(null);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!supabase || !userId) return;
    supabase.from('anime_entries').select('status').eq('user_id', userId).eq('anilist_id', a.id).maybeSingle()
      .then(({ data }) => setCur(data?.status ?? null));
  }, [a.id, userId]);

  async function set(status: string) {
    if (!supabase || !userId) { setMsg('Iniciá sesión para guardar animes.'); return; }
    const patch: Record<string, unknown> = { status };
    if (status === 'Completado' && a.episodes) patch.episodes_watched = a.episodes;
    let r;
    if (cur) {
      r = await supabase.from('anime_entries').update(patch).eq('user_id', userId).eq('anilist_id', a.id);
    } else {
      r = await supabase.from('anime_entries').insert({
        user_id: userId, anilist_id: a.id, title: a.title, native_title: a.nativeTitle || null,
        cover_url: a.cover || null, format: a.format, episodes_total: a.episodes, duration_min: a.duration,
        genres: a.genres, status, episodes_watched: status === 'Completado' ? (a.episodes ?? 0) : 0,
      });
    }
    if (r.error?.code === '23505') r = await supabase.from('anime_entries').update(patch).eq('user_id', userId).eq('anilist_id', a.id);
    if (r.error) setMsg(r.error.message); else { setCur(status); setMsg(''); onChanged(); }
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="mBanner" style={a.banner ? { backgroundImage: `url(${a.banner})` } : undefined}>
          <button className="close" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>
        <div className="mBody">
          {a.cover && <img className="mCover" src={a.cover} alt="" />}
          <div>
            <h2>{a.title}</h2>
            {a.nativeTitle && <p className="muted">{a.nativeTitle}</p>}
            <p className="meta">{[a.year, a.format, a.episodes ? `${a.episodes} episodios` : 'Episodios: no disponible', STATUS_ES[a.status || ''], a.score ? `★ ${(a.score / 10).toFixed(1)}` : null].filter(Boolean).join(' · ')}</p>
            <p className="muted">{a.genres.join(' · ')}</p>
            <p className="desc2">{a.description || 'Sin sinopsis disponible.'}</p>
            <div className="btns">
              {OPTIONS.map(([v, l]) => <button key={v} className={cur === v ? 'primaryBtn' : 'secondaryBtn'} onClick={() => set(v)}>{l}</button>)}
            </div>
            {!userId && <p className="message">Necesitás una cuenta para guardar. <button className="link" onClick={onLogin}>Ingresar</button></p>}
            {msg && <p className="message">{msg}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
