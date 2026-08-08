'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { authClient } from '@/lib/auth-client';

export function AuthForm({ returnTo = '/', googleEnabled }: { returnTo?: string; googleEnabled: boolean }) {
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

  async function signInWithGoogle() {
    setError('');
    setLoading(true);
    try {
      const result = await authClient.signIn.social({ provider: 'google', callbackURL: safeReturnTo });
      if (result.error) {
        setError(result.error.message ?? 'La connexion Google est indisponible. Réessaie dans quelques instants.');
        setLoading(false);
      }
    } catch {
      setError('La connexion Google est indisponible. Réessaie dans quelques instants.');
      setLoading(false);
    }
  }

  return <main className="auth-page"><section className="auth-card" aria-labelledby="auth-title">
    <Link className="auth-brand" href="/"><i>T</i><strong>TrippieMe</strong></Link>
    <p className="eyebrow">VOTRE ESPACE VOYAGE</p>
    <h1 id="auth-title">{mode === 'signin' ? 'Retrouver mes voyages' : 'Créer mon espace voyage'}</h1>
    <p className="auth-intro">Conservez vos itinéraires et retrouvez-les depuis tous vos appareils.</p>
    {googleEnabled ? <>
      <button className="google-auth" type="button" onClick={() => void signInWithGoogle()} disabled={loading}>
        <GoogleMark /> Continuer avec Google
      </button>
      <div className="auth-divider" aria-hidden="true"><span>ou</span></div>
    </> : <p className="auth-provider-note">La connexion Google sera disponible dès que le fournisseur OAuth sera configuré.</p>}
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

function GoogleMark() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
    <path fill="#4285F4" d="M21.8 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.5a4.7 4.7 0 0 1-2 3.1v2.5h3.2c1.9-1.8 3.1-4.4 3.1-7.4Z" />
    <path fill="#34A853" d="M12 22c2.7 0 5-.9 6.7-2.4l-3.2-2.5c-.9.6-2 .9-3.5.9-2.7 0-5-1.8-5.8-4.3H2.9v2.6A10 10 0 0 0 12 22Z" />
    <path fill="#FBBC05" d="M6.2 13.7a6 6 0 0 1 0-3.4V7.7H2.9a10 10 0 0 0 0 8.6l3.3-2.6Z" />
    <path fill="#EA4335" d="M12 6c1.6 0 3 .5 4.1 1.6l3.1-3A10 10 0 0 0 2.9 7.7l3.3 2.6C7 7.8 9.3 6 12 6Z" />
  </svg>;
}
