#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
K8S_DIR="$ROOT_DIR/k8s"

kubectl apply -f "$K8S_DIR/namespace.yaml"

kubectl -n loadtest delete configmap locust-scripts --ignore-not-found
kubectl -n loadtest create configmap locust-scripts --from-file=locustfile.py="$ROOT_DIR/distributed_locustfile.py"

kubectl apply -f "$K8S_DIR/locust-master.yaml"
kubectl apply -f "$K8S_DIR/locust-worker.yaml"

kubectl -n loadtest rollout status deployment/locust-master
kubectl -n loadtest rollout status deployment/locust-worker

echo "✅ Locust cluster déployé dans namespace loadtest"
echo "UI: kubectl -n loadtest port-forward svc/locust-master 8089:8089"
