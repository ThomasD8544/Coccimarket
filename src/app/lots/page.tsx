'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowRight, Filter, PackageSearch, RotateCcw, Trash2 } from 'lucide-react';
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
  SOON: 'À consommer vite',
  EXPIRED: 'Périmé'
};

function formatParisDate(iso: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Europe/Paris'
  }).format(new Date(iso));
}

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

  const load = useCallback((targetPage = page) => {
    fetch(`/api/batches?page=${targetPage}&pageSize=${pageSize}`)
      .then((r) => r.json())
      .then((data) => {
        setBatches(data.batches);
        setPage(data.pagination?.page ?? targetPage);
        setTotalPages(data.pagination?.totalPages ?? 1);
        setTotalCount(data.pagination?.totalCount ?? data.batches.length);
      });
  }, [page, pageSize]);

  useEffect(() => {
    load(1);
  }, [load]);

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
      <div className="space-y-4 md:space-y-6">
        <section className="card soft-appear">
          <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr] xl:items-end">
            <div>
              <p className="section-kicker">Stock & actions</p>
              <h2 className="section-title mt-3 text-stone-900">Filtrez, priorisez et traitez les lots en un seul écran.</h2>
              <p className="section-subtitle mt-3 max-w-2xl">
                Les filtres rapides isolent les urgences, les critères avancés affinent la recherche, puis les actions stock restent accessibles sans quitter la liste.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 xl:justify-end">
              <Link className="btn-secondary" href="/reception">
                Nouveau lot
              </Link>
              <Link className="btn-primary" href="/lots">
                Vue complète
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-3 xl:grid-cols-4">
          <div className="metric-card soft-appear">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Affichés</p>
            <p className="mt-3 text-4xl font-semibold text-stone-900">{filtered.length}</p>
            <p className="mt-3 text-sm text-slate-600">Résultat après filtres appliqués.</p>
          </div>
          <div className="metric-card soft-appear">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Actifs</p>
            <p className="mt-3 text-4xl font-semibold text-emerald-700">{activeCount}</p>
            <p className="mt-3 text-sm text-slate-600">Lots encore présents en stock.</p>
          </div>
          <div className="metric-card soft-appear">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Bientôt DLC</p>
            <p className="mt-3 text-4xl font-semibold text-amber-700">{soonCount}</p>
            <p className="mt-3 text-sm text-slate-600">À traiter sous 48 heures.</p>
          </div>
          <div className="metric-card soft-appear">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Périmés</p>
            <p className="mt-3 text-4xl font-semibold text-red-700">{expiredCount}</p>
            <p className="mt-3 text-sm text-slate-600">Demandent une décision immédiate.</p>
          </div>
        </section>

        <section className="card soft-appear">
          <div className="flex flex-wrap items-center gap-2">
            <Link className={`${quickFilter === 'today' ? 'btn-primary' : 'btn-secondary'}`} href="/lots?filter=today">
              Aujourd&apos;hui
            </Link>
            <Link className={`${quickFilter === '48h' ? 'btn-primary' : 'btn-secondary'}`} href="/lots?filter=48h">
              Sous 48h
            </Link>
            <Link className={`${quickFilter === 'expired' ? 'btn-primary' : 'btn-secondary'}`} href="/lots?filter=expired">
              Périmés
            </Link>
            <Link className="btn-ghost" href="/lots">
              <RotateCcw className="h-4 w-4" />
              Réinitialiser
            </Link>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1fr_auto]">
            <label className="text-sm font-medium text-stone-800">
              Filtre catégorie
              <select className="select mt-2" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                <option value="">Toutes</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium text-stone-800">
              Filtre emplacement
              <select className="select mt-2" value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)}>
                <option value="">Tous</option>
                {locations.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-end">
              <div className="flex w-full items-center gap-2 rounded-[22px] border border-[rgba(123,106,81,0.12)] bg-white/58 px-4 py-3 text-sm text-slate-600">
                <Filter className="h-4 w-4" />
                Page {page}/{totalPages} • {totalCount} lots
              </div>
            </div>
          </div>
        </section>

        <section className="flex flex-wrap items-center justify-between gap-3 soft-appear">
          <div className="flex flex-wrap gap-2">
            <span className="badge badge-neutral">{filtered.length} visibles</span>
            <span className="badge badge-success">{activeCount} actifs</span>
            <span className="badge badge-warning">{soonCount} bientôt DLC</span>
            <span className="badge badge-danger">{expiredCount} périmés</span>
          </div>
          <div className="flex gap-2">
            <button className="btn-secondary" disabled={page <= 1} onClick={() => load(page - 1)} type="button">
              Précédent
            </button>
            <button className="btn-secondary" disabled={page >= totalPages} onClick={() => load(page + 1)} type="button">
              Suivant
            </button>
          </div>
        </section>

        <section className="space-y-3">
          {filtered.map((batch) => (
            <article className="card soft-appear" key={batch.id}>
              <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold text-stone-900">{batch.product.name}</h3>
                    <span className={`badge ${batch.status === 'EXPIRED' ? 'badge-danger' : batch.status === 'SOON' ? 'badge-warning' : 'badge-success'}`}>
                      {statusLabel[batch.status]}
                    </span>
                    <span className="badge badge-neutral">{batch.product.category}</span>
                  </div>
                  <div className="mt-3 grid gap-3 text-sm text-slate-600 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-[18px] bg-white/70 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">EAN</p>
                      <p className="mt-1 font-medium text-stone-800">{batch.product.ean}</p>
                    </div>
                    <div className="rounded-[18px] bg-white/70 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">DLC</p>
                      <p className="mt-1 font-medium text-stone-800">{formatParisDate(batch.dlcDate)}</p>
                    </div>
                    <div className="rounded-[18px] bg-white/70 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Quantité</p>
                      <p className="mt-1 font-medium text-stone-800">{batch.quantityRemaining}</p>
                    </div>
                    <div className="rounded-[18px] bg-white/70 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Emplacement</p>
                      <p className="mt-1 font-medium text-stone-800">{batch.location ?? 'Non renseigné'}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 lg:justify-end">
                  <button className="btn-secondary" onClick={() => sell(batch.id)} type="button">
                    Vendu -1
                  </button>
                  <button className="btn-secondary" onClick={() => discard(batch.id)} type="button">
                    <Trash2 className="h-4 w-4" />
                    Marquer jeté
                  </button>
                  <Link className="btn-primary" href={`/lots/${batch.id}`}>
                    Détails
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </article>
          ))}

          {filtered.length === 0 && (
            <section className="card soft-appear text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--brand-soft)] text-[var(--brand)]">
                <PackageSearch className="h-6 w-6" />
              </span>
              <h3 className="mt-4 text-lg font-semibold text-stone-900">Aucun lot ne correspond aux filtres</h3>
              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">
                Ajustez la catégorie, l’emplacement ou le filtre rapide pour retrouver les lots attendus.
              </p>
            </section>
          )}
        </section>
      </div>
    </AuthGuard>
  );
}

export default function LotsPage() {
  return (
    <Suspense fallback={<div className="loading-card text-sm text-slate-600">Chargement de la liste des lots…</div>}>
      <LotsPageContent />
    </Suspense>
  );
}
