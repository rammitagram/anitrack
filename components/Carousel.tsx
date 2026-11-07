'use client';
import { useState } from 'react';
import { useQuick } from '@/lib/ctx';
import { AnimeResult } from '@/lib/types';

const OPTS = [['Completado', 'Ya visto'], ['Viendo', 'Viendo'], ['Pendiente', 'Quiero ver']];

export function Poster({ a, onOpen }: { a: AnimeResult; onOpen: (a: AnimeResult) => void }) {
  const q = useQuick();
  const [menu, setMenu] = useState(false);
  const [msg, setMsg] = useState('');
  const saved = q.statusById[a.id];
  async function pick(status: string) {
    const e = await q.save(a, status);
    setMsg(e || '');
    if (!e) setMenu(false);
  }
  return (
    <div className="poster" onMouseLeave={() => setMenu(false)}>
      <button className="pbtn" onClick={() => onOpen(a)}>
        {a.cover ? <img src={a.cover} alt={a.title} loading="lazy" /> : <div className="noimg" />}
        <span className="pt">{a.title}</span>
        <span className="pm">{a.score ? `★ ${(a.score / 10).toFixed(1)}` : 'Sin puntaje'}{a.year ? ` · ${a.year}` : ''}</span>
      </button>
      <button className={saved ? 'qa on' : 'qa'} aria-label="Agregar a mi biblioteca" onClick={() => setMenu(m => !m)}>{saved ? '✓' : '+'}</button>
      {menu && (
        <div className="qmenu">
          {q.userId ? <>
            {OPTS.map(([v, l]) => <button key={v} className={saved === v ? 'sel' : ''} onClick={() => pick(v)}>{l}</button>)}
            {msg && <small>{msg}</small>}
          </> : <button onClick={q.onLogin}>Iniciá sesión para guardar</button>}
        </div>
      )}
    </div>
  );
}

export default function Carousel({ title, items, loading, error, onOpen, onSeeAll }: {
  title: string; items: AnimeResult[]; loading: boolean; error: string; onOpen: (a: AnimeResult) => void; onSeeAll?: () => void;
}) {
  return (
    <section className="rowSec">
      <div className="secHead"><h2>{title}</h2>{onSeeAll && <button className="seeAll" onClick={onSeeAll}>Ver todo ›</button>}</div>
      {error ? <p className="muted">{error}</p> : !loading && items.length === 0 ? <p className="muted">No se encontraron animes para esta sección.</p> : (
        <div className="row">
          {loading ? Array.from({ length: 8 }).map((_, i) => <div key={i} className="poster sk" />)
            : items.map(a => <Poster key={a.id} a={a} onOpen={onOpen} />)}
        </div>
      )}
    </section>
  );
}
