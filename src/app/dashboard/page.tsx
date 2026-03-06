'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowRight, BellRing, Clock3, Package2, Sparkles, TimerReset } from 'lucide-react';
import { AuthGuard } from '@/components/auth-guard';
import { PushEnable } from '@/components/push-enable';

type Counters = {
  toProcessToday: number;
  toProcess48h: number;
  expired: number;
};

type Batch = {
  id: string;
  quantityRemaining: number;
  dlcDate: string;
  location: string | null;
  status: 'OK' | 'SOON' | 'EXPIRED';
  product: {
    name: string;
    category: string;
  };
};

function formatParisDate(iso: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Europe/Paris'
  }).format(new Date(iso));
}

function parisNowLabel() {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    timeZone: 'Europe/Paris'
  }).format(new Date());
}

export default function DashboardPage() {
  const [counters, setCounters] = useState<Counters | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);

  useEffect(() => {
    fetch('/api/dashboard')
      .then((r) => r.json())
      .then((data) => setCounters(data.counters));

    fetch('/api/batches')
      .then((r) => r.json())
      .then((data) => setBatches(data.batches));
  }, []);

  const active = useMemo(() => batches.filter((b) => b.quantityRemaining > 0), [batches]);
  const urgent = useMemo(() => active.filter((b) => b.status === 'SOON' || b.status === 'EXPIRED').slice(0, 6), [active]);

  const byCategory = useMemo(() => {
    const counts = new Map<string, number>();
    for (const b of active) {
      counts.set(b.product.category, (counts.get(b.product.category) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [active]);

  const soon = active.filter((b) => b.status === 'SOON').length;
  const expired = active.filter((b) => b.status === 'EXPIRED').length;
  const healthLabel = expired > 0 ? 'Intervention immédiate' : soon > 0 ? 'Surveillance renforcée' : 'Situation stable';

  return (
    <AuthGuard>
      <div className="space-y-4 md:space-y-6">
        <section className="card soft-appear overflow-hidden">
          <div className="grid gap-5 lg:grid-cols-[1.3fr_0.9fr] lg:items-end">
            <div>
              <p className="section-kicker">Vue opérationnelle</p>
              <h2 className="section-title mt-3 text-stone-900">Priorisez les lots qui demandent une action aujourd’hui.</h2>
              <p className="section-subtitle mt-3 max-w-2xl">
                {parisNowLabel()} : cette synthèse met en avant les urgences DLC, le volume actif et les catégories à surveiller pendant le service.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link className="btn-primary" href="/reception">
                  Ajouter une réception
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link className="btn-secondary" href="/lots?filter=48h">
                  Voir les lots sensibles
                </Link>
              </div>
            </div>

            <div className="rounded-[28px] border border-[rgba(216,109,31,0.12)] bg-[linear-gradient(135deg,rgba(255,241,225,0.88)_0%,rgba(255,249,241,0.7)_100%)] p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-600">État du parc aujourd’hui</p>
                  <p className="mt-2 text-2xl font-semibold text-stone-900">{healthLabel}</p>
                </div>
                <span className={`badge ${expired > 0 ? 'badge-danger' : soon > 0 ? 'badge-warning' : 'badge-success'}`}>
                  <Sparkles className="h-3.5 w-3.5" />
                  {expired > 0 ? 'Alerte' : soon > 0 ? 'Attention' : 'Maîtrisé'}
                </span>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-[22px] bg-white/70 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Actifs</p>
                  <p className="mt-2 text-3xl font-semibold text-stone-900">{active.length}</p>
                </div>
                <div className="rounded-[22px] bg-white/70 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Sous tension</p>
                  <p className="mt-2 text-3xl font-semibold text-amber-700">{soon}</p>
                </div>
                <div className="rounded-[22px] bg-white/70 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Périmés</p>
                  <p className="mt-2 text-3xl font-semibold text-red-700">{expired}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-3 xl:grid-cols-3">
          <Link className="metric-card soft-appear block" href="/lots?filter=today">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">À traiter aujourd’hui</p>
                <p className="mt-3 text-4xl font-semibold text-stone-900">{counters?.toProcessToday ?? '-'}</p>
              </div>
              <span className="rounded-2xl bg-[var(--warning-soft)] p-3 text-[var(--warning)]">
                <Clock3 className="h-5 w-5" />
              </span>
            </div>
            <p className="mt-4 text-sm text-slate-600">Lots dont la DLC tombe aujourd’hui. Priorité immédiate pour le service.</p>
            {!counters && <p className="mt-2 text-xs text-slate-500">Chargement des indicateurs en cours…</p>}
          </Link>

          <Link className="metric-card soft-appear block" href="/lots?filter=48h">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Sous 48 heures</p>
                <p className="mt-3 text-4xl font-semibold text-stone-900">{counters?.toProcess48h ?? '-'}</p>
              </div>
              <span className="rounded-2xl bg-[#fff1e1] p-3 text-[var(--brand)]">
                <TimerReset className="h-5 w-5" />
              </span>
            </div>
            <p className="mt-4 text-sm text-slate-600">Vision anticipée des produits à écouler rapidement pour réduire la casse.</p>
            {!counters && <p className="mt-2 text-xs text-slate-500">Chargement des indicateurs en cours…</p>}
          </Link>

          <Link className="metric-card soft-appear block" href="/lots?filter=expired">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Déjà périmés</p>
                <p className="mt-3 text-4xl font-semibold text-stone-900">{counters?.expired ?? '-'}</p>
              </div>
              <span className="rounded-2xl bg-[var(--danger-soft)] p-3 text-[var(--danger)]">
                <AlertTriangle className="h-5 w-5" />
              </span>
            </div>
            <p className="mt-4 text-sm text-slate-600">Lots qui demandent une décision immédiate pour sécuriser le stock.</p>
            {!counters && <p className="mt-2 text-xs text-slate-500">Chargement des indicateurs en cours…</p>}
          </Link>
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.3fr_0.9fr]">
          <article className="card soft-appear">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="section-kicker">Priorité terrain</p>
                <h3 className="mt-2 text-xl font-semibold text-stone-900">Lots à traiter maintenant</h3>
              </div>
              <Link className="btn-secondary" href="/lots?filter=48h">
                Ouvrir la liste complète
              </Link>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="badge badge-neutral">
                <Package2 className="h-3.5 w-3.5" />
                {active.length} lots actifs
              </span>
              <span className="badge badge-warning">{soon} bientôt DLC</span>
              <span className="badge badge-danger">{expired} périmés</span>
            </div>

            <div className="mt-5 space-y-3">
              {urgent.length === 0 && (
                <div className="rounded-[22px] border border-dashed border-[rgba(123,106,81,0.24)] bg-white/45 px-4 py-5 text-sm text-slate-600">
                  Aucun lot urgent pour le moment. La situation stock est stable.
                </div>
              )}
              {urgent.map((batch) => (
                <Link
                  className="group flex items-center justify-between gap-4 rounded-[22px] border border-[rgba(123,106,81,0.12)] bg-white/72 px-4 py-4 transition hover:border-[rgba(216,109,31,0.22)] hover:bg-white"
                  href={`/lots/${batch.id}`}
                  key={batch.id}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-base font-semibold text-stone-900">{batch.product.name}</p>
                      <span className="badge badge-neutral">{batch.product.category}</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">
                      DLC {formatParisDate(batch.dlcDate)}{batch.location ? ` • ${batch.location}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`badge ${batch.status === 'EXPIRED' ? 'badge-danger' : 'badge-warning'}`}>
                      {batch.status === 'EXPIRED' ? 'Périmé' : 'Urgent'}
                    </span>
                    <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:text-[var(--brand)]" />
                  </div>
                </Link>
              ))}
            </div>
          </article>

          <article className="card soft-appear">
            <p className="section-kicker">Résumé stock</p>
            <h3 className="mt-2 text-xl font-semibold text-stone-900">Lecture rapide des volumes</h3>
            <div className="mt-5 space-y-3 text-sm">
              <div className="flex items-center justify-between rounded-[20px] bg-white/72 px-4 py-3">
                <span className="text-slate-600">Total lots actifs</span>
                <strong className="text-base text-stone-900">{active.length}</strong>
              </div>
              <div className="flex items-center justify-between rounded-[20px] bg-white/72 px-4 py-3">
                <span className="text-slate-600">Lots bientôt DLC</span>
                <strong className="text-base text-amber-700">{soon}</strong>
              </div>
              <div className="flex items-center justify-between rounded-[20px] bg-white/72 px-4 py-3">
                <span className="text-slate-600">Lots périmés</span>
                <strong className="text-base text-red-700">{expired}</strong>
              </div>
            </div>

            <div className="mt-6 rounded-[24px] border border-[rgba(123,106,81,0.12)] bg-white/68 p-4">
              <div className="flex items-center gap-3">
                <span className="rounded-2xl bg-[#eef6ff] p-2 text-sky-700">
                  <BellRing className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-stone-900">Rituel conseillé</p>
                  <p className="text-sm leading-6 text-slate-600">Passez sur la liste “Sous 48 heures” en début et fin de service.</p>
                </div>
              </div>
            </div>
          </article>
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-[0.95fr_1.05fr]">
          <article className="card soft-appear">
            <p className="section-kicker">Top catégories</p>
            <h3 className="mt-2 text-xl font-semibold text-stone-900">Où se concentre le stock actif</h3>
            <div className="mt-5 space-y-3">
              {byCategory.map((item, index) => (
                <div className="flex items-center justify-between rounded-[20px] bg-white/72 px-4 py-3 text-sm" key={item.category}>
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--brand-soft)] text-xs font-semibold text-[var(--brand)]">
                      {index + 1}
                    </span>
                    <span className="font-medium text-stone-800">{item.category}</span>
                  </div>
                  <strong className="text-stone-900">{item.count}</strong>
                </div>
              ))}
              {byCategory.length === 0 && <p className="text-sm text-slate-600">Pas encore de données sur les catégories actives.</p>}
            </div>
          </article>

          <PushEnable />
        </section>
      </div>
    </AuthGuard>
  );
}
