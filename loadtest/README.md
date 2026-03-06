# Coccimarket Load Test (Locust)

## 1) Lancer l'UI Locust

```bash
cd /home/ubuntu/.openclaw/workspace/Coccimarket/loadtest

docker run --rm -p 8089:8089 \
  -e LOADTEST_EMAIL='admin@coccimarket.local' \
  -e LOADTEST_PASSWORD='admin1234' \
  -v "$PWD":/mnt/locust \
  locustio/locust -f /mnt/locust/locustfile.py
```

Ensuite ouvre: http://localhost:8089

- Host: `https://coccimarket-dlc.duckdns.org`
- Démarrage recommandé: `Users=50`, `Spawn rate=5`
- Monte progressivement: 50 -> 100 -> 200

## 2) Mode headless (CLI)

```bash
cd /home/ubuntu/.openclaw/workspace/Coccimarket/loadtest

docker run --rm \
  -e LOADTEST_EMAIL='admin@coccimarket.local' \
  -e LOADTEST_PASSWORD='admin1234' \
  -v "$PWD":/mnt/locust \
  locustio/locust -f /mnt/locust/locustfile.py \
  --headless -u 100 -r 10 -t 5m \
  --host https://coccimarket-dlc.duckdns.org \
  --csv /mnt/locust/results
```

Cela génère `results_*.csv` dans ce dossier.

## 3) Interface Web locale (host + users directement)

Si tu veux choisir le domaine cible et le nombre d'utilisateurs depuis l'UI sur `localhost`:

```bash
cd /home/ubuntu/.openclaw/workspace/Coccimarket/loadtest
chmod +x local-ui.sh

# Mets ici uniquement tes domaines autorisés (séparés par des virgules)
ALLOWED_HOSTS='coccimarket-dlc.duckdns.org,staging.mon-domaine.fr' ./local-ui.sh
```

Puis ouvre `http://localhost:8089` et renseigne:
- Host (dans la whitelist ALLOWED_HOSTS)
- Number of users
- Spawn rate
