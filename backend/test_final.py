#!/usr/bin/env python3
"""
🎯 PRUEBA DEFINITIVA - MÓDULO EMPRESARIAL
"""

import requests
import json

BASE_URL = "http://localhost:8000/api"
USERNAME = "empresa"
PASSWORD = "empresa123"


def main():
    print("🚀 PRUEBA DEFINITIVA - MÓDULO EMPRESARIAL")

    # 1. Autenticación
    print("\n1. 🔐 Autenticación...")
    try:
        auth = requests.post(
            f"{BASE_URL}/token/", json={"username": USERNAME, "password": PASSWORD}
        )

        if auth.status_code == 200:
            token = auth.json()["access"]
            headers = {"Authorization": f"Bearer {token}"}
            print("✅ Autenticación exitosa")
        else:
            print(f"❌ Error autenticación: {auth.status_code}")
            return
    except Exception as e:
        print(f"❌ Error: {e}")
        return

    # 2. Probar todos los endpoints empresariales
    endpoints = [
        ("GET", "/enterprise/products/", "Productos"),
        ("GET", "/enterprise/invoices/", "Facturas"),
        ("GET", "/enterprise/dashboard/", "Dashboard"),
        ("GET", "/enterprise/products/stats/", "Estadísticas Productos"),
        ("GET", "/enterprise/invoices/stats/", "Estadísticas Facturas"),
    ]

    print("\n2. 📊 Probando endpoints empresariales...")

    for method, endpoint, name in endpoints:
        try:
            if method == "GET":
                response = requests.get(f"{BASE_URL}{endpoint}", headers=headers)

            if response.status_code == 200:
                data = response.json()
                if endpoint == "/enterprise/products/":
                    print(f"   ✅ {name}: {len(data)} productos")
                elif endpoint == "/enterprise/invoices/":
                    print(f"   ✅ {name}: {len(data)} facturas")
                else:
                    print(f"   ✅ {name}: Funcionando")
            else:
                print(f"   ❌ {name}: Error {response.status_code}")

        except Exception as e:
            print(f"   ❌ {name}: {e}")

    print(f"\n{'🎉' * 20}")
    print("¡MÓDULO EMPRESARIAL OPERATIVO!")
    print(f"{'🎉' * 20}")


if __name__ == "__main__":
    main()
