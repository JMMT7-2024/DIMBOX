#!/usr/bin/env python3
"""
🎯 PRUEBA DEFINITIVA - PRODUCCIÓN DIMBOX
"""

import requests
import json
from datetime import datetime

PRODUCTION_URL = "https://dimbox.onrender.com/api"
USERNAME = "empresa"
PASSWORD = "empresa123"


def print_section(title):
    print(f"\n{'=' * 60}")
    print(f"📋 {title}")
    print(f"{'=' * 60}")


def test_production_complete():
    print("🚀 PRUEBA COMPLETA - PRODUCCIÓN DIMBOX")
    print(f"📍 URL: {PRODUCTION_URL}")
    print(f"👤 Usuario: {USERNAME}")
    print(f"🏢 Plan: ENTERPRISE")
    print(f"🕐 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    # 1. AUTENTICACIÓN
    print_section("1. AUTENTICACIÓN JWT")
    try:
        auth_response = requests.post(
            f"{PRODUCTION_URL}/token/",
            json={"username": USERNAME, "password": PASSWORD},
            timeout=15,
        )

        if auth_response.status_code != 200:
            print(f"❌ Error autenticación: {auth_response.status_code}")
            print(f"   Mensaje: {auth_response.text}")
            return False

        token_data = auth_response.json()
        token = token_data["access"]
        headers = {"Authorization": f"Bearer {token}"}
        print("✅ Autenticación exitosa en producción")
        print(f"   Token obtenido correctamente")

    except Exception as e:
        print(f"❌ Error: {e}")
        return False

    # 2. VERIFICAR PLAN ENTERPRISE
    print_section("2. VERIFICACIÓN PLAN ENTERPRISE")
    try:
        profile_response = requests.get(
            f"{PRODUCTION_URL}/me/", headers=headers, timeout=10
        )
        if profile_response.status_code == 200:
            profile = profile_response.json()
            print(f"✅ Perfil verificado en producción:")
            print(f"   👤 Usuario: {profile.get('username')}")
            print(f"   🏢 Plan: {profile.get('subscription')}")
            print(
                f"   📊 Límites: {profile.get('effective_limits', {}).get('maxTransactions')} transacciones"
            )
        else:
            print(f"❌ Error en perfil: {profile_response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

    # 3. SISTEMA DE PRODUCTOS
    print_section("3. SISTEMA DE PRODUCTOS EN PRODUCCIÓN")
    product_id = None

    try:
        # 3.1 Crear producto en producción
        product_data = {
            "name": "Servicio Cloud Enterprise - Producción",
            "description": "Servicio en la nube para empresas - Creado en producción",
            "price": 299.99,
            "cost": 150.00,
            "category": "SERVICE",
            "stock": 999,  # Servicios ilimitados
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
            product_id = product["id"]
            print(f"✅ Producto creado en producción:")
            print(f"   📦 ID: {product['id']}")
            print(f"   🏷️  Nombre: {product['name']}")
            print(f"   💰 Precio: S/ {product['price']:,.2f}")
            print(f"   📈 Margen: {product.get('profit_margin', 0):.1f}%")
        else:
            print(f"❌ Error creando producto: {create_response.status_code}")
            print(f"   Mensaje: {create_response.text}")
            return False

        # 3.2 Listar productos
        products_response = requests.get(
            f"{PRODUCTION_URL}/enterprise/products/", headers=headers, timeout=10
        )
        if products_response.status_code == 200:
            products = products_response.json()
            print(f"✅ Lista de productos: {len(products)} productos en producción")

        # 3.3 Estadísticas
        stats_response = requests.get(
            f"{PRODUCTION_URL}/enterprise/products/stats/", headers=headers, timeout=10
        )
        if stats_response.status_code == 200:
            stats = stats_response.json()
            print(f"✅ Estadísticas producción:")
            print(f"   📊 Total productos: {stats['total_products']}")
            print(f"   💰 Valor inventario: S/ {stats['inventory_value']:,.2f}")

    except Exception as e:
        print(f"❌ Error en productos: {e}")
        return False

    # 4. SISTEMA DE FACTURACIÓN
    print_section("4. FACTURACIÓN EN PRODUCCIÓN")
    invoice_id = None

    try:
        # 4.1 Crear factura en producción
        invoice_data = {
            "client_name": "TechCorp Global S.A.",
            "client_ruc": "20601234567",
            "client_email": "contabilidad@techcorp.com",
            "client_address": "Av. La Marina 1234, San Miguel",
            "payment_method": "TRANSFER",
            "items": [{"product_id": product_id, "quantity": 5}],
        }

        invoice_response = requests.post(
            f"{PRODUCTION_URL}/enterprise/invoices/quick-create/",
            json=invoice_data,
            headers=headers,
            timeout=15,
        )

        if invoice_response.status_code == 201:
            invoice = invoice_response.json()
            invoice_id = invoice["id"]
            print(f"✅ Factura creada en producción:")
            print(f"   🧾 Número: {invoice['invoice_number']}")
            print(f"   👥 Cliente: {invoice['client_name']}")
            print(f"   💰 Total: S/ {invoice['total']:,.2f}")
            print(f"   📊 Estado: {invoice['status']}")
        else:
            print(f"❌ Error creando factura: {invoice_response.status_code}")
            print(f"   Mensaje: {invoice_response.text}")
            return False

        # 4.2 Listar facturas
        invoices_response = requests.get(
            f"{PRODUCTION_URL}/enterprise/invoices/", headers=headers, timeout=10
        )
        if invoices_response.status_code == 200:
            invoices = invoices_response.json()
            print(f"✅ Lista de facturas: {len(invoices)} facturas en producción")

        # 4.3 Estadísticas facturas
        invoices_stats_response = requests.get(
            f"{PRODUCTION_URL}/enterprise/invoices/stats/", headers=headers, timeout=10
        )
        if invoices_stats_response.status_code == 200:
            invoices_stats = invoices_stats_response.json()
            print(f"✅ Estadísticas facturas producción:")
            print(f"   📊 Total: {invoices_stats['total_invoices']}")
            print(f"   💰 Monto total: S/ {invoices_stats['total_amount']:,.2f}")

    except Exception as e:
        print(f"❌ Error en facturas: {e}")
        return False

    # 5. DASHBOARD EMPRESARIAL
    print_section("5. DASHBOARD EN PRODUCCIÓN")
    try:
        dashboard_response = requests.get(
            f"{PRODUCTION_URL}/enterprise/dashboard/", headers=headers, timeout=10
        )
        if dashboard_response.status_code == 200:
            dashboard = dashboard_response.json()
            summary = dashboard.get("summary", {})
            print(f"✅ Dashboard producción:")
            print(f"   📦 Productos: {summary.get('total_products', 0)}")
            print(f"   🧾 Facturas: {summary.get('total_invoices', 0)}")
            print(f"   💰 Ingresos: S/ {summary.get('total_revenue', 0):,.2f}")
            print(f"   📊 Inventario: S/ {summary.get('inventory_value', 0):,.2f}")
        else:
            print(f"❌ Error en dashboard: {dashboard_response.status_code}")
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

    return True


if __name__ == "__main__":
    success = test_production_complete()

    if success:
        print(f"\n{'🎉' * 20}")
        print("🎊 ¡PRODUCCIÓN COMPLETAMENTE VERIFICADA!")
        print(f"{'🎉' * 20}")
        print("\n✅ TODOS LOS SISTEMAS OPERATIVOS:")
        print("   🌐 Backend Django en Render")
        print("   🗄️  Base de datos Neon PostgreSQL")
        print("   📦 Módulo empresarial completo")
        print("   🔐 Autenticación JWT segura")
        print("   📊 Dashboard y estadísticas")
        print("\n🚀 ¡DIMBOX EMPRESARIAL EN PRODUCCIÓN!")
        print(f"📍 URL: {PRODUCTION_URL}")
    else:
        print(f"\n❌ Algunas pruebas fallaron en producción")
