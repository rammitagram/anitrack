'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import AuthPanel from '@/components/AuthPanel';
import Explore from '@/components/Explore';
import Library from '@/components/Library';

export default function Home() {
  const [session, setSession] = useState<any>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!supabase || !session?.user) { setUsername(null); return; }
    supabase.from('profiles').select('username').eq('id', session.user.id).maybeSingle().then(({ data }) => setUsername(data?.username ?? null));
  }, [session]);

  const userId: string | null = session?.user?.id ?? null;

  return (
    <main className="shell">
      <header className="topbar">
        <a className="brand" href="#"><span>ANI<span className="purple">TRACK</span></span></a>
        <nav><a href="#explorar">Buscar</a><a href="#biblioteca">Mi biblioteca</a></nav>
      </header>
      <AuthPanel email={session?.user?.email ?? null} username={username} />
      <Explore userId={userId} onAdded={() => setRefreshKey(k => k + 1)} />
      <Library userId={userId} refreshKey={refreshKey} />
    </main>
  );
}
