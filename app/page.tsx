'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { AnimeResult } from '@/lib/types';
import AuthPanel from '@/components/AuthPanel';
import Detail from '@/components/Detail';
import Explore from '@/components/Explore';
import Home from '@/components/Home';
import Library from '@/components/Library';
import { QuickCtx } from '@/lib/ctx';
import { saveEntry } from '@/lib/save';

type View = 'home' | 'explore' | 'library' | 'account';
const NAV: [View, string][] = [['home', 'Inicio'], ['explore', 'Explorar'], ['library', 'Mi biblioteca']];

export default function Page() {
  const [session, setSession] = useState<any>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [view, setView] = useState<View>('home');
  const [open, setOpen] = useState<AnimeResult | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [ready, setReady] = useState(!supabase);
  const [guest, setGuest] = useState(false);
  const [statusById, setStatusById] = useState<Record<number, string>>({});
  const [exploreKey, setExploreKey] = useState(0);
  const [preset, setPreset] = useState('');

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    const { data } = supabase.auth.onAuthStateChange((ev, s) => {
      setSession(s);
      if (ev === 'SIGNED_IN') setView(v => (v === 'account' ? 'home' : v));
    });
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!supabase || !session?.user) { setUsername(null); return; }
    supabase.from('profiles').select('username').eq('id', session.user.id).maybeSingle()
      .then(({ data }) => setUsername(data?.username ?? null));
  }, [session]);

  const userId: string | null = session?.user?.id ?? null;
  const show = (v: View) => ({ display: view === v ? 'block' : 'none' });

  useEffect(() => {
    if (!supabase || !userId) { setStatusById({}); return; }
    supabase.from('anime_entries').select('anilist_id, status').eq('user_id', userId)
      .then(({ data }) => setStatusById(Object.fromEntries((data || []).map((e: any) => [e.anilist_id, e.status]))));
  }, [userId, refreshKey]);

  const ctx = {
    userId, statusById, onLogin: () => setView('account'),
    save: async (a: AnimeResult, status: string) => {
      if (!userId) return 'Iniciá sesión para guardar animes.';
      const e = await saveEntry(userId, a, status, a.id in statusById);
      if (!e) { setStatusById(m => ({ ...m, [a.id]: status })); setRefreshKey(k => k + 1); }
      return e;
    },
  };
  function seeAll(qs: string) { setPreset(qs); setExploreKey(k => k + 1); setView('explore'); window.scrollTo(0, 0); }

  if (!ready) return <div className="splash">ANI<b>TRACK</b></div>;
  if (!session && !guest) return (
    <div className="loginScreen"><div className="loginBox">
      <div className="logo big">ANI<b>TRACK</b></div>
      <p className="muted">Tu lista de anime, en un solo lugar.</p>
      <AuthPanel email={null} username={null} />
      <button className="link" onClick={() => setGuest(true)}>Explorar sin cuenta</button>
    </div></div>
  );

  return (
    <QuickCtx.Provider value={ctx}>
      <header className="top">
        <button className="logo" onClick={() => setView('home')}>ANI<b>TRACK</b></button>
        <nav className="nav">
          {NAV.map(([v, l]) => <button key={v} className={view === v ? 'on' : ''} onClick={() => setView(v)}>{l}</button>)}
        </nav>
        <button className="acct" onClick={() => setView('account')}>{userId ? (username || 'U').slice(0, 1).toUpperCase() : 'Ingresar'}</button>
      </header>
      <main className="page">
        <div style={show('home')}><Home userId={userId} refreshKey={refreshKey} onOpen={setOpen} onSeeAll={seeAll} /></div>
        <div style={show('explore')}><Explore key={exploreKey} preset={preset} onOpen={setOpen} /></div>
        {view === 'library' && <Library userId={userId} refreshKey={refreshKey} />}
        {view === 'account' && <div className="authPage"><AuthPanel email={session?.user?.email ?? null} username={username} /></div>}
      </main>
      {open && <Detail key={open.id} onOpen={setOpen} a={open} userId={userId} onClose={() => setOpen(null)} onChanged={() => setRefreshKey(k => k + 1)}
        onLogin={() => { setOpen(null); setView('account'); }} />}
    </QuickCtx.Provider>
  );
}
