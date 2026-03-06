'use client';

import Image from 'next/image';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@coccimarket.local');
  const [password, setPassword] = useState('admin1234');
  const [error, setError] = useState('');

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!res.ok) {
      setError('Identifiants invalides');
      return;
    }

    router.replace('/dashboard');
  }

  return (
    <main className="mx-auto min-h-screen max-w-md p-4 pt-16">
      <div className="card soft-appear">
        <div className="mb-4 rounded-xl bg-[#5f6163] p-4">
          <Image alt="CocciMarket" className="h-auto w-52" height={166} src="/coccimarket-logo.png" width={500} />
        </div>
        <h1 className="mb-4 text-xl font-semibold">Connexion équipe</h1>
        <form className="space-y-3" onSubmit={onSubmit}>
          <label className="block text-sm">
            Email
            <input className="input mt-1" value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
          </label>
          <label className="block text-sm">
            Mot de passe
            <input
              className="input mt-1"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
            />
          </label>
          {error && <p className="text-sm text-red-700">{error}</p>}
          <button className="btn-primary w-full" type="submit">
            Se connecter
          </button>
        </form>
      </div>
    </main>
  );
}
