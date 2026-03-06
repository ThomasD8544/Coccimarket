'use client';

import { FormEvent, useCallback, useMemo, useState } from 'react';
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
      <div className="space-y-3">
        <section className="card soft-appear">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Réception livraison</h2>
              <p className="text-xs text-stone-600">Scan iPhone EAN13 / QR puis validation du lot</p>
            </div>
            <button className="btn-secondary" onClick={() => setShowScanner((v) => !v)} type="button">
              {showScanner ? 'Fermer scan' : 'Scanner'}
            </button>
          </div>
          {showScanner && <Scanner onDetected={loadProductByEan} />}
          {lastScannedCode && <p className="mt-2 text-sm text-emerald-700">Dernier scan : {lastScannedCode}</p>}
        </section>

        <form className="card space-y-4 soft-appear" onSubmit={onSubmit}>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-stone-800">Saisie rapide lot</h3>
            <p className="text-xs text-stone-500">Aujourd’hui : {parisTodayYmd()}</p>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="block text-sm">
              EAN
              <input className="input mt-1" value={ean} onChange={(e) => setEan(e.target.value)} required />
            </label>
            <label className="block text-sm">
              Nom produit
              <input className="input mt-1" value={name} onChange={(e) => setName(e.target.value)} required />
            </label>
            <label className="block text-sm">
              Catégorie
              <input className="input mt-1" value={category} onChange={(e) => setCategory(e.target.value)} required />
            </label>
            <label className="block text-sm">
              Fournisseur
              <input className="input mt-1" value={supplier} onChange={(e) => setSupplier(e.target.value)} />
            </label>

            <label className="block text-sm">
              Quantité
              <div className="mt-1 flex items-center gap-2">
                <button className="btn-secondary px-3 py-1" onClick={() => setQuantityInitial((q) => Math.max(1, q - 1))} type="button">
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
                <button className="btn-secondary px-3 py-1" onClick={() => setQuantityInitial((q) => q + 1)} type="button">
                  +
                </button>
              </div>
            </label>

            <label className="block text-sm">
              DLC
              <input className="input mt-1" value={dlcDate} onChange={(e) => setDlcDate(e.target.value)} type="date" required />
              <div className="mt-2 flex flex-wrap gap-2">
                <button className="btn-secondary px-3 py-1 text-xs" onClick={() => setDlcDate(addDaysYmd(1))} type="button">
                  +1 jour
                </button>
                <button className="btn-secondary px-3 py-1 text-xs" onClick={() => setDlcDate(addDaysYmd(2))} type="button">
                  +2 jours
                </button>
                <button className="btn-secondary px-3 py-1 text-xs" onClick={() => setDlcDate(addDaysYmd(3))} type="button">
                  +3 jours
                </button>
                <button className="btn-secondary px-3 py-1 text-xs" onClick={() => setDlcDate(addDaysYmd(7))} type="button">
                  +7 jours
                </button>
              </div>
            </label>

            <label className="block text-sm">
              Lot (optionnel)
              <input className="input mt-1" value={lotNumber} onChange={(e) => setLotNumber(e.target.value)} />
            </label>
            <label className="block text-sm">
              Emplacement
              <input className="input mt-1" value={location} onChange={(e) => setLocation(e.target.value)} />
            </label>
          </div>

          <button className="btn-primary w-full" disabled={!canSubmit} type="submit">
            Enregistrer le lot
          </button>

          {message && (
            <p
              className={`rounded-xl px-3 py-2 text-sm ${
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
        </form>
      </div>
    </AuthGuard>
  );
}
