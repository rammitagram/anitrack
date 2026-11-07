'use client';
import { useEffect, useState } from 'react';
import { AnimeResult } from '@/lib/types';
import { Poster } from './Carousel';

const GENRES = [['Action', 'Acción'], ['Adventure', 'Aventura'], ['Comedy', 'Comedia'], ['Drama', 'Drama'], ['Fantasy', 'Fantasía'], ['Horror', 'Terror'], ['Mystery', 'Misterio'], ['Psychological', 'Psicológico'], ['Romance', 'Romance'], ['Sci-Fi', 'Ciencia ficción'], ['Slice of Life', 'Slice of life'], ['Sports', 'Deportes'], ['Supernatural', 'Sobrenatural']];

export default function Explore({ onOpen }: { onOpen: (a: AnimeResult) => void }) {
  const [q, setQ] = useState('');
  const [genre, setGenre] = useState('');
  const [sort, setSort] = useState('POPULARITY_DESC');
  const [res, setRes] = useState<AnimeResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => {
      const qs = new URLSearchParams({ sort });
      if (q.trim()) qs.set('q', q.trim());
      if (genre) qs.set('genre', genre);
      fetch(`/api/anime?${qs}`)
        .then(async r => { const j = await r.json(); if (!r.ok) throw new Error(j.error); setRes(j.results); setErr(''); })
        .catch(e => setErr(e.message || 'Error al buscar.'))
        .finally(() => setLoading(false));
    }, 400);
    return () => clearTimeout(t);
  }, [q, genre, sort]);

  return (
    <section className="exploreSection">
      <h1>Explorar</h1>
      <div className="controls">
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar por nombre" />
        <select value={genre} onChange={e => setGenre(e.target.value)}>
          <option value="">Todos los géneros</option>
          {GENRES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select value={sort} onChange={e => setSort(e.target.value)}>
          <option value="POPULARITY_DESC">Popularidad</option>
          <option value="SCORE_DESC">Puntuación</option>
          <option value="START_DATE_DESC">Más recientes</option>
        </select>
      </div>
      {err && <p className="message">{err}</p>}
      {!loading && !err && res.length === 0 && <p className="empty">Sin resultados.</p>}
      <div className="grid">
        {loading ? Array.from({ length: 10 }).map((_, i) => <div key={i} className="poster sk" />)
          : res.map(a => <Poster key={a.id} a={a} onOpen={onOpen} />)}
      </div>
    </section>
  );
}
