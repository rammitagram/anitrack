'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { AnimeResult, ENTRY_COLUMNS } from '@/lib/types';

export default function Explore({ userId, onAdded }: { userId: string | null; onAdded: () => void }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<AnimeResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [message, setMessage] = useState('');
  const [picking, setPicking] = useState<number | null>(null);
  const [ep, setEp] = useState(0);

  async function search(e: React.FormEvent) {
    e.preventDefault();
    if (q.trim().length < 2) return;
    setSearching(true); setMessage('');
    try {
      const res = await fetch(`/api/anime?q=${encodeURIComponent(q.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo buscar.');
      setResults(data.results || []);
      if (!data.results?.length) setMessage('Sin resultados.');
    } catch (err) { setMessage(err instanceof Error ? err.message : 'Error al buscar.'); }
    setSearching(false);
  }

  async function add(a: AnimeResult, status: string) {
    if (!supabase || !userId) { setMessage('Iniciá sesión para agregar animes.'); return; }
    const { error } = await supabase.from('anime_entries').insert({
      user_id: userId, anilist_id: a.id, title: a.title, native_title: a.nativeTitle || null,
      cover_url: a.cover || null, format: a.format, episodes_total: a.episodes,
      duration_min: a.duration, genres: a.genres, status,
      episodes_watched: status === 'Completado' ? (a.episodes ?? 0) : status === 'Viendo' ? Math.min(Math.max(0, ep), a.episodes ?? Infinity) : 0,
    }).select(ENTRY_COLUMNS).single();
    if (error) setMessage(error.code === '23505' ? 'Ya lo tenés en tu biblioteca.' : error.message);
    else { setMessage(`${a.title} agregado.`); setPicking(null); setEp(0); onAdded(); }
  }

  return (
    <section className="exploreSection" id="explorar">
      <h2>Buscar anime</h2>
      <form className="searchForm" onSubmit={search}>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Nombre del anime" />
        <button className="primaryBtn" disabled={searching || q.trim().length < 2}>{searching ? 'Buscando…' : 'Buscar'}</button>
      </form>
      {message && <p className="message">{message}</p>}
      <div className="animeGrid">
        {results.map(a => (
          <article className="animeCard" key={a.id}>
            {a.cover ? <img src={a.cover} alt={a.title} /> : <div className="coverFallback">—</div>}
            <div className="animeInfo">
              <b>{a.title}</b>
              <span>{[a.year, a.format, a.episodes ? `${a.episodes} eps.` : null].filter(Boolean).join(' · ')}</span>
              {picking === a.id ? <div className="picker">
                <button type="button" className="addSmall" onClick={() => add(a, 'Completado')}>Ya visto</button>
                <button type="button" className="addSmall" onClick={() => add(a, 'Viendo')}>Viendo</button>
                <input className="mini" type="number" min={0} max={a.episodes ?? undefined} value={ep} onChange={e => setEp(Number(e.target.value) || 0)} title="Episodio actual (solo para Viendo)" />
                <button type="button" className="addSmall" onClick={() => add(a, 'Pendiente')}>Quiero ver</button>
              </div> : <button type="button" className="addSmall" onClick={() => { setPicking(a.id); setEp(0); }}>Agregar</button>}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
