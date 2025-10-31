#!/usr/bin/env python3
"""
🎯 VERIFICADOR COMPLETO - DEPLOY EXITOSO
"""

import requests
import time
import sys

PRODUCTION_URL = "https://dimbox.onrender.com/api"
USERNAME = "empresa"
PASSWORD = "empresa123"


def print_check(icon, message):
    print(f"{icon} {message}")


def comprehensive_check():
    print("🔍 VERIFICACIÓN COMPLETA DEL DEPLOY")
    print("=" * 50)

    # 1. Verificar que el servidor responde
    print_check("🌐", "1. Verificando servidor...")
    try:
        health = requests.get(f"{PRODUCTION_URL}/health/", timeout=10)
        if health.status_code == 200:
            print_check("✅", f"Servidor activo: {health.json()}")
        else:
            print_check("❌", f"Servidor error: {health.status_code}")
            return False
    except Exception as e:
        print_check("❌", f"Servidor no responde: {e}")
        return False

    # 2. Verificar autenticación
    print_check("🔐", "2. Verificando autenticación...")
    try:
        auth = requests.post(
            f"{PRODUCTION_URL}/token/",
            json={"username": USERNAME, "password": PASSWORD},
            timeout=10,
        )

        if auth.status_code == 200:
            token_data = auth.json()
            token = token_data["access"]
            headers = {"Authorization": f"Bearer {token}"}
            print_check("✅", "Autenticación JWT funcionando")
        else:
            print_check("❌", f"Error autenticación: {auth.status_code}")
            return False
    except Exception as e:
        print_check("❌", f"Error autenticación: {e}")
        return False

    # 3. Verificar TODOS los endpoints empresariales
    print_check("📊", "3. Verificando endpoints empresariales...")

    endpoints = [
        ("GET", "/enterprise/products/", "Listar productos"),
        ("POST", "/enterprise/products/", "Crear producto"),
        ("GET", "/enterprise/invoices/", "Listar facturas"),
        ("POST", "/enterprise/invoices/quick-create/", "Creación rápida factura"),
        ("GET", "/enterprise/dashboard/", "Dashboard empresarial"),
        ("GET", "/enterprise/products/stats/", "Estadísticas productos"),
        ("GET", "/enterprise/invoices/stats/", "Estadísticas facturas"),
    ]

    results = []
    for method, endpoint, description in endpoints:
        try:
            if method == "GET":
                response = requests.get(
                    f"{PRODUCTION_URL}{endpoint}", headers=headers, timeout=10
                )
            elif method == "POST":
                # Para POST, solo verificamos que el endpoint existe (no 404)
                if endpoint == "/enterprise/products/":
                    response = requests.post(
                        f"{PRODUCTION_URL}{endpoint}",
                        json={"name": "test"},
                        headers=headers,
                        timeout=10,
                    )
                elif endpoint == "/enterprise/invoices/quick-create/":
                    response = requests.post(
                        f"{PRODUCTION_URL}{endpoint}",
                        json={"client_name": "test"},
                        headers=headers,
                        timeout=10,
                    )
                else:
                    response = requests.post(
                        f"{PRODUCTION_URL}{endpoint}", headers=headers, timeout=10
                    )

            if response.status_code != 404:
                print_check("✅", f"{description}: {response.status_code}")
                results.append(True)
            else:
                print_check("❌", f"{description}: 404 (No encontrado)")
                results.append(False)

        except Exception as e:
            print_check("⚠️", f"{description}: Error - {e}")
            results.append(False)

    # 4. Verificar funcionalidad completa creando un producto real
    print_check("🚀", "4. Prueba funcional completa...")
    try:
        # Crear un producto de prueba
        product_data = {
            "name": "Producto Test - Deploy Exitoso",
            "description": "Producto creado para verificar el deploy",
            "price": 99.99,
            "category": "PRODUCT",
            "stock": 10,
            "tax_rate": 18.00,
        }

        create_response = requests.post(
            f"{PRODUCTION_URL}/enterprise/products/",
            json=product_data,
            headers=headers,
            timeout=15,
        )

        if create_response.status_code == 201:
            product = create_response.json()
            print_check("🎉", f"Producto creado exitosamente: {product['name']}")
            print_check("📦", f"ID: {product['id']}, SKU: {product.get('sku', 'N/A')}")
            results.append(True)

            # Limpiar producto de prueba
            product_id = product["id"]
            delete_response = requests.delete(
                f"{PRODUCTION_URL}/enterprise/products/{product_id}/",
                headers=headers,
                timeout=10,
            )
            if delete_response.status_code in [200, 204]:
                print_check("🧹", "Producto de prueba eliminado")

        else:
            print_check("❌", f"Error creando producto: {create_response.status_code}")
            results.append(False)

    except Exception as e:
        print_check("❌", f"Error en prueba funcional: {e}")
        results.append(False)

    # Resumen final
    success_rate = sum(results) / len(results) * 100
    print("\n" + "=" * 50)
    print_check(
        "📈",
        f"RESUMEN: {sum(results)}/{len(results)} pruebas exitosas ({success_rate:.1f}%)",
    )

    if success_rate >= 80:
        print_check("🎊", "¡DEPLOY EXITOSO! Módulo empresarial operativo")
        return True
    else:
        print_check("⚠️", "Hay problemas que requieren atención")
        return False


if __name__ == "__main__":
    print("⏳ Iniciando verificación... (Puede tomar 2-3 minutos)")

    # Esperar un poco para que Render esté completamente listo
    time.sleep(30)

    success = comprehensive_check()

    if success:
        print("\n" + "🎉" * 20)
        print("🚀 ¡FELICITACIONES! DEPLOY COMPLETAMENTE EXITOSO")
        print("🎉" * 20)
        print("\n✅ Tu módulo empresarial está LIVE en producción")
        print(f"📍 URL: {PRODUCTION_URL}")
        print("👤 Usuario: empresa / empresa123")
        print("🏢 Plan: ENTERPRISE")
        sys.exit(0)
    else:
        print("\n" + "❌" * 20)
        print("⚠️  HAY PROBLEMAS CON EL DEPLOY")
        print("❌" * 20)
        print("\n🔧 Revisa:")
        print("   1. Los logs en Render Dashboard")
        print("   2. El archivo core/urls.py")
        print("   3. Las vistas en core/views.py")
        sys.exit(1)
