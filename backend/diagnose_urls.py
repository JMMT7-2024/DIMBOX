#!/usr/bin/env python3
"""
🔍 DIAGNÓSTICO - URLs EN PRODUCCIÓN
"""

import requests

PRODUCTION_URL = "https://dimbox.onrender.com/api"


def diagnose_urls():
    print("🔍 DIAGNÓSTICO DE URLs EN PRODUCCIÓN")

    endpoints_to_test = [
        "/health/",
        "/token/",
        "/me/",
        "/enterprise/products/",
        "/enterprise/invoices/",
        "/enterprise/dashboard/",
        "/enterprise/products/stats/",
        "/enterprise/invoices/stats/",
    ]

    for endpoint in endpoints_to_test:
        full_url = f"{PRODUCTION_URL}{endpoint}"
        try:
            if endpoint == "/token/":
                # POST para token
                response = requests.post(full_url, json={}, timeout=10)
            else:
                # GET para los demás
                response = requests.get(full_url, timeout=10)

            print(
                f"{'✅' if response.status_code != 404 else '❌'} {endpoint}: {response.status_code}"
            )

            if response.status_code == 404:
                print(f"   ⚠️  Endpoint no encontrado en producción")

        except Exception as e:
            print(f"❌ {endpoint}: Error - {e}")


if __name__ == "__main__":
    diagnose_urls()
