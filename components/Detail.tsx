'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { saveEntry } from '@/lib/save';
import { AnimeResult } from '@/lib/types';
import { Poster } from './Carousel';

const OPTIONS = [['Completado', 'Ya visto'], ['Viendo', 'Viendo'], ['Pendiente', 'Quiero ver']];
const LABEL: Record<string, string> = { Completado: 'Ya visto', Viendo: 'Viendo', Pendiente: 'Quiero ver', 'En pausa': 'En pausa', Abandonado: 'Abandonado' };
const STATUS_ES: Record<string, string> = { RELEASING: 'En emisión', FINISHED: 'Finalizado', NOT_YET_RELEASED: 'Próximamente', CANCELLED: 'Cancelado', HIATUS: 'En pausa' };

export default function Detail({ a, userId, onClose, onChanged, onLogin, onOpen }: {
  a: AnimeResult; userId: string | null; onClose: () => void; onChanged: () => void; onLogin: () => void; onOpen: (a: AnimeResult) => void;
}) {
  const [cur, setCur] = useState<string | null>(null);
  const [sel, setSel] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [sim, setSim] = useState<AnimeResult[] | null>(null);
  const [simErr, setSimErr] = useState(false);

  useEffect(() => {
    fetch(`/api/anime?id=${a.id}`)
      .then(async r => { const j = await r.json(); if (!r.ok) throw new Error(); setSim(j.results); })
      .catch(() => { setSim([]); setSimErr(true); });
  }, [a.id]);

  useEffect(() => {
    if (!supabase || !userId) return;
    supabase.from('anime_entries').select('status').eq('user_id', userId).eq('anilist_id', a.id).maybeSingle()
      .then(({ data }) => setCur(data?.status ?? null));
  }, [a.id, userId]);

  function openPicker() {
    if (!userId) { setMsg('Iniciá sesión para guardar animes.'); return; }
    setSel(cur); setEditing(true); setMsg('');
  }
  function cancel() { setSel(cur); setEditing(false); setMsg(''); }

  async function confirm() {
    if (!supabase || !userId || !sel || sel === cur) return;
    setSaving(true);
    const e = await saveEntry(userId, a, sel, !!cur);
    setSaving(false);
    if (e) { setMsg(e); return; }
    setCur(sel); setEditing(false); setMsg(''); onChanged();
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
            {!editing ? (
              <div className="btns">
                {cur && <p className="saved">En tu biblioteca: <b>{LABEL[cur] || cur}</b></p>}
                <button className="primaryBtn" onClick={openPicker}>{cur ? 'Cambiar estado' : 'Agregar a mi biblioteca'}</button>
              </div>
            ) : (
              <div>
                <p className="muted">Elegí el estado{cur ? ` (guardado: ${LABEL[cur] || cur})` : ''}</p>
                <div className="btns">
                  {OPTIONS.map(([v, l]) => <button key={v} className={sel === v ? 'primaryBtn' : 'secondaryBtn'} onClick={() => setSel(v)}>{l}{cur === v ? ' · guardado' : ''}</button>)}
                </div>
                <div className="btns">
                  <button className="primaryBtn" disabled={!sel || sel === cur || saving} onClick={confirm}>{saving ? 'Guardando…' : 'Confirmar'}</button>
                  <button className="secondaryBtn" onClick={cancel}>Cancelar</button>
                </div>
              </div>
            )}
            {!userId && <p className="message">Necesitás una cuenta para guardar. <button className="link" onClick={onLogin}>Ingresar</button></p>}
            {msg && <p className="message">{msg}</p>}
          </div>
        </div>
        <div className="simSec">
          <h3>Similares</h3>
          {sim === null ? <p className="muted">Cargando…</p> : simErr ? <p className="muted">No se pudieron cargar las recomendaciones.</p> : sim.length === 0 ? <p className="muted">Sin recomendaciones disponibles.</p> : <div className="row">{sim.map(x => <Poster key={x.id} a={x} onOpen={onOpen} />)}</div>}
        </div>
      </div>
    </div>
  );
}
