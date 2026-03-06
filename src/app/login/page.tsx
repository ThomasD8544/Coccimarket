'use client';

import Image from 'next/image';
import { ArrowRight, ShieldCheck } from 'lucide-react';
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
    <main className="relative min-h-screen overflow-hidden px-4 py-8 md:px-8 md:py-12">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="soft-appear hidden rounded-[32px] border border-white/50 bg-[linear-gradient(180deg,rgba(31,36,41,0.94)_0%,rgba(45,52,60,0.92)_100%)] p-8 text-white shadow-[0_40px_80px_-48px_rgba(14,15,18,0.85)] lg:block">
          <p className="section-kicker !text-white/55">CocciMarket DLC</p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight">L’outil terrain pour piloter les DLC sans friction.</h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-white/70">
            Une interface claire pour suivre les urgences, enregistrer les réceptions et garder le stock traiteur maîtrisé tout au long de la journée.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
              <p className="text-3xl font-semibold text-[#ffbe82]">48h</p>
              <p className="mt-2 text-sm leading-6 text-white/70">Vision immédiate sur les produits à traiter avant rupture ou perte.</p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
              <p className="text-3xl font-semibold text-[#ffbe82]">Mobile</p>
              <p className="mt-2 text-sm leading-6 text-white/70">Conçu pour scanner, valider et agir rapidement depuis le terrain.</p>
            </div>
          </div>
        </section>

        <section className="soft-appear glass-panel mx-auto w-full max-w-xl rounded-[32px] p-6 md:p-8">
          <div className="rounded-[28px] bg-[linear-gradient(135deg,#2b3138_0%,#464f59_100%)] p-5 shadow-[0_24px_48px_-32px_rgba(18,22,26,0.85)]">
            <Image alt="CocciMarket" className="h-auto w-52" height={166} priority src="/coccimarket-logo.png" width={500} />
          </div>

          <div className="mt-6 flex items-center gap-3">
            <span className="rounded-2xl bg-emerald-50 p-2 text-emerald-700">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-stone-900">Connexion équipe</h1>
              <p className="mt-1 text-sm text-slate-600">Accédez au suivi DLC, aux réceptions et aux actions stock.</p>
            </div>
          </div>

          <form className="mt-8 space-y-4" onSubmit={onSubmit}>
            <label className="block text-sm font-medium text-stone-800">
              Email
              <input className="input mt-2" value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
            </label>
            <label className="block text-sm font-medium text-stone-800">
              Mot de passe
              <input className="input mt-2" value={password} onChange={(e) => setPassword(e.target.value)} type="password" />
            </label>
            {error && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
            <button className="btn-primary w-full" type="submit">
              Se connecter
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <div className="mt-6 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
            <div className="card-muted">Accès rapide aux urgences DLC et aux lots actifs.</div>
            <div className="card-muted">Flux optimisé pour mobile, tablette et poste fixe.</div>
          </div>
        </section>
      </div>
    </main>
  );
}
