import os

# Ruta al settings.py
settings_path = 'backend/settings.py'

# Leer el contenido actual
with open(settings_path, 'r') as f:
    content = f.read()

print("🔧 Arreglando sintaxis de settings.py...")

# Reemplazar los caracteres de escape incorrectos
content = content.replace('\\n', '\n')

# Escribir el contenido corregido
with open(settings_path, 'w') as f:
    f.write(content)

print("✅ Sintaxis corregida")

# Verificar que el archivo sea válido
try:
    with open(settings_path, 'r') as f:
        lines = f.readlines()
    
    print("📄 Primeras líneas del archivo corregido:")
    for i, line in enumerate(lines[380:390], 381):  # Alrededor de la línea problemática
        print(f"{i:3}: {line.rstrip()}")
        
    print("✅ Archivo settings.py reparado")
    
except Exception as e:
    print(f"❌ Error: {e}")
