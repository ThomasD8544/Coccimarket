'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AlertTriangle, ArrowLeft, CalendarClock, MapPin, Package2, Trash2 } from 'lucide-react';
import { AuthGuard } from '@/components/auth-guard';

type Batch = {
  id: string;
  quantityInitial: number;
  quantityRemaining: number;
  dlcDate: string;
  lotNumber: string | null;
  location: string | null;
  state: string;
  status: 'OK' | 'SOON' | 'EXPIRED';
  createdAt: string;
  product: {
    name: string;
    ean: string;
    category: string;
    supplier: string | null;
  };
};

function formatParisDate(iso: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/Paris'
  }).format(new Date(iso));
}

function statusClass(status: Batch['status']) {
  if (status === 'EXPIRED') return 'badge-danger';
  if (status === 'SOON') return 'badge-warning';
  return 'badge-success';
}

function statusLabel(status: Batch['status']) {
  if (status === 'EXPIRED') return 'Périmé';
  if (status === 'SOON') return 'À traiter vite';
  return 'Conforme';
}

export default function LotDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [batch, setBatch] = useState<Batch | null>(null);

  useEffect(() => {
    fetch(`/api/batches/${params.id}`)
      .then((r) => r.json())
      .then((data) => setBatch(data.batch));
  }, [params.id]);

  async function deleteBatch() {
    const res = await fetch(`/api/batches/${params.id}/delete`, { method: 'DELETE' });
    if (res.ok) {
      router.replace('/lots');
    }
  }

  const consumed = useMemo(() => {
    if (!batch) return 0;
    return Math.max(0, batch.quantityInitial - batch.quantityRemaining);
  }, [batch]);

  return (
    <AuthGuard>
      {!batch ? (
        <div className="loading-card soft-appear text-sm text-slate-600">Chargement de la fiche lot…</div>
      ) : (
        <div className="space-y-4 md:space-y-6">
          <section className="card soft-appear">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="section-kicker">Détail du lot</p>
                <h2 className="section-title mt-3 text-stone-900">{batch.product.name}</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className={`badge ${statusClass(batch.status)}`}>{statusLabel(batch.status)}</span>
                  <span className="badge badge-neutral">{batch.product.category}</span>
                </div>
                <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600">
                  Consultez les informations de traçabilité, la consommation du lot et les éléments utiles avant suppression en cas d’erreur de saisie.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link className="btn-secondary" href="/lots">
                  <ArrowLeft className="h-4 w-4" />
                  Retour aux lots
                </Link>
                <button className="btn-secondary" onClick={deleteBatch} type="button">
                  <Trash2 className="h-4 w-4" />
                  Supprimer ce lot
                </button>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-3 xl:grid-cols-3">
            <div className="metric-card soft-appear">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Quantité initiale</p>
              <p className="mt-3 text-4xl font-semibold text-stone-900">{batch.quantityInitial}</p>
              <p className="mt-3 text-sm text-slate-600">Volume entré en stock à la réception.</p>
            </div>
            <div className="metric-card soft-appear">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Reste en stock</p>
              <p className="mt-3 text-4xl font-semibold text-emerald-700">{batch.quantityRemaining}</p>
              <p className="mt-3 text-sm text-slate-600">Quantité encore disponible sur ce lot.</p>
            </div>
            <div className="metric-card soft-appear">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Déjà consommé</p>
              <p className="mt-3 text-4xl font-semibold text-[var(--brand)]">{consumed}</p>
              <p className="mt-3 text-sm text-slate-600">Écart entre la réception et le stock actuel.</p>
            </div>
          </section>

          <section className="grid gap-4 xl:grid-cols-[1.04fr_0.96fr]">
            <article className="card soft-appear">
              <p className="section-kicker">Traçabilité produit</p>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <div className="rounded-[20px] bg-white/72 px-4 py-4 text-sm">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">EAN</p>
                  <p className="mt-2 font-medium text-stone-900">{batch.product.ean}</p>
                </div>
                <div className="rounded-[20px] bg-white/72 px-4 py-4 text-sm">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Fournisseur</p>
                  <p className="mt-2 font-medium text-stone-900">{batch.product.supplier ?? 'Non renseigné'}</p>
                </div>
                <div className="rounded-[20px] bg-white/72 px-4 py-4 text-sm">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Numéro de lot</p>
                  <p className="mt-2 font-medium text-stone-900">{batch.lotNumber ?? 'Non renseigné'}</p>
                </div>
                <div className="rounded-[20px] bg-white/72 px-4 py-4 text-sm">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">État interne</p>
                  <p className="mt-2 font-medium text-stone-900">{batch.state}</p>
                </div>
              </div>
            </article>

            <article className="card soft-appear">
              <p className="section-kicker">Dates & localisation</p>
              <div className="mt-5 space-y-3 text-sm">
                <div className="flex items-start gap-3 rounded-[20px] bg-white/72 px-4 py-4">
                  <span className="rounded-2xl bg-[var(--brand-soft)] p-2 text-[var(--brand)]">
                    <CalendarClock className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="font-medium text-stone-900">DLC</p>
                    <p className="mt-1 text-slate-600">{formatParisDate(batch.dlcDate)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-[20px] bg-white/72 px-4 py-4">
                  <span className="rounded-2xl bg-[#eef6ff] p-2 text-sky-700">
                    <MapPin className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="font-medium text-stone-900">Emplacement</p>
                    <p className="mt-1 text-slate-600">{batch.location ?? 'Non renseigné'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-[20px] bg-white/72 px-4 py-4">
                  <span className="rounded-2xl bg-red-50 p-2 text-red-700">
                    <AlertTriangle className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="font-medium text-stone-900">Entrée en stock</p>
                    <p className="mt-1 text-slate-600">{new Date(batch.createdAt).toLocaleString('fr-FR')}</p>
                  </div>
                </div>
              </div>
            </article>
          </section>

          <section className="card soft-appear">
            <div className="flex items-start gap-3">
              <span className="rounded-2xl bg-red-50 p-2 text-red-700">
                <Package2 className="h-5 w-5" />
              </span>
              <div>
                <p className="section-kicker">Action sensible</p>
                <h3 className="mt-1 text-xl font-semibold text-stone-900">Suppression en cas d’erreur de saisie</h3>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                  Réservé aux corrections administratives. Cette action retire définitivement le lot et vous renvoie vers la liste globale.
                </p>
                <button className="btn-secondary mt-4" onClick={deleteBatch} type="button">
                  <Trash2 className="h-4 w-4" />
                  Supprimer ce lot
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </AuthGuard>
  );
}
