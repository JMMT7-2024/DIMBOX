import os

# Ruta al settings.py
settings_path = 'backend/settings.py'

# Leer el contenido actual
with open(settings_path, 'r') as f:
    content = f.read()

print("🔧 Agregando configuración Firebase a settings.py...")

# Verificar si ya existe la configuración
if 'FIREBASE_CREDENTIALS_PATH' in content:
    print("✅ FIREBASE_CREDENTIALS_PATH ya está en settings.py")
else:
    # Buscar donde agregar la configuración (después de BASE_DIR)
    lines = content.split('\n')
    new_lines = []
    added = False
    
    for i, line in enumerate(lines):
        new_lines.append(line)
        
        # Agregar después de BASE_DIR
        if 'BASE_DIR =' in line and not added:
            # Verificar las siguientes líneas para no duplicar
            next_lines = lines[i+1:i+10]
            if not any('FIREBASE_CREDENTIALS_PATH' in l for l in next_lines):
                new_lines.append('')
                new_lines.append('# Firebase Configuration')
                new_lines.append('FIREBASE_CREDENTIALS_PATH = os.path.join(BASE_DIR, "prueba-diovic-firebase-adminsdk-87skk-facd0a4699.json")')
                new_lines.append('')
                added = True
                print("✅ Configuración Firebase agregada después de BASE_DIR")
    
    # Escribir el nuevo contenido
    with open(settings_path, 'w') as f:
        f.write('\n'.join(new_lines))
    
    print("✅ FIREBASE_CREDENTIALS_PATH agregado correctamente a settings.py")

# Verificar que el archivo sea válido
try:
    exec(open(settings_path).read())
    print("✅ settings.py tiene sintaxis válida")
except Exception as e:
    print(f"❌ Error de sintaxis en settings.py: {e}")
