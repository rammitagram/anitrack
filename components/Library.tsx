'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ENTRY_COLUMNS, Entry, STATUSES, STATUS_LABEL } from '@/lib/types';

export default function Library({ userId, refreshKey }: { userId: string | null; refreshKey: number }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('Todos');

  const load = useCallback(async () => {
    if (!supabase || !userId) { setEntries([]); return; }
    const { data, error } = await supabase.from('anime_entries').select(ENTRY_COLUMNS).eq('user_id', userId).order('created_at', { ascending: false });
    if (error) setError(error.message); else setEntries((data as Entry[]) || []);
  }, [userId]);
  useEffect(() => { load(); }, [load, refreshKey]);

  async function update(id: string, patch: Partial<Entry>) {
    const { error } = await supabase!.from('anime_entries').update(patch).eq('id', id);
    if (error) setError(error.message);
    else setEntries(list => list.map(x => x.id === id ? { ...x, ...patch } : x));
  }
  async function remove(id: string) {
    const { error } = await supabase!.from('anime_entries').delete().eq('id', id);
    if (error) setError(error.message); else setEntries(list => list.filter(x => x.id !== id));
  }

  const stats = useMemo(() => {
    const eps = entries.reduce((n, e) => n + e.episodes_watched, 0);
    const mins = entries.reduce((n, e) => n + e.episodes_watched * (e.duration_min || 24), 0);
    const best = entries.filter(e => e.score).sort((a, b) => b.score! - a.score!)[0];
    return { total: entries.length, done: entries.filter(e => e.status === 'Completado').length, eps, hours: Math.round(mins / 60), best };
  }, [entries]);

  const visible = tab === 'Todos' ? entries : entries.filter(e => e.status === tab);

  if (!userId) return <section className="librarySection" id="biblioteca"><h2>Mi biblioteca</h2><p className="empty">Iniciá sesión para ver tu biblioteca.</p></section>;

  return (
    <section className="librarySection" id="biblioteca">
      <h2>Mi biblioteca</h2>
      <div className="stats">
        <div><b>{stats.total}</b><span>Animes</span></div>
        <div><b>{stats.done}</b><span>Completados</span></div>
        <div><b>{stats.eps}</b><span>Episodios</span></div>
        <div><b>{stats.hours} h</b><span>Horas (estimadas)</span></div>
      </div>
      {stats.best && <p className="muted">Mejor puntuado: {stats.best.title} ({stats.best.score}/10)</p>}
      {error && <p className="message">{error}</p>}
      <div className="tabs">{['Todos', ...STATUSES].map(t => <button key={t} className={t === tab ? 'tab on' : 'tab'} onClick={() => setTab(t)}>{t === 'Todos' ? 'Todos' : STATUS_LABEL[t]}</button>)}</div>
      <div className="entryList">
        {visible.map(e => (
          <div className="entry" key={e.id}>
            {e.cover_url && <img className="entryCover" src={e.cover_url} alt="" />}
            <b>{e.title}</b>
            <select value={e.status} onChange={ev => update(e.id, { status: ev.target.value })}>{STATUSES.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}</select>
            <input className="mini" type="number" min={0} max={e.episodes_total ?? undefined} value={e.episodes_watched}
              onChange={ev => update(e.id, { episodes_watched: Math.min(e.episodes_total ?? Infinity, Math.max(0, Number(ev.target.value) || 0)) })} title="Episodios vistos" />
            <span className="muted">/ {e.episodes_total ?? '?'}</span>
            <select className="mini" value={e.score ?? ''} onChange={ev => update(e.id, { score: ev.target.value ? Number(ev.target.value) : null })} title="Puntaje">
              <option value="">—</option>{[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n}>{n}</option>)}
            </select>
            <button className="secondaryBtn" onClick={() => remove(e.id)} title="Quitar">✕</button>
          </div>
        ))}
      </div>
      {visible.length === 0 && <p className="empty">{entries.length === 0 ? 'Todavía no agregaste animes. Buscá uno arriba.' : 'No hay animes en esta lista.'}</p>}
    </section>
  );
}
