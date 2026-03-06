from locust import HttpUser, task, between
import os


class CoccimarketUser(HttpUser):
    wait_time = between(0.4, 1.5)

    def on_start(self):
        email = os.getenv("LOADTEST_EMAIL", "admin@coccimarket.local")
        password = os.getenv("LOADTEST_PASSWORD", "admin1234")

        with self.client.post(
            "/api/auth/login",
            json={"email": email, "password": password},
            name="POST /api/auth/login",
            catch_response=True,
        ) as res:
            if res.status_code != 200:
                res.failure(f"login failed: {res.status_code} {res.text[:120]}")

    @task(5)
    def dashboard_api(self):
        self.client.get("/api/dashboard", name="GET /api/dashboard")

    @task(5)
    def batches_api(self):
        self.client.get("/api/batches?page=1&pageSize=50", name="GET /api/batches")

    @task(2)
    def lots_page(self):
        self.client.get("/lots", name="GET /lots")

    @task(1)
    def dashboard_page(self):
        self.client.get("/dashboard", name="GET /dashboard")
