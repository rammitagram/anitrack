'use client';
import { useState } from 'react';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export default function AuthPanel({ email: sessionEmail, username: name }: { email: string | null; username: string | null }) {
  const [mode, setMode] = useState<'login' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setBusy(true); setMessage('');
    const r = mode === 'signup'
      ? await supabase.auth.signUp({ email, password, options: { data: { username: username.trim().toLowerCase() } } })
      : await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (r.error) setMessage(r.error.message);
    else if (mode === 'signup' && !r.data.session) setMessage('Cuenta creada. Revisá tu correo para confirmarla y después iniciá sesión.');
  }

  if (sessionEmail) return (
    <div className="authCard signedIn">
      <div className="avatar">{(name || sessionEmail).slice(0, 1).toUpperCase()}</div>
      <h3>{name || sessionEmail}</h3>
      <button className="secondaryBtn" onClick={() => supabase?.auth.signOut()}>Cerrar sesión</button>
    </div>
  );

  return (
    <div className="authCard" id="cuenta">
      <h2>{mode === 'signup' ? 'Crear cuenta' : 'Iniciar sesión'}</h2>
      <form onSubmit={submit}>
        {mode === 'signup' && <label>Nombre de usuario<input required minLength={3} maxLength={20} pattern="[A-Za-z0-9_]+" value={username} onChange={e => setUsername(e.target.value)} /></label>}
        <label>Correo<input required type="email" value={email} onChange={e => setEmail(e.target.value)} /></label>
        <label>Contraseña<input required minLength={6} type="password" value={password} onChange={e => setPassword(e.target.value)} /></label>
        <button className="primaryBtn full" disabled={busy || !isSupabaseConfigured}>{mode === 'signup' ? 'Crear cuenta' : 'Entrar'}</button>
        {!isSupabaseConfigured && <small className="muted">Falta conectar Supabase.</small>}
        <p className="switchMode">
          <button type="button" onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')}>
            {mode === 'signup' ? 'Ya tengo cuenta' : 'Crear una cuenta'}
          </button>
        </p>
      </form>
      {message && <p className="message">{message}</p>}
    </div>
  );
}
