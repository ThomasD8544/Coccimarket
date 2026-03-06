'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { AuthGuard } from '@/components/auth-guard';

type Batch = {
  id: string;
  quantityRemaining: number;
  dlcDate: string;
  location: string | null;
  state: string;
  status: 'OK' | 'SOON' | 'EXPIRED';
  product: {
    name: string;
    ean: string;
    category: string;
  };
};

const statusLabel: Record<Batch['status'], string> = {
  OK: 'OK',
  SOON: 'A consommer vite',
  EXPIRED: 'Périmé'
};

function LotsPageContent() {
  const searchParams = useSearchParams();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 50;
  const quickFilter = searchParams.get('filter');

  function parisYmd(date: Date) {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Paris',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).formatToParts(date);

    const year = parts.find((p) => p.type === 'year')?.value ?? '1970';
    const month = parts.find((p) => p.type === 'month')?.value ?? '01';
    const day = parts.find((p) => p.type === 'day')?.value ?? '01';

    return `${year}-${month}-${day}`;
  }

  const diffDaysFromTodayParis = useCallback(
    (dlcIso: string) => {
      const today = parisYmd(new Date());
      const dlcYmd = parisYmd(new Date(dlcIso));
      const todayUtc = new Date(`${today}T00:00:00Z`).getTime();
      const dlcUtc = new Date(`${dlcYmd}T00:00:00Z`).getTime();

      return Math.round((dlcUtc - todayUtc) / (24 * 60 * 60 * 1000));
    },
    []
  );

  function load(targetPage = page) {
    fetch(`/api/batches?page=${targetPage}&pageSize=${pageSize}`)
      .then((r) => r.json())
      .then((data) => {
        setBatches(data.batches);
        setPage(data.pagination?.page ?? targetPage);
        setTotalPages(data.pagination?.totalPages ?? 1);
        setTotalCount(data.pagination?.totalCount ?? data.batches.length);
      });
  }

  useEffect(() => {
    load(1);
  }, []);

  const filtered = useMemo(() => {
    return batches.filter((batch) => {
      const diffDays = diffDaysFromTodayParis(batch.dlcDate);

      if (quickFilter === 'today' && diffDays !== 0) return false;
      if (quickFilter === '48h' && (diffDays < 0 || diffDays > 2)) return false;
      if (quickFilter === 'expired' && diffDays >= 0) return false;
      if (categoryFilter && batch.product.category !== categoryFilter) return false;
      if (locationFilter && (batch.location ?? '') !== locationFilter) return false;
      return true;
    });
  }, [batches, categoryFilter, locationFilter, quickFilter, diffDaysFromTodayParis]);

  async function sell(id: string) {
    await fetch(`/api/batches/${id}/sell`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity: 1 })
    });
    load();
  }

  async function discard(id: string) {
    await fetch(`/api/batches/${id}/discard`, { method: 'POST' });
    load();
  }

  const categories = Array.from(new Set(batches.map((b) => b.product.category))).sort();
  const locations = Array.from(
    new Set(
      batches
        .map((b) => b.location)
        .filter((location): location is string => typeof location === 'string' && location.length > 0)
    )
  ).sort();

  const activeCount = filtered.filter((b) => b.quantityRemaining > 0).length;
  const soonCount = filtered.filter((b) => b.status === 'SOON').length;
  const expiredCount = filtered.filter((b) => b.status === 'EXPIRED').length;

  return (
    <AuthGuard>
      <div className="space-y-3">
        <section className="card soft-appear">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h1 className="text-xl font-bold text-stone-800">Lots & DLC</h1>
              <p className="text-xs text-stone-600">Recherche rapide, filtres et actions de stock</p>
            </div>
            <Link className="btn-primary" href="/reception">
              + Nouveau lot
            </Link>
          </div>
        </section>

        <section className="card soft-appear">
          <div className="mb-2 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-stone-100 px-2 py-1 text-stone-700">Affichés: {filtered.length}</span>
            <span className="rounded-full bg-emerald-100 px-2 py-1 text-emerald-700">Actifs: {activeCount}</span>
            <span className="rounded-full bg-amber-100 px-2 py-1 text-amber-700">Bientôt DLC: {soonCount}</span>
            <span className="rounded-full bg-red-100 px-2 py-1 text-red-700">Périmés: {expiredCount}</span>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link className={`btn-secondary ${quickFilter === 'today' ? 'ring-2 ring-amber-300' : ''}`} href="/lots?filter=today">
              Aujourd&apos;hui
            </Link>
            <Link className={`btn-secondary ${quickFilter === '48h' ? 'ring-2 ring-amber-300' : ''}`} href="/lots?filter=48h">
              Sous 48h
            </Link>
            <Link className={`btn-secondary ${quickFilter === 'expired' ? 'ring-2 ring-red-300' : ''}`} href="/lots?filter=expired">
              Périmés
            </Link>
            <Link className="btn-secondary" href="/lots">
              Reset
            </Link>
          </div>
        </section>

        <section className="card grid grid-cols-1 gap-2 sm:grid-cols-2 soft-appear">
          <label className="text-sm">
            Filtre catégorie
            <select className="input mt-1" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="">Toutes</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            Filtre emplacement
            <select className="input mt-1" value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)}>
              <option value="">Tous</option>
              {locations.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </label>
        </section>

        <section className="card flex items-center justify-between soft-appear">
          <p className="text-sm text-stone-600">
            Page {page}/{totalPages} • {totalCount} lots
          </p>
          <div className="flex gap-2">
            <button className="btn-secondary" disabled={page <= 1} onClick={() => load(page - 1)} type="button">
              Précédent
            </button>
            <button className="btn-secondary" disabled={page >= totalPages} onClick={() => load(page + 1)} type="button">
              Suivant
            </button>
          </div>
        </section>

        {filtered.map((batch) => (
          <article className="card soft-appear" key={batch.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold">{batch.product.name}</h3>
                <p className="text-xs text-stone-600">EAN {batch.product.ean}</p>
                <p className="text-xs text-stone-600">DLC {batch.dlcDate.slice(0, 10)}</p>
                <p className="text-xs text-stone-600">Quantité restante {batch.quantityRemaining}</p>
                <p className="text-xs text-stone-500">{batch.location ?? 'Emplacement non renseigné'}</p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  batch.status === 'EXPIRED'
                    ? 'bg-red-100 text-red-800'
                    : batch.status === 'SOON'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {statusLabel[batch.status]}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button className="btn-secondary" onClick={() => sell(batch.id)} type="button">
                Vendu -1
              </button>
              <button className="btn-secondary" onClick={() => discard(batch.id)} type="button">
                Marquer jeté
              </button>
              <Link className="btn-secondary" href={`/lots/${batch.id}`}>
                Détails
              </Link>
            </div>
          </article>
        ))}

        {filtered.length === 0 && (
          <section className="card text-sm text-stone-600 soft-appear">Aucun lot ne correspond aux filtres actuels.</section>
        )}
      </div>
    </AuthGuard>
  );
}

export default function LotsPage() {
  return (
    <Suspense fallback={<div className="card">Chargement…</div>}>
      <LotsPageContent />
    </Suspense>
  );
}
