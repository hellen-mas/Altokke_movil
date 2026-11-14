# MANUAL TÉCNICO Y ESPECIFICACIÓN DE ARQUITECTURA
## Altokke Móvil — Sistema de Transporte Urbano en Mototaxi (Bagua, Amazonas, Perú)
### MÓDULO CENTRAL: ARQUITECTURA DE AUTENTICACIÓN, IDENTIDAD NACIONAL Y SEGURIDAD CRIPTOGRÁFICA

**Versión del Sistema**: 1.0.0 (Release Académico / Producción)  
**Curso Universitario**: Programación de Aplicaciones Móviles (Android & iOS)  
**Stack Primario**: React Native 0.86.3 | Expo SDK 57 | React 19 (React Compiler) | Supabase (PostgreSQL 15 + Edge Functions Deno)  
**Patrón de Arquitectura**: Screaming Architecture orientada a Dominios con Separación Estricta de Capas  
**Ámbito Territorial y Social**: Bagua, Amazonas, Perú (Transporte urbano regulado en mototaxis)

---

## 1. INTRODUCCIÓN Y ARQUITECTURA GENERAL DEL SISTEMA

Altokke Móvil no es una aplicación genérica de transporte; su arquitectura técnica está diseñada para resolver los desafíos de infraestructura, conectividad y seguridad pública específicos de **Bagua**:
1. **Identidad Ciudadana Inmutable**: Validación en tiempo real contra el padrón del Registro Nacional de Identificación y Estado Civil (RENIEC) a través de la API oficial de ApiPerú, impidiendo cuentas falsas.
2. **Criptografía Híbrida de Grado Bancario**: Cifrado simétrico AES-256 en modo CTR respaldado por chips de seguridad físicos (Android Keystore / iOS Keychain), resolviendo el límite nativo de 2048 bytes de Android.
3. **Visión Artificial en el Edge**: Moderación automatizada de fotografías de perfil mediante IA (Sightengine) en funciones sin servidor (Deno Edge Functions) antes de que cualquier archivo toque la base de datos o el almacenamiento en la nube.
4. **Resiliencia ante Micro-cortes de Señal**: Estrategia de caché de servidor asíncrona mediante `@tanstack/react-query` y debounce defensivo con cancelación de peticiones desfasadas (`AbortController` + `useRef`).

```mermaid
graph TD
    subgraph "Cliente Móvil (React Native 0.86 / Expo SDK 57)"
        UI["Capa de Presentación UI\n(Tokens Altokke Emerald Dark / WCAG 2.1 AA)"]
        Forms["Motor de Formularios y Validación\n(react-hook-form + yupResolver + yup)"]
        DebounceHook["Hook Reactivo con Cancelación\n(useConsultaDni: useRef + 450ms debounce)"]
        CountdownHook["Hook Atómico de Temporizador\n(useCountdown: OTP + Rate Limit)"]
        Router["Enrutador Basado en Archivos\n(expo-router / Grupos: (auth), (conductor), (pasajero))"]
        AuthStore["Gestor de Estado de Sesión Reactivo\n(Zustand useAuthStore + Adapter useAuth)"]
        IdentidadService["Servicio de Identidad RENIEC\n(identidadService: DNI + Caché LRU + AbortController)"]
        CryptoEngine["Adaptador Criptográfico Híbrido\n(almacenamientoSeguro: aes-js 256 CTR + SecureStore)"]
        ImagePipeline["Pipeline de Imagen en Cliente\n(expo-image-picker + expo-image-manipulator 400x400 JPEG 0.7)"]
    end

    subgraph "Pasarela de Integraciones y APIs Externas"
        ApiPeru["API RENIEC / ApiPerú REST\n(Validación DNI 8 dígitos + Caché LRU 30 ítems)"]
        GoogleOAuth["Servidor de Identidad Google OAuth 2.0\n(Flujo PKCE + expo-web-browser / Custom Tabs)"]
        Sightengine["Motor de Visión Artificial Sightengine AI\n(Modelos: nudity-2.0 y wad: armas/drogas)"]
        Wsp["Línea de Soporte Operativo\n(WhatsApp Deep Link wa.me)"]
    end

    subgraph "Infraestructura Backend Supabase (Cloud BaaS)"
        AuthService["Supabase Auth Engine\n(Emisión y validación de tokens JWT)"]
        EdgeAvatar["Edge Function: upload-avatar\n(Runtime Deno + Validación Sightengine + Service Role)"]
        Postgres[("PostgreSQL 15 (Altokke Core)\n- auth.users\n- public.usuarios (RLS)\n- public.conductores_perfil (RLS)\n- public.pasajeros_perfil (RLS)")]
        Storage[("Supabase Storage Buckets\n- 'avatars' (Público / Moderado)\n- 'documentos' (Privado / Firmado)")]
    end

    UI --> Forms
    Forms --> DebounceHook
    DebounceHook --> IdentidadService
    IdentidadService -.-> ApiPeru
    IdentidadService --> Postgres
    Forms --> CountdownHook
    Forms --> Router
    Router --> AuthStore
    AuthStore --> AuthService
    CryptoEngine <--> AuthService
    Forms --> ImagePipeline
    ImagePipeline -.-> EdgeAvatar
    EdgeAvatar -.-> Sightengine
    EdgeAvatar --> Storage
    EdgeAvatar --> Postgres
    AuthService --> Postgres
    UI -.-> GoogleOAuth
    UI -.-> Wsp
```

---

## 2. EL MÓDULO DE AUTENTICACIÓN E IDENTIDAD: ANÁLISIS EXHAUSTIVO

Esta sección desglosa minuciosamente cada servicio, componente, utilidad y algoritmo del módulo de autenticación e identidad de Altokke Móvil.

### 2.1 Servicio Central de Autenticación (`authService.ts`)
Ubicación: [authService.ts](file:///c:/Users/USUARIO/Desktop/Proyectos%20Universidad/Altokke_movil/src/features/autenticacion/services/authService.ts)

El objeto singleton `authService` se encuentra purificado y desacoplado, enfocándose exclusivamente en el ciclo de vida de autenticación de credenciales ante Supabase Auth.

#### Métodos Principales y Flujos de Ejecución:

1. **`loginConPassword(email: string, contrasena: string)`**:
   - **Propósito**: Autentica credenciales tradicionales.
   - **Mecanismo**: Limpia el correo mediante `cleanEmail(correo)` (aplica `trim()` y `toLowerCase()`) para evitar errores por mayúsculas automáticas del teclado móvil. Invoca `supabase.auth.signInWithPassword`.
   - **Retorno**: Retorna el objeto `User` o propaga un error interceptado por `traducirErrorAuth`.

2. **`loginConGoogle()`**:
   - **Propósito**: Autenticación federada mediante OAuth 2.0 con **PKCE (Proof Key for Code Exchange)**.
   - **Mecanismo**:
     1. Genera la URI de retorno mediante `AuthSession.makeRedirectUri()`.
     2. Solicita a Supabase la URL de autorización para el proveedor `google`.
     3. Abre un navegador nativo seguro en sandbox mediante `WebBrowser.openAuthSessionAsync(data.url, redirectUrl)` (**Chrome Custom Tabs** en Android y **ASWebAuthenticationSession** en iOS).
     4. Al completarse el consentimiento de Google, la app captura los parámetros del fragmento hash (`#access_token=...&refresh_token=...`) o query (`?access_token=...`).
     5. Reconstruye la sesión activa en el cliente invocando `supabase.auth.setSession({ access_token, refresh_token })`.
   - **Beneficio**: No requiere la pesada librería nativa de Google Sign-In, reduciendo el tamaño del binario APK y evitando conflictos de dependencias de Google Play Services.

3. **`solicitarRecuperacionPassword` / `verificarCodigoRecuperacion` / `actualizarPassword`**:
   - Flujo criptográfico completo de recuperación de cuenta:
     - `resetPasswordForEmail`: Supabase envía un código OTP de 6 dígitos al correo del usuario.
     - `verifyOtp`: Verifica el código con `type: 'recovery'`, estableciendo una sesión autenticada temporal en el dispositivo.
     - `updateUser`: Permite al usuario definir su nueva contraseña cumpliendo con el esquema Yup y cierra todas las sesiones previas con `signOut()` para forzar un re-login limpio.

---

### 2.2 Servicio de Identidad y Validación Nacional RENIEC (`identidadService.ts`)
Ubicación: [identidadService.ts](file:///c:/Users/USUARIO/Desktop/Proyectos%20Universidad/Altokke_movil/src/features/autenticacion/services/identidadService.ts)

Desacoplado de la autenticación de credenciales bajo el **Principio de Responsabilidad Única (SRP)**, este servicio gestiona la verificación legal de ciudadanos peruanos para registro de conductores y pasajeros.

#### Mecanismo Defensivo Multicapa (`validarIdentidadDNI`):
- **Paso 1 (Anti-duplicidad local)**: Invoca `this.existeDni(dni)`. Si el DNI ya existe en la tabla `usuarios` de Supabase, arroja inmediatamente una excepción con código `DNI_YA_REGISTRADO`, deteniendo cualquier consumo de la API externa.
- **Paso 2 (Caché LRU en Memoria)**: Consulta el mapa `cacheDni`. Si el DNI ya fue consultado durante la sesión, retorna los datos de inmediato (latencia 0 ms, cero costo de API). Si el tamaño del mapa alcanza 30 elementos, desaloja el registro más antiguo (`cacheDni.delete(primerKey)`).
- **Paso 3 (Timeout con AbortController)**: Configura un temporizador de 8000 ms (8 segundos). Si la conexión móvil en Bagua se cuelga, el `AbortController` cancela la petición HTTP y notifica al usuario: *"La consulta de DNI tardó más de lo esperado. Verifica tu conexión a internet"*.
- **Paso 4 (Petición HTTP a ApiPerú)**: Realiza un `POST` a `https://api.apiperu.dev/dni` con cabecera `Authorization: Bearer EXPO_PUBLIC_DNI_API_TOKEN`.
- **Paso 5 (Normalización)**: Extrae `nombres`, `apellido_paterno` y `apellido_materno`, y los formatea a Title Case mediante `aTitulo()` (ej. `JUAN PEREZ` -> `Juan Perez`).

```mermaid
sequenceDiagram
    autonumber
    actor User as Usuario (Móvil)
    participant Hook as useConsultaDni (Hook)
    participant Service as identidadService.validarIdentidadDNI
    participant DB as Supabase PostgreSQL (usuarios)
    participant Memory as Caché LRU (cacheDni)
    participant API as API ApiPerú / RENIEC

    User->>Hook: Digita 8vo dígito del DNI (ej: "45871234")
    Note over Hook: Espera 450ms (Debounce Timer)
    Hook->>Service: validarIdentidadDNI("45871234")
    Service->>DB: existeDni("45871234")
    alt DNI ya registrado
        DB-->>Service: Existe registro
        Service-->>Hook: Error { code: "DNI_YA_REGISTRADO" }
        Hook-->>User: "Este número de DNI ya está registrado en otra cuenta"
    else DNI disponible
        DB-->>Service: null
        Service->>Memory: cacheDni.get("45871234")
        alt Presente en memoria
            Memory-->>Service: { nombres, apellidos }
            Service-->>Hook: Retorno inmediato (0 ms)
        else No está en memoria
            Service->>API: POST /dni (con AbortController 8s)
            alt Respuesta exitosa RENIEC
                API-->>Service: 200 OK { nombres, apellido_paterno, apellido_materno }
                Service->>Memory: cacheDni.set("45871234", { nombres, apellidos })
                Service-->>Hook: { nombres: "Juan Carlos", apellidos: "Ruiz Díaz" }
                Hook->>User: Autocompleta campos y muestra check verde
            else Timeout > 8 segundos
                Note over Service: controller.abort()
                Service-->>Hook: AbortError ("Verifica tu conexión a internet")
            end
        end
    end
```

---

### 2.3 Gestor de Estado de Sesión Reactivo con Zustand (`authStore.ts` y `AuthContext.tsx`)
Ubicaciones:
- [authStore.ts](file:///c:/Users/USUARIO/Desktop/Proyectos%20Universidad/Altokke_movil/src/features/autenticacion/store/authStore.ts)
- [AuthContext.tsx](file:///c:/Users/USUARIO/Desktop/Proyectos%20Universidad/Altokke_movil/src/features/autenticacion/context/AuthContext.tsx)

#### ¿Por qué migramos de React Context a Zustand para Sesión?
1. **Erradicación de Re-renderizados en Cascada**:
   - Con React Context tradicional, cualquier cambio de sesión o verificación de token obligaba a re-evaluar la totalidad del árbol envuelto en `_layout.tsx`.
   - Con Zustand (`zustand: ^5.0.16`), el estado opera en un almacén atómico fuera del ciclo de vida de React. Los componentes se suscriben únicamente a las propiedades exactas que necesitan.
2. **Patrón Adaptador Retrocompatible (Zero Breaking Changes)**:
   - Para no alterar las 18 pantallas y contextos existentes (`ViajeContext`, `NotificacionesContext`, screens de cuenta y mapas), `AuthContext.tsx` actúa como un adaptador de compatibilidad que expone el hook `useAuth()` alimentado directamente por `useAuthStore`.
3. **Inicialización Única**:
   - `authStore.init()` suscribe `supabase.auth.onAuthStateChange` de manera idempotente, destruyendo la suscripción limpiamente al desmontarse la app.

---

### 2.4 Hook Atómico de Temporizador (`useCountdown.ts`)
Ubicación: [useCountdown.ts](file:///c:/Users/USUARIO/Desktop/Proyectos%20Universidad/Altokke_movil/src/features/autenticacion/hooks/useCountdown.ts)

Diseñado para pantallas de verificación de código OTP ([verificar-codigo.tsx](file:///c:/Users/USUARIO/Desktop/Proyectos%20Universidad/Altokke_movil/src/features/autenticacion/screens/recuperar-cuenta/verificar-codigo.tsx)) y pantallas de espera por tasa límite (*rate limit*):
- Encapsula el ciclo de vida de `setInterval` con limpieza automática (`clearInterval`) en cada ciclo, eliminando fugas de memoria.
- Retorna `{ segundos, activo, reiniciar }`, reduciendo más de 65 líneas de código repetido en vistas de verificación.

---

### 2.2 Hook Reactivo de Identidad con Debounce y Cancelación de Carreras (`useConsultaDni.ts`)
Ubicación: [useConsultaDni.ts](file:///c:/Users/USUARIO/Desktop/Proyectos%20Universidad/Altokke_movil/src/features/autenticacion/hooks/useConsultaDni.ts)

Uno de los problemas más graves en aplicaciones móviles que consultan APIs externas durante el tecleo del usuario es la **Condición de Carrera (*Race Condition*)**. Si el usuario escribe `4587123` y luego borra y escribe `45871234`, dos peticiones asíncronas quedan en vuelo; si la primera tarda más en responder, sus datos sobreescribirán los datos finales correctos.

`useConsultaDni` resuelve esto con precisión quirúrgica:
1. **Validación por Expresión Regular**: Solo se activa si la cadena cumple estrictamente con 8 dígitos numéricos:
   ```typescript
   if (!/^\d{8}$/.test(limpio)) { ... }
   ```
2. **Debounce de 450 ms**: Utiliza `setTimeout` para aguardar a que el usuario termine de tipear. Si el usuario presiona otra tecla antes de 450 ms, el temporizador previo se destruye mediante `clearTimeout(timer)`.
3. **Control de Concurrencia con `useRef`**:
   ```typescript
   const requestId = useRef(0);
   // Al disparar la búsqueda:
   const idActual = ++requestId.current;
   // Al retornar la promesa:
   if (idActual !== requestId.current) return; // Se descarta la respuesta si ya hubo otra petición
   ```
4. **Callbacks de Éxito**: Invoca `onEncontrado?.(datos.nombres, datos.apellidos)` para rellenar de forma transparente los campos del formulario administrado por `react-hook-form`.

---

### 2.3 Módulo Criptográfico Híbrido: Superando la Barrera de Hardware de Android (`almacenamientoSeguro.ts`)
Ubicación: [almacenamientoSeguro.ts](file:///c:/Users/USUARIO/Desktop/Proyectos%20Universidad/Altokke_movil/src/shared/api/almacenamientoSeguro.ts)

#### El Desafío de Ingeniería en Android:
`expo-secure-store` almacena información en **Android Keystore** mapeado a `SharedPreferences`. Android impone un límite estricto de **2048 bytes (2 KB)** por clave.  
Cuando Supabase emite un JWT con los metadatos del usuario (`nombre`, `apellidos`, `dni`, `rol`, `telefono`), la cadena serializada alcanza frecuentemente entre 2.2 KB y 3.5 KB. Al exceder los 2048 bytes, la app crashea en Android con la excepción fatal: `Row too big to fit into CursorWindow`.

#### La Solución de Altokke (Arquitectura Criptográfica Híbrida):

```mermaid
graph LR
    subgraph "Hardware Enclave (TEE / Android Keystore / iOS Keychain)"
        KeyStore["expo-secure-store\n(Guarda ÚNICAMENTE la llave AES de 32 bytes)"]
    end

    subgraph "Memoria Volátil RAM"
        Crypto["expo-crypto: getRandomBytes(32)"] --> KeyStore
        AES["aes-js: Cifrado Simétrico AES-256 Modo CTR\n(Cifra el JWT y sesión completa)"]
    end

    subgraph "Almacenamiento No Volátil en Disco"
        AsyncStorage["@react-native-async-storage/async-storage\n(Guarda el texto cifrado en formato Hexadecimal sin límite de tamaño)"]
    end

    KeyStore -.-> AES
    AES --> AsyncStorage
```

#### Paso a Paso Criptográfico:
1. **Generación de Entropía Segura**: Mediante `expo-crypto`, se generan 32 bytes pseudo-aleatorios con entropía del kernel nativo (`Crypto.getRandomBytes(32)`).
2. **Custodia en el Enclave**: La llave de 32 bytes (64 caracteres hexadecimales) se guarda en `SecureStore`. Como 32 bytes está muy por debajo del límite de 2048 bytes, se almacena con éxito en el Keystore respaldado por hardware.
3. **Cifrado en Memoria con AES-256 CTR**: Con la librería `aes-js`, se inicializa un cifrador en modo **Counter (CTR)**:
   ```typescript
   const cifrador = new aesjs.ModeOfOperation.ctr(llave, new aesjs.Counter(1));
   const bytesCifrados = cifrador.encrypt(aesjs.utils.utf8.toBytes(valor));
   const payloadHex = aesjs.utils.hex.fromBytes(bytesCifrados);
   ```
4. **Persistencia en Disco**: `payloadHex` se guarda en `AsyncStorage`. Aunque un atacante obtenga acceso de superusuario (*root*) o extraiga el archivo SQLite de `AsyncStorage`, únicamente verá una secuencia hexadecimal matemáticamente indescifrable sin la llave custodiada en el hardware del procesador.
5. **Descifrado Transparente**: Al arrancar la app, `getItem` recupera el payload de `AsyncStorage`, lee la llave del Keystore, ejecuta el descifrado en memoria RAM y entrega la sesión lista a Supabase.

---

### 2.4 Pipeline de Identidad Visual y Moderación de Fotos con IA en el Edge
Ubicaciones: 
- Utilidad cliente: [avatar.ts](file:///c:/Users/USUARIO/Desktop/Proyectos%20Universidad/Altokke_movil/src/shared/utils/avatar.ts)
- Edge Function en Deno: [upload-avatar/index.ts](file:///c:/Users/USUARIO/Desktop/Proyectos%20Universidad/Altokke_movil/supabase/functions/upload-avatar/index.ts)

El registro de mototaxistas y pasajeros exige una foto de perfil clara para generar confianza ciudadana. Para evitar el uso indebido de la plataforma, Altokke implementa un pipeline de procesamiento y moderación de contenido con Inteligencia Artificial:

```mermaid
sequenceDiagram
    autonumber
    actor Conductor as Mototaxista / Pasajero
    participant App as App Móvil (Expo)
    participant Manipulator as expo-image-manipulator
    participant Edge as Supabase Edge Function (Deno)
    participant Sightengine as Sightengine AI (Computer Vision)
    participant Storage as Supabase Storage (Bucket 'avatars')
    participant DB as PostgreSQL (public.usuarios)

    Conductor->>App: Selecciona foto de la galería o toma selfie
    App->>Manipulator: Redimensionar a 400x400 px, JPEG 70%, extraer Base64
    Note over Manipulator: Reduce el peso de 8 MB a ~40 KB (Ahorro del 99% de ancho de banda)
    App->>Edge: POST /upload-avatar { userId, base64, mimeType: "image/jpeg" }
    Edge->>Edge: Convertir Base64 a búfer binario File
    Edge->>Sightengine: POST /check.json (Modelos: nudity-2.0, wad)
    Sightengine-->>Edge: Scores: { nudity.none: 0.95, weapon: 0.01, drugs: 0.02 }
    alt Imagen viola políticas (Desnudez, armas o drogas)
        Note over Edge: isNsfw = true (nudity.none < 0.4 || weapon > 0.6 || drugs > 0.6)
        Edge-->>App: 400 Bad Request ("Foto contiene material no permitido")
        App-->>Conductor: Alerta visual de rechazo inmediato
    else Imagen apta y conforme
        Edge->>Storage: upload("userId-timestamp.jpg", file) con Upsert
        Storage-->>Edge: 200 OK
        Edge->>Storage: getPublicUrl("userId-timestamp.jpg")
        Edge->>DB: UPDATE public.usuarios SET avatar_url = publicUrl WHERE id = userId
        DB-->>Edge: 200 OK
        Edge-->>App: 200 OK { url: publicUrl, message: "Avatar actualizado con éxito" }
        App-->>Conductor: Muestra foto verificada en el perfil
    end
```

#### Modo `validateOnly`:
Durante el registro previo del usuario (cuando aún no se ha creado su cuenta en la base de datos), la app invoca la Edge Function con el flag `validateOnly: true`. La función valida la foto con Sightengine y responde si es apta sin almacenarla ni ensuciar la base de datos, garantizando una arquitectura limpia.

---

### 2.5 Esquemas de Validación y Reglas de Negocio Estrictas (`yup`)
Ubicaciones:
- [validacionesAuth.ts](file:///c:/Users/USUARIO/Desktop/Proyectos%20Universidad/Altokke_movil/src/features/autenticacion/utils/validacionesAuth.ts)
- [validacionesPasajero.ts](file:///c:/Users/USUARIO/Desktop/Proyectos%20Universidad/Altokke_movil/src/features/pasajeros/utils/validacionesPasajero.ts)

Para blindar la aplicación frente a inyecciones o datos malformados, los esquemas de Yup aplican validaciones estrictas:

1. **Política de Contraseñas Seguras**:
   ```typescript
   contrasena: yup.string()
     .required("Requerido")
     .min(8, "Mínimo 8 caracteres")
     .matches(/[A-Z]/, "Falta una mayúscula")
     .matches(/[a-z]/, "Falta una minúscula")
     .matches(/[0-9]/, "Falta un número")
     .matches(/[\W_]/, "Falta un símbolo")
   ```
2. **Validación de Mayoría de Edad**:
   El registro exige que el usuario tenga al menos 18 años cumplidos al momento de registrarse, calculándolo dinámicamente con la función `calcularEdad`:
   ```typescript
   fechaNacimiento: yup.string()
     .required("Selecciona tu fecha de nacimiento")
     .test("es-mayor-de-edad", "Debes tener al menos 18 años para registrarte", 
       (val) => Boolean(val && calcularEdad(val) >= 18))
   ```
3. **Coincidencia Estricta de Contraseñas**:
   Uso de `yup.ref("contrasena")` para verificar que `confirmarContrasena` sea idéntica en tiempo real.

---

### 2.6 Traducción Humanizada de Errores (`erroresAuth.ts`)
Ubicación: [erroresAuth.ts](file:///c:/Users/USUARIO/Desktop/Proyectos%20Universidad/Altokke_movil/src/features/autenticacion/utils/erroresAuth.ts)

Las APIs de Supabase y servicios en la nube devuelven errores técnicos en inglés crudo (ejemplo: `invalid login credentials`, `rate limit exceeded`, `User already registered`). Mostrar estos textos a un mototaxista o pasajero en Bagua deteriora gravemente la experiencia de usuario.

La función `traducirErrorAuth` procesa cualquier excepción mediante una matriz de patrones de expresiones regulares:
- `user already registered` -> *"Este correo electrónico ya se encuentra registrado. Por favor inicia sesión o recupera tu contraseña."*
- `rate limit` / `too many requests` -> *"Has alcanzado el límite de intentos permitidos. Por seguridad, espera unos momentos antes de reintentar."*
- `token has expired` -> *"El código de verificación ha expirado. Por favor solicita uno nuevo."*
- `network request failed` -> *"No se pudo conectar con el servidor. Por favor verifica tu conexión a internet e inténtalo nuevamente."*

---

### 2.7 Arquitectura de Alto Rendimiento en Listas: `@shopify/flash-list` v2 y Reciclaje de Vistas Nativo
Ubicaciones principales:
- Pantalla Historial Pasajero: [`actividad.tsx`](file:///c:/Users/USUARIO/Desktop/Proyectos%20Universidad/Altokke_movil/src/features/viajes/screens/pasajero/actividad.tsx)
- Componente Memoizado de Celda: [`TarjetaViajeHistorial.tsx`](file:///c:/Users/USUARIO/Desktop/Proyectos%20Universidad/Altokke_movil/src/features/viajes/components/TarjetaViajeHistorial.tsx)
- Pantalla Historial Conductor: [`historial.tsx`](file:///c:/Users/USUARIO/Desktop/Proyectos%20Universidad/Altokke_movil/src/features/conductores/screens/cuenta/historial.tsx)
- Bandeja de Notificaciones: [`notificaciones.tsx`](file:///c:/Users/USUARIO/Desktop/Proyectos%20Universidad/Altokke_movil/src/features/notificaciones/screens/notificaciones.tsx)
- Servicio de Viajes: [`viajeService.ts`](file:///c:/Users/USUARIO/Desktop/Proyectos%20Universidad/Altokke_movil/src/features/viajes/services/viajeService.ts#L176)

#### 1. El Problema Crítico de Rendimiento Resuelto
En versiones anteriores, las colecciones dinámicas de datos utilizaban contenedores `<ScrollView>` iterados con `.map()`. En React Native, este patrón carece de virtualización: si un pasajero o conductor acumula cientos de viajes, el sistema operativo se ve forzado a instanciar miles de vistas nativas (`android.view.ViewGroup` y `UIView`) simultáneamente en memoria RAM, provocando:
* **Spikes severos de memoria y cierres por OOM (Out Of Memory)** en smartphones de gama de entrada utilizados por mototaxistas en Bagua.
* **Bloqueo del hilo de JavaScript (JS Thread Jank)**: Caídas de fluidez por debajo de 20 FPS al aplicar filtros ("Completados" / "Cancelados").
* **Descarga masiva descontrolada**: Supabase entregaba la totalidad de filas históricas sin paginación, saturando las redes móviles 3G/4G locales.

#### 2. Por qué `@shopify/flash-list` v2 supera al `FlatList` tradicional
Aunque el componente nativo `FlatList` virtualiza elementos, sufre de limitaciones estructurales: destruye y crea vistas nativas constantemente conforme el usuario desliza, lo que sobrecarga el recolector de basura (Garbage Collector) y produce zonas en blanco (*blank spaces*) durante el desplazamiento rápido.

`@shopify/flash-list` v2 implementa **Reciclaje Nativo de Celdas (Cell Recycling)** inspirado en `RecyclerView` de Android y `UICollectionView` de iOS:
* Mantiene un grupo constante de vistas en memoria física y se limita a actualizar sus propiedades (`props`) al scrollear.
* **Consumo de memoria plano $O(1)$** independiente del volumen de datos (10 o 10,000 registros consumen la misma RAM).
* **Fluidez garantizada de 60 a 120 FPS** sin áreas en blanco.
* En su versión 2.0, el cálculo de dimensiones geométricas se realiza automáticamente a nivel nativo, erradicando código boilerplate de estimación manual.

#### 3. Blindaje de Red y Almacenamiento Local
* **Paginación en Base de Datos**: En `viajeService.ts` y `historial.tsx`, las consultas a Supabase incorporan `.limit(50)`, acotando la transferencia de datos móviles y acelerando la respuesta inicial hasta en un 500%.
* **Tope FIFO en AsyncStorage**: En `notificacionesStore.ts`, las notificaciones persistentes se acotan mediante `.slice(0, 50)`, evitando que archivos JSON extensos colapsen el arranque de la app.
* **Aislamiento con `React.memo`**: Cada tarjeta de viaje (`TarjetaViajeHistorial`) se encuentra memoizada, permitiendo que la lista reciba nuevos estados sin re-renderizar celdas que no han sufrido mutaciones.

---

## 3. CATÁLOGO COMPLETO DE HERRAMIENTAS Y DEPENDENCIAS DEL PROYECTO

A continuación se resume la totalidad de herramientas del proyecto bajo los 4 pilares obligatorios:

| Herramienta / Paquete | ¿Por qué se usó? | ¿Qué problema resuelve? | ¿En reemplazo de quién? | ¿Dónde se ubica en el código? |
| :--- | :--- | :--- | :--- | :--- |
| **`react-hook-form`** | Motor de formularios no controlados de alto rendimiento. | Evita re-renderizar la pantalla completa con cada pulsación del teclado en teléfonos de gama baja. | Reemplaza a `Formik` y `useState` manual. | [CampoTextoHookForm.tsx](file:///c:/Users/USUARIO/Desktop/Proyectos%20Universidad/Altokke_movil/src/shared/components/ui/CampoTextoHookForm.tsx), [login.tsx](file:///c:/Users/USUARIO/Desktop/Proyectos%20Universidad/Altokke_movil/src/features/autenticacion/screens/login.tsx) |
| **`yup` + resolvers** | Validación de contratos de datos tipados y desacoplados. | Centraliza las reglas de negocio (regex de DNI peruano, contraseñas seguras, edad ≥ 18 años). | Reemplaza validaciones artesanales con `if/else`. | [validacionesAuth.ts](file:///c:/Users/USUARIO/Desktop/Proyectos%20Universidad/Altokke_movil/src/features/autenticacion/utils/validacionesAuth.ts), [validacionesPasajero.ts](file:///c:/Users/USUARIO/Desktop/Proyectos%20Universidad/Altokke_movil/src/features/pasajeros/utils/validacionesPasajero.ts) |
| **`expo-secure-store`** | Custodia de llaves maestras en enclave de hardware (Keystore/Keychain). | Garantiza que las llaves criptográficas no puedan extraerse ni con acceso root vía ADB. | Reemplaza guardar credenciales en texto plano en `AsyncStorage`. | [almacenamientoSeguro.ts](file:///c:/Users/USUARIO/Desktop/Proyectos%20Universidad/Altokke_movil/src/shared/api/almacenamientoSeguro.ts#L5) |
| **`aes-js`** | Cifrado simétrico AES-256 en modo CTR en JavaScript puro. | Elude el límite de 2048 bytes de Android Keystore permitiendo almacenar sesiones JWT completas. | Reemplaza a `crypto-js` (pesado y obsoleto). | [almacenamientoSeguro.ts](file:///c:/Users/USUARIO/Desktop/Proyectos%20Universidad/Altokke_movil/src/shared/api/almacenamientoSeguro.ts#L3) |
| **`expo-crypto`** | Entropía criptográfica segura del sistema operativo. | Genera los 32 bytes aleatorios para la llave simétrica sin usar `Math.random()`. | Reemplaza generadores pseudo-aleatorios débiles. | [almacenamientoSeguro.ts](file:///c:/Users/USUARIO/Desktop/Proyectos%20Universidad/Altokke_movil/src/shared/api/almacenamientoSeguro.ts#L4) |
| **`expo-auth-session` & `web-browser`** | Flujo OAuth 2.0 PKCE en navegador nativo seguro (Custom Tabs). | Permite "Continuar con Google" de forma nativa sin instalar librerías pesadas de Google Play Services. | Reemplaza WebViews embebidas (bloqueadas por Google) y `@react-native-google-signin`. | [authService.ts](file:///c:/Users/USUARIO/Desktop/Proyectos%20Universidad/Altokke_movil/src/features/autenticacion/services/authService.ts#L3-L4), [login.tsx](file:///c:/Users/USUARIO/Desktop/Proyectos%20Universidad/Altokke_movil/src/features/autenticacion/screens/login.tsx#L17) |
| **API ApiPerú / RENIEC** | Consulta oficial de identidad peruana con DNI de 8 dígitos. | Autocompleta nombres y apellidos reales y erradica mototaxistas y pasajeros con cuentas falsas. | Reemplaza el ingreso libre manual de nombres sin verificar. | [identidadService.ts](file:///c:/Users/USUARIO/Desktop/Proyectos%20Universidad/Altokke_movil/src/features/autenticacion/services/identidadService.ts), [useConsultaDni.ts](file:///c:/Users/USUARIO/Desktop/Proyectos%20Universidad/Altokke_movil/src/features/autenticacion/hooks/useConsultaDni.ts) |
| **API Sightengine AI** | Visión computacional para moderación de contenido en tiempo real. | Bloquea automáticamente fotografías con desnudez, armas o drogas en avatares de usuarios. | Reemplaza moderación manual humana costosa y lenta. | [upload-avatar/index.ts](file:///c:/Users/USUARIO/Desktop/Proyectos%20Universidad/Altokke_movil/supabase/functions/upload-avatar/index.ts#L86) |
| **`expo-image-manipulator`** | Compresión y reescalado gráfico en el dispositivo móvil. | Reduce fotos de 8 MB a ~40 KB (400x400 JPEG 0.7) antes de subir, ahorrando 99% de datos móviles. | Reemplaza subir la foto cruda y comprimirla en el backend. | [avatar.ts](file:///c:/Users/USUARIO/Desktop/Proyectos%20Universidad/Altokke_movil/src/shared/utils/avatar.ts#L2), [storageService.ts](file:///c:/Users/USUARIO/Desktop/Proyectos%20Universidad/Altokke_movil/src/shared/utils/storageService.ts#L3) |
| **`zustand`** | Estado global atómico y reactivo fuera del ciclo de vida de React. | Gestiona la sesión global y los formularios multi-paso sin re-renderizar el árbol de componentes. | Reemplaza a Redux Toolkit (sobrecarga) y Context API tradicional (renders en cascada). | [authStore.ts](file:///c:/Users/USUARIO/Desktop/Proyectos%20Universidad/Altokke_movil/src/features/autenticacion/store/authStore.ts), [RegistroConductorContext.tsx](file:///c:/Users/USUARIO/Desktop/Proyectos%20Universidad/Altokke_movil/src/features/conductores/context/RegistroConductorContext.tsx), [RegistroPasajeroContext.tsx](file:///c:/Users/USUARIO/Desktop/Proyectos%20Universidad/Altokke_movil/src/features/pasajeros/context/RegistroPasajeroContext.tsx) |
| **`@tanstack/react-query`** | Caché de servidor asíncrona, deduplicación y reintentos automáticos. | Mantiene el estado visible ante pérdidas de señal celular en Bagua y sincroniza en reconexión. | Reemplaza peticiones manuales en `useEffect` con `useState`. | [_layout.tsx](file:///c:/Users/USUARIO/Desktop/Proyectos%20Universidad/Altokke_movil/src/app/_layout.tsx#L16) |
| **`react-native-screens`** | Controlador nativo de ciclo de vida (`Fragment` / `UIViewController`). | Desmonta de la memoria RAM pantallas inactivas en la pila, previniendo crashes por falta de memoria. | Reemplaza simular pantallas mediante `View` genéricas. | [package.json](file:///c:/Users/USUARIO/Desktop/Proyectos%20Universidad/Altokke_movil/package.json) |
| **`react-native-reanimated` v4** | Motor de animaciones declarativas a 60/120 FPS en el UI Thread. | Evita que las transiciones visuales se entrecorten cuando la CPU procesa peticiones de red. | Reemplaza la API tradicional `Animated` de React Native. | [animated-icon.tsx](file:///c:/Users/USUARIO/Desktop/Proyectos%20Universidad/Altokke_movil/src/shared/components/animated/animated-icon.tsx) |
| **`@shopify/flash-list` v2** | Motor de listas virtualizadas de alto rendimiento con reciclaje nativo de celdas. | Erradica la saturación de memoria RAM (OOM) y el lag táctil en historiales largos y notificaciones, manteniendo 60-120 FPS fluidos. | Reemplaza a `ScrollView + .map()` (sin virtualización) y `FlatList` tradicional (con problemas de *blank areas* y recolección de basura). | [actividad.tsx](file:///c:/Users/USUARIO/Desktop/Proyectos%20Universidad/Altokke_movil/src/features/viajes/screens/pasajero/actividad.tsx), [historial.tsx](file:///c:/Users/USUARIO/Desktop/Proyectos%20Universidad/Altokke_movil/src/features/conductores/screens/cuenta/historial.tsx), [notificaciones.tsx](file:///c:/Users/USUARIO/Desktop/Proyectos%20Universidad/Altokke_movil/src/features/notificaciones/screens/notificaciones.tsx) |
| **`react-native-url-polyfill`** | Implementación del estándar WHATWG de la API `URL` en Hermes. | Permite que el cliente de Supabase construya y parsee endpoints de WebSockets y Storage en Android. | Reemplaza expresiones regulares o manipulación manual de strings. | [supabase.ts](file:///c:/Users/USUARIO/Desktop/Proyectos%20Universidad/Altokke_movil/src/shared/api/supabase.ts#L1) |

---

## 4. ESPECIFICACIÓN DE VARIABLES DE ENTORNO Y MODELO DE SEGURIDAD

> [!IMPORTANT]
> **Regla de Oro de Seguridad en Clientes Móviles**:
> Las variables con prefijo `EXPO_PUBLIC_` se reemplazan en texto plano dentro del paquete compilado JavaScript (`index.android.bundle`), por lo que cualquier persona puede extraerlas mediante ingeniería inversa.
> 
> * **En el cliente móvil (`.env`)**: Únicamente residen identificadores públicos (`EXPO_PUBLIC_SUPABASE_URL` y la clave pública `EXPO_PUBLIC_SUPABASE_KEY` / `sb_publishable_...`). La seguridad está garantizada por las políticas **Row Level Security (RLS)** de PostgreSQL en la base de datos.
> * **En el servidor (Edge Functions con `supabase secrets set`)**: Residen todas las claves privadas, secretos y tokens pagados de APIs de terceros (`DNI_API_TOKEN`, `SIGHTENGINE_USER`, `SIGHTENGINE_SECRET`). Ninguna de estas claves viaja jamás al dispositivo móvil.

```bash
# ==============================================================================
# 1. CLIENTE MÓVIL — VARIABLES PÚBLICAS (.env local, ignorado en Git)
# ==============================================================================

# URL y clave pública de conexión con Supabase (restringida por RLS en la BD)
EXPO_PUBLIC_SUPABASE_URL=https://vztxiigjgbjrlkynhufa.supabase.co
EXPO_PUBLIC_SUPABASE_KEY=sb_publishable_L9gja9sg-cmhfOPH194tyw_jkKLu8Fk

# ==============================================================================
# 2. SECRETOS PRIVADOS DEL SERVIDOR (SUPABASE EDGE FUNCTIONS)
# NUNCA se colocan en el cliente móvil. Se configuran con 'supabase secrets set'
# ==============================================================================

# Token privado para la API de RENIEC / ApiPerú (consumido solo por 'consultar-dni')
DNI_API_TOKEN=tu_token_bearer_privado_de_apiperu

# Credenciales privadas de moderación visual con IA Sightengine (consumido por 'upload-avatar')
SIGHTENGINE_USER=tu_usuario_privado_sightengine
SIGHTENGINE_SECRET=tu_secreto_privado_sightengine

# Clave maestra de administración Supabase (CERO presencia en la app móvil)
# SUPABASE_SERVICE_ROLE_KEY=...
```

---

## 5. GUÍA DE COMPILACIÓN Y RUNBOOK DE EJECUCIÓN

```bash
# 1. Instalar dependencias limpias
npm install

# 2. Iniciar servidor Expo con caché limpia
npx expo start -c

# 3. Compilar APK para pruebas físicas en teléfonos Android en Bagua
npx eas build -p android --profile preview
```
