'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/auth-guard';

type Batch = {
  id: string;
  quantityInitial: number;
  quantityRemaining: number;
  dlcDate: string;
  lotNumber: string | null;
  location: string | null;
  state: string;
  status: string;
  createdAt: string;
  product: {
    name: string;
    ean: string;
    category: string;
    supplier: string | null;
  };
};

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

  return (
    <AuthGuard>
      {!batch ? (
        <div className="card">Chargement...</div>
      ) : (
        <div className="card space-y-2 text-sm">
          <h2 className="text-lg font-semibold">{batch.product.name}</h2>
          <p>EAN: {batch.product.ean}</p>
          <p>Catégorie: {batch.product.category}</p>
          <p>Fournisseur: {batch.product.supplier ?? 'N/A'}</p>
          <p>DLC: {batch.dlcDate.slice(0, 10)}</p>
          <p>Statut DLC: {batch.status}</p>
          <p>Quantité initiale: {batch.quantityInitial}</p>
          <p>Quantité restante: {batch.quantityRemaining}</p>
          <p>Lot: {batch.lotNumber ?? 'N/A'}</p>
          <p>Emplacement: {batch.location ?? 'N/A'}</p>
          <p>Entrée stock: {new Date(batch.createdAt).toLocaleString('fr-FR')}</p>

          <button className="btn-secondary" onClick={deleteBatch} type="button">
            Supprimer erreur de saisie (admin)
          </button>
        </div>
      )}
    </AuthGuard>
  );
}
