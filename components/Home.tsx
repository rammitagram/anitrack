'use client';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { AnimeResult, ENTRY_COLUMNS, Entry } from '@/lib/types';
import { seasonInfo } from '@/lib/season';
import Carousel from './Carousel';

const S = seasonInfo();
const SECTIONS = [
  ['Tendencias ahora', 'sort=TRENDING_DESC'],
  ['Popular esta temporada', `sort=POPULARITY_DESC&season=${S.cur}&year=${S.curY}`],
  ['Próxima temporada', `sort=POPULARITY_DESC&season=${S.next}&year=${S.nextY}`],
  ['Popular de todos los tiempos', 'sort=POPULARITY_DESC'],
  ['Mejor valorados', 'sort=SCORE_DESC'],
  ['Acción y aventura', 'sort=POPULARITY_DESC&genre=Action'],
  ['Fantasía', 'sort=POPULARITY_DESC&genre=Fantasy'],
  ['Romance y drama', 'sort=POPULARITY_DESC&genre=Romance'],
];
type S = { items: AnimeResult[]; loading: boolean; error: string };

export default function Home({ userId, refreshKey, onOpen, onSeeAll }: { userId: string | null; refreshKey: number; onOpen: (a: AnimeResult) => void; onSeeAll: (qs: string) => void }) {
  const [data, setData] = useState<S[]>(SECTIONS.map(() => ({ items: [], loading: true, error: '' })));
  const [watching, setWatching] = useState<Entry[]>([]);

  useEffect(() => {
    SECTIONS.forEach(([, qs], i) => {
      const put = (s: S) => setData(d => d.map((x, k) => (k === i ? s : x)));
      fetch(`/api/anime?${qs}`)
        .then(async r => { const j = await r.json(); if (!r.ok) throw new Error(j.error); return j.results as AnimeResult[]; })
        .then(items => put({ items, loading: false, error: '' }))
        .catch(e => put({ items: [], loading: false, error: e.message || 'No se pudo cargar.' }));
    });
  }, []);

  useEffect(() => {
    if (!supabase || !userId) { setWatching([]); return; }
    supabase.from('anime_entries').select(ENTRY_COLUMNS).eq('user_id', userId).eq('status', 'Viendo')
      .order('created_at', { ascending: false }).then(({ data }) => setWatching((data as Entry[]) || []));
  }, [userId, refreshKey]);

  async function plus(e: Entry) {
    const n = Math.min(e.episodes_total ?? Infinity, e.episodes_watched + 1);
    if (!supabase || n === e.episodes_watched) return;
    const { error } = await supabase.from('anime_entries').update({ episodes_watched: n }).eq('id', e.id);
    if (!error) setWatching(w => w.map(x => (x.id === e.id ? { ...x, episodes_watched: n } : x)));
  }

  const hero = data[0].items.find(a => a.banner);
  const rows = useMemo(() => {
    const seen = new Set<number>();
    return data.map(s => ({ ...s, items: s.items.filter(a => (seen.has(a.id) ? false : (seen.add(a.id), true))) }));
  }, [data]);
  return (
    <div>
      {hero ? (
        <div className="hero" style={{ backgroundImage: `url(${hero.banner})` }}>
          <div className="heroIn">
            <h1>{hero.title}</h1>
            <p className="meta">{[hero.year, hero.genres.slice(0, 3).join(' · ')].filter(Boolean).join(' · ')}</p>
            <p className="desc">{hero.description}</p>
            <div className="btns">
              <button className="primaryBtn" onClick={() => onOpen(hero)}>Ver detalles</button>
              <button className="secondaryBtn" onClick={() => onOpen(hero)}>Agregar a mi biblioteca</button>
            </div>
          </div>
        </div>
      ) : data[0].loading ? <div className="hero sk" /> : null}

      {watching.length > 0 && (
        <section className="rowSec">
          <h2>Continuar viendo</h2>
          <div className="row">
            {watching.map(e => (
              <div className="poster" key={e.id}>
                {e.cover_url && <img src={e.cover_url} alt={e.title} loading="lazy" />}
                <span className="pt">{e.title}</span>
                <span className="pm">Ep. {e.episodes_watched}{e.episodes_total ? ` / ${e.episodes_total}` : ''}</span>
                <button className="plus" onClick={() => plus(e)}>+1 episodio</button>
              </div>
            ))}
          </div>
        </section>
      )}

      {SECTIONS.map(([title, qs], i) => (
        <Carousel key={title} title={title} items={rows[i].items} loading={rows[i].loading} error={rows[i].error} onOpen={onOpen} onSeeAll={() => onSeeAll(qs)} />
      ))}
    </div>
  );
}
