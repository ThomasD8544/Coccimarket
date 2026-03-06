# Coccimarket DLC

Application web mobile-first pour gérer les DLC d'un banc traiteur avec scan caméra iPhone, suivi de lots, alertes email et push PWA.

## Stack

- Front + API: Next.js 14 (App Router, TypeScript, Tailwind)
- DB: PostgreSQL + Prisma
- Auth: JWT cookie HTTP-only + bcrypt
- Scan: `@zxing/browser` (EAN13 / QR)
- Notifications:
  - Email SMTP (ou mode console en dev)
  - Push Web Push (optionnel) via Service Worker + VAPID
- Job planifié: worker Node (`node-cron`) + script one-shot

## Fonctionnalités

- Auth + rôles: ADMIN / EMPLOYEE
- Réception livraison avec scan et création rapide de produit inconnu
- Gestion lots: décrément `vendu`, marquer `jeté`, suppression admin
- Dashboard: à traiter aujourd'hui / sous 48h / périmés
- Paramètres admin: seuil d'alerte, heure job, fuseau
- Notifications quotidiennes J-X, J0, et J+1 (périmé)
- PWA installable (manifest + service worker)

## Variables d'environnement

Copier `.env.example` en `.env` puis adapter:

- `DATABASE_URL`
- `JWT_SECRET`
- `TZ=Europe/Paris`
- `ALERT_DAYS_BEFORE=2`
- `EMAIL_MODE=console` (dev) ou `smtp`
- SMTP: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`
- Option TLS SMTP: `SMTP_SECURE=true` (souvent `true` pour port 465, sinon `false`)
- Push: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`
- Front push: `NEXT_PUBLIC_VAPID_PUBLIC_KEY`

## Démarrage local

```bash
npm install
cp .env.example .env
npm run prisma:generate
npm run prisma:migrate:dev
npm run seed
npm run dev
```

Comptes seed:

- Admin: `admin@coccimarket.local` / `admin1234`
- Employé: `employee@coccimarket.local` / `employee1234`

## Docker

```bash
cp .env.example .env
# renseigner JWT_SECRET
docker compose up --build
```

Services:

- `app`: API + front (port 3000)
- `db`: PostgreSQL (port 5432)
- `worker`: cron notifications

## Job notifications

Run one-shot:

```bash
npm run notify:once
```

Run cron permanent:

```bash
npm run notify:cron
```

## Endpoints API principaux

- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/register` (admin)
- `GET/POST /api/products`
- `GET/POST /api/batches`
- `GET /api/batches/:id`
- `POST /api/batches/:id/sell`
- `POST /api/batches/:id/discard`
- `DELETE /api/batches/:id/delete` (admin)
- `GET /api/dashboard`
- `GET/PATCH /api/settings` (PATCH admin)
- `POST /api/notifications/subscribe`
- `POST /api/notifications/test` (admin)
- `POST /api/notifications/test-email` (admin)

## Tests

```bash
npm run test
```

Couvre:

- logique statut DLC
- logique de classification des notifications

## Process réception

Voir [docs/process-reception-livraison.md](docs/process-reception-livraison.md).
