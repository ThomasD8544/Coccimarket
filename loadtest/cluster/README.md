# Load Test Cluster (k3s / EKS) - Locust distribué

Ce setup est prévu pour **tes domaines autorisés** uniquement, avec garde-fous intégrés.

## Inclus

- Locust distribué (master + workers)
- Whitelist des cibles (`ALLOWED_HOSTS`)
- Limite de charge globale via `MAX_GLOBAL_RPS`
- Auto-stop si erreurs > seuil (`ERROR_RATIO_ABORT_THRESHOLD`)
- Rapport auto (p95, erreurs, saturation)

## Prérequis

- `kubectl` connecté à ton cluster (k3s ou EKS)
- namespace et déploiement depuis ce dossier

## Déployer le cluster load test

```bash
cd /home/ubuntu/.openclaw/workspace/Coccimarket/loadtest/cluster
chmod +x deploy_k3s.sh run_headless_distributed.sh report.py
./deploy_k3s.sh
```

## Ouvrir l'UI Locust

```bash
kubectl -n loadtest port-forward svc/locust-master 8089:8089
```

Puis ouvre `http://localhost:8089`

- Host: `https://coccimarket-dlc.duckdns.org`
- Users: commence à 50
- Spawn rate: 5

## Lancer un test headless sécurisé

```bash
cd /home/ubuntu/.openclaw/workspace/Coccimarket/loadtest/cluster

HOST='https://coccimarket-dlc.duckdns.org' \
ALLOWED_HOSTS='coccimarket-dlc.duckdns.org' \
MAX_GLOBAL_RPS=300 \
PER_USER_RPS=2 \
SPAWN_RATE=20 \
EXPECT_WORKERS=4 \
DURATION=10m \
ERROR_RATIO_ABORT_THRESHOLD=0.05 \
MIN_REQUESTS_BEFORE_ABORT=500 \
./run_headless_distributed.sh
```

Résultats CSV + résumé auto dans `loadtest/cluster/results/`.

## EKS

Même manifests YAML. Il suffit que ton `kubectl` pointe vers EKS.

Exemple:

```bash
aws eks update-kubeconfig --region <region> --name <cluster-name>
./deploy_k3s.sh
```

## Notes sécurité

- Si `--host` n'est pas dans `ALLOWED_HOSTS`, le test s'arrête immédiatement.
- Le test s'arrête automatiquement si le ratio d'erreurs dépasse le seuil.
- Garde toujours des limites progressives (RPS, users) pour éviter de casser la prod.
