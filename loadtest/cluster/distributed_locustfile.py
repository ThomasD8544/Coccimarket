import os
import sys
from urllib.parse import urlparse
import gevent
from locust import HttpUser, task, between, events


def _env_float(name: str, default: float) -> float:
    try:
        return float(os.getenv(name, str(default)))
    except Exception:
        return default


def _env_int(name: str, default: int) -> int:
    try:
        return int(os.getenv(name, str(default)))
    except Exception:
        return default


ALLOWED_HOSTS = {
    h.strip().lower()
    for h in os.getenv("ALLOWED_HOSTS", "coccimarket-dlc.duckdns.org").split(",")
    if h.strip()
}
ERROR_RATIO_ABORT_THRESHOLD = _env_float("ERROR_RATIO_ABORT_THRESHOLD", 0.05)
MIN_REQUESTS_BEFORE_ABORT = _env_int("MIN_REQUESTS_BEFORE_ABORT", 500)
PER_USER_RPS = _env_float("PER_USER_RPS", 2.0)


@events.test_start.add_listener
def validate_target(environment, **kwargs):
    host = (environment.host or "").strip()
    if not host:
        print("[SECURITY] --host est obligatoire", file=sys.stderr)
        environment.runner.quit()
        return

    parsed = urlparse(host)
    target_host = (parsed.netloc or parsed.path).lower()
    if ":" in target_host:
        target_host = target_host.split(":", 1)[0]

    if target_host not in ALLOWED_HOSTS:
        print(
            f"[SECURITY] Cible refusée: {target_host}. Autorisés: {sorted(ALLOWED_HOSTS)}",
            file=sys.stderr,
        )
        environment.runner.quit()
        return

    print(f"[SECURITY] Target autorisée: {target_host}")


def _watch_fail_ratio(environment):
    while True:
        gevent.sleep(2)
        total = environment.stats.total.num_requests
        failures = environment.stats.total.num_failures
        if total < MIN_REQUESTS_BEFORE_ABORT:
            continue
        ratio = (failures / total) if total > 0 else 0
        if ratio >= ERROR_RATIO_ABORT_THRESHOLD:
            print(
                f"[SAFETY STOP] Fail ratio={ratio:.2%} >= {ERROR_RATIO_ABORT_THRESHOLD:.2%} (total={total}, failures={failures})",
                file=sys.stderr,
            )
            environment.runner.quit()
            return


@events.test_start.add_listener
def start_safety_watcher(environment, **kwargs):
    gevent.spawn(_watch_fail_ratio, environment)


class WebsiteUser(HttpUser):
    wait_time = between(max(0.01, 1.0 / max(PER_USER_RPS, 0.1)), max(0.02, 2.0 / max(PER_USER_RPS, 0.1)))

    def on_start(self):
        email = os.getenv("LOADTEST_EMAIL")
        password = os.getenv("LOADTEST_PASSWORD")
        if email and password:
            self.client.post(
                "/api/auth/login",
                json={"email": email, "password": password},
                name="POST /api/auth/login",
            )

    @task(6)
    def dashboard_api(self):
        self.client.get("/api/dashboard", name="GET /api/dashboard")

    @task(5)
    def batches_api(self):
        self.client.get("/api/batches?page=1&pageSize=50", name="GET /api/batches")

    @task(2)
    def dashboard_page(self):
        self.client.get("/dashboard", name="GET /dashboard")

    @task(1)
    def root(self):
        self.client.get("/", name="GET /")
