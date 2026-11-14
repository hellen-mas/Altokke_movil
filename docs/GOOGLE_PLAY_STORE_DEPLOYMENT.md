# GUÍA DE DESPLIEGUE EN GOOGLE PLAY STORE
### APLICATIVO MÓVIL "ALTOKKE MÓVIL" (BAGUA, AMAZONAS)

**Versión de Producción**: 1.0.0 (versionCode: 1)  
**ID de Paquete**: `pe.altokke.movil`  
**Motor JavaScript**: Hermes AOT (Bytecode precompilado)  
**SDK Objetivo**: Android 15 (API Level 35)  
**Fecha de Preparación**: 14 de Noviembre de 2026  

---

## 1. REQUISITOS OBLIGATORIOS DE GOOGLE PLAY STORE (2025 - 2026)

| Requisito | Estado en Altokke Móvil | Archivo de Configuración |
| :--- | :---: | :--- |
| **Formato AAB (Android App Bundle)** | ✅ CONFIGURADO | `eas.json` (buildType: `app-bundle`) |
| **API Level 35 (Android 15)** | ✅ CUMPLIDO | `Dockerfile.build` y Expo SDK 58 |
| **Arquitecturas 64 bits** | ✅ CUMPLIDO | Hermes AOT (armeabi-v7a, arm64-v8a, x86_64) |
| **Bloqueo de Tráfico HTTP Plano** | ✅ CUMPLIDO | `app.json` (`usesCleartextTraffic: false`) |
| **Bloqueo de Extracción ADB Backup** | ✅ CUMPLIDO | `app.json` (`allowBackup: false`) |
| **Icono Adaptativo (Vector/PNG)** | ✅ CUMPLIDO | `assets/images/android-icon-foreground.png` |
| **Pantalla de Inicio (Splash Screen)** | ✅ CUMPLIDO | `assets/images/mototaxi-splash.png` |
| **Política de Privacidad LPDP** | ✅ DOCUMENTADO | `docs/legal/POLITICA_PRIVACIDAD_LPDP.md` |
| **Libro de Reclamaciones Virtual** | ✅ DOCUMENTADO | `docs/legal/LIBRO_DE_RECLAMACIONES.md` |

---

## 2. PROCEDIMIENTO DE COMPILACIÓN DEL AAB CON EAS BUILD

### Paso 1: Autenticación en Expo
```bash
npx eas login
```

### Paso 2: Configurar Credenciales y Keystore de Producción
EAS gestiona automáticamente el Keystore de producción (Google Play App Signing) o permite cargar uno existente:
```bash
npx eas credentials
```

### Paso 3: Disparar la Compilación de Producción
```bash
npx eas build --platform android --profile production
```
*EAS generará el archivo `altokke-movil-1.0.0.aab` listo para subir a la consola de Google Play.*

---

## 3. CONFIGURACIÓN EN GOOGLE PLAY CONSOLE

1. **Crear Nueva Aplicación**:
   - Nombre: `Altokke: Mototaxis en Bagua`
   - Idioma predeterminado: `Español (Perú) - es-PE`
   - Tipo: `Aplicación` / `Gratis`
2. **Declaración de Privacidad y Seguridad de Datos**:
   - Enlace a la Política de Privacidad: Cargar la URL de [POLITICA_PRIVACIDAD_LPDP.md](file:///c:/Users/USUARIO/Desktop/Proyectos%20Universidad/Altokke_movil/docs/legal/POLITICA_PRIVACIDAD_LPDP.md).
   - Encriptación en tránsito: `Sí` (todas las comunicaciones van sobre TLS 1.3 / HTTPS).
   - Eliminación de cuentas: La app permite al usuario solicitar la supresión de sus datos (Ley 29733).
3. **Declaración de Permisos de Ubicación**:
   - `ACCESS_FINE_LOCATION` y `ACCESS_COARSE_LOCATION`.
   - Propósito: Trazado de ruta de mototaxis, cálculo de tarifa por distancia y enlace de seguridad en tiempo real.
4. **Subida del Paquete AAB a la Pista de Pruebas Internas (Internal Testing Track)**:
   - Crear versión en Pruebas Internas.
   - Arrastrar el archivo `.aab` generado.
   - Invitar a los testers del equipo (`juan.sandoval@altokke.pe`, `elvita.garro@altokke.pe`, `hellen.mas@altokke.pe`).
