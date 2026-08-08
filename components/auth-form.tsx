'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { authClient } from '@/lib/auth-client';

export function AuthForm({ returnTo = '/' }: { returnTo?: string }) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const safeReturnTo = returnTo.startsWith('/') ? returnTo : '/';

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = mode === 'signup'
        ? await authClient.signUp.email({ name, email, password })
        : await authClient.signIn.email({ email, password, rememberMe: true });
      if (result.error) {
        setError(result.error.message ?? 'Connexion impossible. Vérifie tes informations puis réessaie.');
        return;
      }
      window.location.assign(safeReturnTo);
    } catch {
      setError('Le service de connexion est indisponible. Réessaie dans quelques instants.');
    } finally {
      setLoading(false);
    }
  }

  return <main className="auth-page"><section className="auth-card" aria-labelledby="auth-title">
    <Link className="auth-brand" href="/"><i>T</i><strong>TrippieMe</strong></Link>
    <p className="eyebrow">VOTRE ESPACE VOYAGE</p>
    <h1 id="auth-title">{mode === 'signin' ? 'Retrouver mes voyages' : 'Créer mon espace voyage'}</h1>
    <p className="auth-intro">Conservez vos itinéraires et retrouvez-les depuis tous vos appareils.</p>
    <form className="auth-form" onSubmit={submit}>
      {mode === 'signup' && <label>Prénom ou nom<input required value={name} onChange={(event) => setName(event.target.value)} minLength={2} autoComplete="name" /></label>}
      <label>Email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" /></label>
      <label>Mot de passe<input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={10} autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} /></label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="dark" disabled={loading}>{loading ? 'Patientez…' : mode === 'signin' ? 'Se connecter' : 'Créer mon compte'}</button>
    </form>
    <button className="auth-switch" onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); }}>{mode === 'signin' ? 'Pas encore de compte ? Créer mon espace' : 'Déjà un compte ? Se connecter'}</button>
    <a className="auth-back" href={safeReturnTo}>← Retour au voyage</a>
  </section></main>;
}
