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
  const [message, setMessage] = useState('');
  const [lastScannedCode, setLastScannedCode] = useState('');
  const canSubmit = useMemo(() => Boolean(ean && name && category && dlcDate), [ean, name, category, dlcDate]);

  const loadProductByEan = useCallback(async (code: string) => {
    const normalizedCode = code.trim();
    setLastScannedCode(normalizedCode);
    setEan(normalizedCode);
    setMessage(`Code détecté: ${normalizedCode}`);

    const res = await fetch(`/api/products?ean=${encodeURIComponent(normalizedCode)}`);
    if (!res.ok) return;

    const data = await res.json();
    const product: Product | null = data.product;
    if (!product) {
      setMessage('Produit inconnu: compléter les champs pour création rapide.');
      return;
    }

    setName(product.name);
    setCategory(product.category);
    setSupplier(product.supplier ?? '');
    setMessage('Produit reconnu automatiquement.');
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage('');

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
      setMessage('Erreur enregistrement lot. Vérifier DLC et quantité.');
      return;
    }

    setMessage('Lot enregistré.');
    setQuantityInitial(1);
    setDlcDate('');
    setLotNumber('');
  }

  return (
    <AuthGuard>
      <div className="space-y-3">
        <section className="card soft-appear">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Réception livraison</h2>
            <button className="btn-secondary" onClick={() => setShowScanner((v) => !v)} type="button">
              {showScanner ? 'Fermer scan' : 'Scanner'}
            </button>
          </div>
          {showScanner && <Scanner onDetected={loadProductByEan} />}
          {lastScannedCode && <p className="mt-2 text-sm text-emerald-700">Dernier scan: {lastScannedCode}</p>}
          <p className="mt-2 text-xs text-stone-600">EAN13 et QR supportés. Saisie manuelle possible ci-dessous.</p>
        </section>

        <form className="card space-y-4 soft-appear" onSubmit={onSubmit}>
          <h3 className="text-lg font-semibold text-stone-800">Saisie rapide lot</h3>
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
            <input
              className="input mt-1"
              value={quantityInitial}
              onChange={(e) => setQuantityInitial(Number(e.target.value))}
              type="number"
              min={1}
              required
            />
          </label>
            <label className="block text-sm">
            DLC
            <input className="input mt-1" value={dlcDate} onChange={(e) => setDlcDate(e.target.value)} type="date" required />
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
          {message && <p className="text-sm text-stone-700">{message}</p>}
        </form>
      </div>
    </AuthGuard>
  );
}
