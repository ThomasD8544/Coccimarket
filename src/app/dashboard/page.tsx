'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
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
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Europe/Paris'
  }).format(new Date(iso));
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

  return (
    <AuthGuard>
      <div className="space-y-4">
        <section className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <Link className="card block border-amber-300 soft-appear hover:shadow-md" href="/lots?filter=today">
            <p className="text-xs uppercase tracking-wide text-stone-500">A traiter aujourd&apos;hui</p>
            <p className="mt-2 text-4xl font-bold text-amber-700">{counters?.toProcessToday ?? '-'}</p>
            <p className="mt-1 text-xs text-stone-500">Ouvrir la liste</p>
          </Link>
          <Link className="card block border-orange-300 soft-appear hover:shadow-md" href="/lots?filter=48h">
            <p className="text-xs uppercase tracking-wide text-stone-500">Sous 48h</p>
            <p className="mt-2 text-4xl font-bold text-orange-700">{counters?.toProcess48h ?? '-'}</p>
            <p className="mt-1 text-xs text-stone-500">Ouvrir la liste</p>
          </Link>
          <Link className="card block border-red-300 soft-appear hover:shadow-md" href="/lots?filter=expired">
            <p className="text-xs uppercase tracking-wide text-stone-500">Périmés</p>
            <p className="mt-2 text-4xl font-bold text-red-700">{counters?.expired ?? '-'}</p>
            <p className="mt-1 text-xs text-stone-500">Ouvrir la liste</p>
          </Link>
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.3fr_1fr]">
          <article className="card soft-appear">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold">A traiter maintenant</h2>
              <Link className="text-sm text-[#d97400]" href="/lots?filter=48h">
                Voir tout
              </Link>
            </div>

            <div className="space-y-2">
              {urgent.length === 0 && <p className="text-sm text-stone-500">Aucun lot urgent.</p>}
              {urgent.map((batch) => (
                <Link
                  className="flex items-center justify-between rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm hover:border-orange-300"
                  href={`/lots/${batch.id}`}
                  key={batch.id}
                >
                  <div>
                    <p className="font-semibold text-stone-800">{batch.product.name}</p>
                    <p className="text-xs text-stone-500">DLC {formatParisDate(batch.dlcDate)}</p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-semibold ${
                      batch.status === 'EXPIRED' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {batch.status === 'EXPIRED' ? 'Périmé' : 'Urgent'}
                  </span>
                </Link>
              ))}
            </div>
          </article>

          <article className="card soft-appear">
            <h2 className="mb-3 text-lg font-semibold">Résumé stock</h2>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between rounded-xl bg-white px-3 py-2">
                <span>Total lots actifs</span>
                <strong>{active.length}</strong>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-white px-3 py-2">
                <span>Lots bientôt DLC</span>
                <strong>{active.filter((b) => b.status === 'SOON').length}</strong>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-white px-3 py-2">
                <span>Lots périmés</span>
                <strong>{active.filter((b) => b.status === 'EXPIRED').length}</strong>
              </div>
            </div>
          </article>
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1fr]">
          <article className="card soft-appear">
            <h2 className="mb-3 text-lg font-semibold">Catégories principales</h2>
            <div className="space-y-2">
              {byCategory.map((item) => (
                <div className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-sm" key={item.category}>
                  <span>{item.category}</span>
                  <strong>{item.count}</strong>
                </div>
              ))}
              {byCategory.length === 0 && <p className="text-sm text-stone-500">Pas encore de données.</p>}
            </div>
          </article>

          <PushEnable />
        </section>
      </div>
    </AuthGuard>
  );
}
