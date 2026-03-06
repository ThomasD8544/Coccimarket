# Process réception livraison

1. Ouvrir la page **Réception** depuis l'iPhone (PWA installée).
2. Appuyer sur **Scanner** et viser l'EAN13/QR.
3. Si produit connu, les champs nom/catégorie/fournisseur se remplissent.
4. Saisir rapidement : quantité, DLC (obligatoire), lot (optionnel), emplacement.
5. Valider avec **Enregistrer le lot**.
6. Si le scan échoue, renseigner EAN + nom + catégorie manuellement (création auto du produit catalogue).
7. Les lots apparaissent ensuite dans **Lots** avec statut DLC : OK / A consommer vite / Périmé.

## Contrôle quotidien

1. Ouvrir **Dashboard** pour voir : à traiter aujourd'hui, sous 48h, périmés.
2. Aller dans **Lots** et faire les actions : `Vendu -1` ou `Marquer jeté`.
3. Les alertes email sont envoyées par le worker selon les paramètres admin.
