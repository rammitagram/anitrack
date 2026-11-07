'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { AnimeResult } from '@/lib/types';
import AuthPanel from '@/components/AuthPanel';
import Detail from '@/components/Detail';
import Explore from '@/components/Explore';
import Home from '@/components/Home';
import Library from '@/components/Library';

type View = 'home' | 'explore' | 'library' | 'account';
const NAV: [View, string][] = [['home', 'Inicio'], ['explore', 'Explorar'], ['library', 'Mi biblioteca']];

export default function Page() {
  const [session, setSession] = useState<any>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [view, setView] = useState<View>('home');
  const [open, setOpen] = useState<AnimeResult | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
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

  return (
    <>
      <header className="top">
        <button className="logo" onClick={() => setView('home')}>ANI<b>TRACK</b></button>
        <nav className="nav">
          {NAV.map(([v, l]) => <button key={v} className={view === v ? 'on' : ''} onClick={() => setView(v)}>{l}</button>)}
        </nav>
        <button className="acct" onClick={() => setView('account')}>{userId ? (username || 'U').slice(0, 1).toUpperCase() : 'Ingresar'}</button>
      </header>
      <main className="page">
        <div style={show('home')}><Home userId={userId} refreshKey={refreshKey} onOpen={setOpen} /></div>
        <div style={show('explore')}><Explore onOpen={setOpen} /></div>
        {view === 'library' && <Library userId={userId} refreshKey={refreshKey} />}
        {view === 'account' && <div className="authPage"><AuthPanel email={session?.user?.email ?? null} username={username} /></div>}
      </main>
      {open && <Detail a={open} userId={userId} onClose={() => setOpen(null)} onChanged={() => setRefreshKey(k => k + 1)}
        onLogin={() => { setOpen(null); setView('account'); }} />}
    </>
  );
}
