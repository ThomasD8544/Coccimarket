#!/usr/bin/env python3
import csv
import os
import sys


def parse_float(value, default=0.0):
    try:
        return float(value)
    except Exception:
        return default


def parse_int(value, default=0):
    try:
        return int(float(value))
    except Exception:
        return default


def main(stats_csv: str, failures_csv: str):
    if not os.path.exists(stats_csv):
        print(f"stats file not found: {stats_csv}")
        sys.exit(1)

    total = None
    with open(stats_csv, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row.get("Name") == "Aggregated":
                total = row
                break

    if not total:
        print("No aggregated stats found")
        sys.exit(1)

    requests = parse_int(total.get("Request Count", 0))
    failures = parse_int(total.get("Failure Count", 0))
    p95 = parse_float(total.get("95%", 0.0))
    rps = parse_float(total.get("Requests/s", 0.0))

    error_ratio = (failures / requests) if requests else 0.0

    saturation = "LOW"
    if p95 > 1200 or error_ratio > 0.03:
        saturation = "HIGH"
    elif p95 > 600 or error_ratio > 0.01:
        saturation = "MEDIUM"

    failure_lines = 0
    if os.path.exists(failures_csv):
        with open(failures_csv, newline="", encoding="utf-8") as f:
            failure_lines = max(0, sum(1 for _ in f) - 1)

    print("=== LOAD TEST REPORT ===")
    print(f"requests_total: {requests}")
    print(f"failures_total: {failures}")
    print(f"error_ratio: {error_ratio:.2%}")
    print(f"p95_ms: {p95:.2f}")
    print(f"rps_avg: {rps:.2f}")
    print(f"saturation: {saturation}")
    print(f"failure_types: {failure_lines}")


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: report.py <stats.csv> <failures.csv>")
        sys.exit(1)
    main(sys.argv[1], sys.argv[2])
