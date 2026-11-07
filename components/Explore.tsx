'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimeResult } from '@/lib/types';
import { Poster } from './Carousel';

const GENRES = [['Action', 'Acción'], ['Adventure', 'Aventura'], ['Comedy', 'Comedia'], ['Drama', 'Drama'], ['Fantasy', 'Fantasía'], ['Horror', 'Terror'], ['Mystery', 'Misterio'], ['Psychological', 'Psicológico'], ['Romance', 'Romance'], ['Sci-Fi', 'Ciencia ficción'], ['Slice of Life', 'Slice of life'], ['Sports', 'Deportes'], ['Supernatural', 'Sobrenatural']];

export default function Explore({ onOpen }: { onOpen: (a: AnimeResult) => void }) {
  const [q, setQ] = useState('');
  const [genre, setGenre] = useState('');
  const [sort, setSort] = useState('POPULARITY_DESC');
  const [items, setItems] = useState<AnimeResult[]>([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(true);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const gen = useRef(0);
  const sentinel = useRef<HTMLDivElement>(null);

  const load = useCallback(async (p: number, reset: boolean) => {
    const my = reset ? ++gen.current : gen.current;
    setLoading(true); setErr('');
    try {
      const qs = new URLSearchParams({ sort, page: String(p) });
      if (q.trim()) qs.set('q', q.trim());
      if (genre) qs.set('genre', genre);
      const r = await fetch(`/api/anime?${qs}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'No se pudo cargar.');
      if (my !== gen.current) return;
      setItems(prev => {
        const base = reset ? [] : prev;
        const seen = new Set(base.map(a => a.id));
        return [...base, ...(j.results as AnimeResult[]).filter(a => !seen.has(a.id))];
      });
      setPage(p); setHasNext(!!j.hasNext);
    } catch (e) {
      if (my === gen.current) setErr(e instanceof Error ? e.message : 'No se pudo cargar.');
    } finally {
      if (my === gen.current) setLoading(false);
    }
  }, [q, genre, sort]);

  useEffect(() => {
    gen.current++; setItems([]); setHasNext(true); setPage(1);
    const t = setTimeout(() => load(1, true), 400);
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(es => {
      if (es[0].isIntersecting && hasNext && !loading && !err && items.length > 0) load(page + 1, false);
    }, { rootMargin: '600px' });
    io.observe(el);
    return () => io.disconnect();
  }, [hasNext, loading, err, items.length, page, load]);

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
      <div className="grid">
        {items.map(a => <Poster key={a.id} a={a} onOpen={onOpen} />)}
        {loading && Array.from({ length: items.length ? 6 : 12 }).map((_, i) => <div key={`s${i}`} className="poster sk" />)}
      </div>
      {err && <div className="center"><p className="message">{err}</p><button className="secondaryBtn" onClick={() => load(items.length ? page + 1 : 1, items.length === 0)}>Reintentar</button></div>}
      {!loading && !err && items.length === 0 && <p className="empty">Sin resultados.</p>}
      {!loading && !err && !hasNext && items.length > 0 && <p className="center muted">Llegaste al final.</p>}
      <div ref={sentinel} className="sentinel" />
    </section>
  );
}
