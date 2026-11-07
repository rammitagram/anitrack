'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimeResult } from '@/lib/types';
import { Poster } from './Carousel';

const GENRES = [['Action', 'Acción'], ['Adventure', 'Aventura'], ['Comedy', 'Comedia'], ['Drama', 'Drama'], ['Fantasy', 'Fantasía'], ['Horror', 'Terror'], ['Mystery', 'Misterio'], ['Psychological', 'Psicológico'], ['Romance', 'Romance'], ['Sci-Fi', 'Ciencia ficción'], ['Slice of Life', 'Slice of life'], ['Sports', 'Deportes'], ['Supernatural', 'Sobrenatural']];

export default function Explore({ onOpen, preset = '' }: { onOpen: (a: AnimeResult) => void; preset?: string }) {
  const init = new URLSearchParams(preset);
  const [q, setQ] = useState('');
  const [genre, setGenre] = useState(init.get('genre') || '');
  const [sort, setSort] = useState(init.get('sort') || 'POPULARITY_DESC');
  const [season, setSeason] = useState(init.get('season') || '');
  const [year, setYear] = useState(init.get('year') || '');
  const [format, setFormat] = useState(init.get('format') || '');
  const [status, setStatus] = useState(init.get('status') || '');
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
      if (season) qs.set('season', season);
      if (year) qs.set('year', year);
      if (format) qs.set('format', format);
      if (status) qs.set('status', status);
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
  }, [q, genre, sort, season, year, format, status]);

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
        <select value={year} onChange={e => setYear(e.target.value)}>
          <option value="">Cualquier año</option>
          {Array.from({ length: 40 }, (_, i) => String(new Date().getFullYear() + 1 - i)).map(y => <option key={y}>{y}</option>)}
        </select>
        <select value={season} onChange={e => setSeason(e.target.value)}>
          <option value="">Toda temporada</option>
          <option value="WINTER">Invierno</option><option value="SPRING">Primavera</option><option value="SUMMER">Verano</option><option value="FALL">Otoño</option>
        </select>
        <select value={format} onChange={e => setFormat(e.target.value)}>
          <option value="">Todo formato</option>
          <option value="TV">Serie</option><option value="MOVIE">Película</option><option value="OVA">OVA</option><option value="ONA">ONA</option>
        </select>
        <select value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">Todo estado</option>
          <option value="RELEASING">En emisión</option><option value="FINISHED">Finalizado</option><option value="NOT_YET_RELEASED">Próximamente</option>
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
