'use client';
import { AnimeResult } from '@/lib/types';

export function Poster({ a, onOpen }: { a: AnimeResult; onOpen: (a: AnimeResult) => void }) {
  return (
    <button className="poster" onClick={() => onOpen(a)}>
      {a.cover ? <img src={a.cover} alt={a.title} loading="lazy" /> : <div className="noimg" />}
      <span className="pt">{a.title}</span>
      <span className="pm">{a.score ? `★ ${(a.score / 10).toFixed(1)}` : 'Sin puntaje'}{a.year ? ` · ${a.year}` : ''}</span>
    </button>
  );
}

export default function Carousel({ title, items, loading, error, onOpen }: {
  title: string; items: AnimeResult[]; loading: boolean; error: string; onOpen: (a: AnimeResult) => void;
}) {
  return (
    <section className="rowSec">
      <h2>{title}</h2>
      {error ? <p className="muted">{error}</p> : !loading && items.length === 0 ? <p className="muted">No se encontraron animes para esta sección.</p> : (
        <div className="row">
          {loading ? Array.from({ length: 8 }).map((_, i) => <div key={i} className="poster sk" />)
            : items.map(a => <Poster key={a.id} a={a} onOpen={onOpen} />)}
        </div>
      )}
    </section>
  );
}
