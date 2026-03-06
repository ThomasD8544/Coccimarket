'use client';

import { FormEvent, useCallback, useMemo, useState } from 'react';
import { Barcode, CheckCircle2, PackagePlus, ScanLine, Sparkles } from 'lucide-react';
import { AuthGuard } from '@/components/auth-guard';
import { Scanner } from '@/components/scanner';

type Product = {
  id: string;
  ean: string;
  name: string;
  category: string;
  supplier?: string;
};

type UiMessage = {
  tone: 'info' | 'success' | 'error';
  text: string;
};

function parisTodayYmd() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());
}

function addDaysYmd(days: number) {
  const now = new Date();
  const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(future);
}

export default function ReceptionPage() {
  const [showScanner, setShowScanner] = useState(false);
  const [ean, setEan] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [supplier, setSupplier] = useState('');
  const [quantityInitial, setQuantityInitial] = useState(1);
  const [dlcDate, setDlcDate] = useState('');
  const [lotNumber, setLotNumber] = useState('');
  const [location, setLocation] = useState('Banc principal');
  const [message, setMessage] = useState<UiMessage | null>(null);
  const [lastScannedCode, setLastScannedCode] = useState('');

  const canSubmit = useMemo(() => Boolean(ean && name && category && dlcDate && quantityInitial > 0), [ean, name, category, dlcDate, quantityInitial]);

  const loadProductByEan = useCallback(async (code: string) => {
    const normalizedCode = code.trim();
    setLastScannedCode(normalizedCode);
    setEan(normalizedCode);
    setMessage({ tone: 'info', text: `Code détecté : ${normalizedCode}` });

    const res = await fetch(`/api/products?ean=${encodeURIComponent(normalizedCode)}`);
    if (!res.ok) return;

    const data = await res.json();
    const product: Product | null = data.product;
    if (!product) {
      setMessage({ tone: 'info', text: 'Produit inconnu : complète les champs pour création rapide.' });
      return;
    }

    setName(product.name);
    setCategory(product.category);
    setSupplier(product.supplier ?? '');
    setMessage({ tone: 'success', text: 'Produit reconnu automatiquement.' });
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage(null);

    const res = await fetch('/api/batches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ean,
        name,
        category,
        supplier,
        quantityInitial,
        dlcDate,
        lotNumber,
        location
      })
    });

    if (!res.ok) {
      setMessage({ tone: 'error', text: 'Erreur enregistrement lot. Vérifie DLC et quantité.' });
      return;
    }

    setMessage({ tone: 'success', text: 'Lot enregistré.' });
    setQuantityInitial(1);
    setDlcDate('');
    setLotNumber('');
  }

  return (
    <AuthGuard>
      <div className="space-y-4 md:space-y-6">
        <section className="card soft-appear">
          <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr] xl:items-center">
            <div>
              <p className="section-kicker">Flux réception</p>
              <h2 className="section-title mt-3 text-stone-900">Enregistrez un lot en quelques étapes, sans casser le rythme du terrain.</h2>
              <p className="section-subtitle mt-3 max-w-2xl">
                Le scan lance la reconnaissance produit, puis la saisie rapide permet de valider quantité, DLC et emplacement avec un minimum d’actions.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="card-muted">
                <ScanLine className="h-5 w-5 text-[var(--brand)]" />
                <p className="mt-3 text-sm font-semibold text-stone-900">Scanner</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">EAN13 ou QR depuis iPhone ou tablette.</p>
              </div>
              <div className="card-muted">
                <Sparkles className="h-5 w-5 text-[var(--brand)]" />
                <p className="mt-3 text-sm font-semibold text-stone-900">Préremplir</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">Le produit est reconnu automatiquement quand il existe déjà.</p>
              </div>
              <div className="card-muted">
                <PackagePlus className="h-5 w-5 text-[var(--brand)]" />
                <p className="mt-3 text-sm font-semibold text-stone-900">Valider</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">Le lot part en stock immédiatement après confirmation.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
          <div className="space-y-4">
            <section className="card soft-appear-delayed">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="section-kicker">Scan produit</p>
                  <h3 className="mt-2 text-xl font-semibold text-stone-900">Détection code-barres</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">Lancez le scan seulement quand vous êtes prêt à valider la fiche.</p>
                </div>
                <button className={showScanner ? 'btn-secondary' : 'btn-primary'} onClick={() => setShowScanner((v) => !v)} type="button">
                  <ScanLine className="h-4 w-4" />
                  {showScanner ? 'Fermer le scan' : 'Lancer le scan'}
                </button>
              </div>

              {showScanner ? <div className="mt-5 overflow-hidden rounded-[24px]"> <Scanner onDetected={loadProductByEan} /> </div> : null}

              <div className="mt-5 rounded-[22px] border border-dashed border-[rgba(123,106,81,0.22)] bg-white/50 px-4 py-4">
                <div className="flex items-center gap-3">
                  <span className="rounded-2xl bg-[#fff1e1] p-2 text-[var(--brand)]">
                    <Barcode className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-stone-900">Dernier code lu</p>
                    <p className="text-sm text-slate-600">{lastScannedCode || 'Aucun scan sur cette session.'}</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="card soft-appear-delayed">
              <p className="section-kicker">Repères rapides</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <div className="rounded-[22px] bg-white/68 p-4">
                  <p className="text-sm font-semibold text-stone-900">Date du jour</p>
                  <p className="mt-1 text-sm text-slate-600">{parisTodayYmd()}</p>
                </div>
                <div className="rounded-[22px] bg-white/68 p-4">
                  <p className="text-sm font-semibold text-stone-900">Emplacement par défaut</p>
                  <p className="mt-1 text-sm text-slate-600">Banc principal</p>
                </div>
              </div>
            </section>
          </div>

          <form className="card soft-appear space-y-5" onSubmit={onSubmit}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="section-kicker">Saisie rapide</p>
                <h3 className="mt-2 text-xl font-semibold text-stone-900">Compléter le lot</h3>
              </div>
              <span className="badge badge-neutral">Validation immédiate</span>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="block text-sm font-medium text-stone-800">
                EAN
                <input className="input mt-2" value={ean} onChange={(e) => setEan(e.target.value)} required />
              </label>
              <label className="block text-sm font-medium text-stone-800">
                Nom produit
                <input className="input mt-2" value={name} onChange={(e) => setName(e.target.value)} required />
              </label>
              <label className="block text-sm font-medium text-stone-800">
                Catégorie
                <input className="input mt-2" value={category} onChange={(e) => setCategory(e.target.value)} required />
              </label>
              <label className="block text-sm font-medium text-stone-800">
                Fournisseur
                <input className="input mt-2" value={supplier} onChange={(e) => setSupplier(e.target.value)} />
              </label>

              <div className="rounded-[24px] border border-[rgba(123,106,81,0.14)] bg-white/56 p-4">
                <p className="text-sm font-medium text-stone-800">Quantité</p>
                <div className="mt-3 flex items-center gap-3">
                  <button className="btn-secondary px-4" onClick={() => setQuantityInitial((q) => Math.max(1, q - 1))} type="button">
                    -
                  </button>
                  <input
                    className="input text-center"
                    value={quantityInitial}
                    onChange={(e) => setQuantityInitial(Number(e.target.value))}
                    type="number"
                    min={1}
                    required
                  />
                  <button className="btn-secondary px-4" onClick={() => setQuantityInitial((q) => q + 1)} type="button">
                    +
                  </button>
                </div>
              </div>

              <div className="rounded-[24px] border border-[rgba(123,106,81,0.14)] bg-white/56 p-4">
                <label className="block text-sm font-medium text-stone-800">
                  DLC
                  <input className="input mt-3" value={dlcDate} onChange={(e) => setDlcDate(e.target.value)} type="date" required />
                </label>
                <div className="mt-3 flex flex-wrap gap-2">
                  {[1, 2, 3, 7].map((days) => (
                    <button className="btn-secondary px-3 py-2 text-xs" key={days} onClick={() => setDlcDate(addDaysYmd(days))} type="button">
                      +{days} {days === 1 ? 'jour' : 'jours'}
                    </button>
                  ))}
                </div>
              </div>

              <label className="block text-sm font-medium text-stone-800">
                Lot (optionnel)
                <input className="input mt-2" value={lotNumber} onChange={(e) => setLotNumber(e.target.value)} />
              </label>
              <label className="block text-sm font-medium text-stone-800">
                Emplacement
                <input className="input mt-2" value={location} onChange={(e) => setLocation(e.target.value)} />
              </label>
            </div>

            {message && (
              <p
                className={`rounded-[20px] px-4 py-3 text-sm ${
                  message.tone === 'success'
                    ? 'bg-emerald-50 text-emerald-700'
                    : message.tone === 'error'
                      ? 'bg-red-50 text-red-700'
                      : 'bg-stone-100 text-stone-700'
                }`}
              >
                {message.text}
              </p>
            )}

            <div className="sticky bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-20 rounded-[24px] border border-[rgba(123,106,81,0.14)] bg-[rgba(255,251,245,0.92)] p-3 shadow-[0_24px_40px_-30px_rgba(39,24,11,0.8)] backdrop-blur">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Le lot sera créé dès validation.
                </div>
                <button className="btn-primary w-full md:w-auto" disabled={!canSubmit} type="submit">
                  Enregistrer le lot
                </button>
              </div>
            </div>
          </form>
        </section>
      </div>
    </AuthGuard>
  );
}
