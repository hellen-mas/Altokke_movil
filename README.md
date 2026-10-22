# 🛺 Altokke

### Tu mototaxi, cuando lo necesites.

**Altokke** es una aplicación móvil orientada al servicio de mototaxi que busca conectar pasajeros y conductores mediante una experiencia sencilla, rápida y organizada.

El proyecto se desarrolla como parte del curso **Programación de Aplicaciones Móviles** de la Universidad Nacional Toribio Rodríguez de Mendoza de Amazonas (UNTRM).

---

## 📱 Sobre el proyecto

Actualmente, la solicitud de un mototaxi suele realizarse mediante señas, llamadas o acuerdos directos. Altokke propone digitalizar este proceso mediante una aplicación móvil que permita gestionar el servicio desde el celular.

La aplicación contempla dos tipos de usuario:

### 👤 Pasajero

- Crear una cuenta e iniciar sesión.
- Seleccionar origen y destino.
- Solicitar un mototaxi.
- Consultar el estado de la solicitud.
- Visualizar información del conductor.
- Seguir el desarrollo del viaje.
- Finalizar y calificar el servicio.
- Consultar el historial de viajes.
- Gestionar su cuenta y preferencias.

### 🛺 Conductor

- Registrarse mediante un proceso de verificación.
- Registrar información personal.
- Verificar información de contacto.
- Registrar identidad y documentación.
- Registrar información de su vehículo.
- Recibir y gestionar solicitudes de viaje.
- Consultar ganancias e historial.
- Gestionar información personal, vehículo y documentos.
- Acceder a opciones de seguridad y configuración.

---

## ✨ Estado actual

> 🚧 **Avance 01 — Versión mínima navegable**

La versión actual permite demostrar los principales flujos de navegación e interacción de Altokke.

Algunas funcionalidades todavía utilizan información local o simulada y serán conectadas posteriormente con servicios persistentes y un backend.

---

## 🧭 Flujo principal

### Pasajero

`Inicio de sesión`
→ `Inicio`
→ `Seleccionar destino`
→ `Confirmar viaje`
→ `Buscar conductor`
→ `Conductor encontrado`
→ `Viaje activo`
→ `Finalizar`
→ `Calificar`

### Conductor

`Registro`
→ `Datos personales`
→ `Verificación`
→ `Identidad`
→ `Documentos`
→ `Vehículo`
→ `Enviar solicitud`

Una vez dentro de la aplicación:

`Inicio`
→ `Solicitudes`
→ `Aceptar viaje`
→ `Viaje activo`
→ `Finalizar`

---

## 🧰 Tecnologías utilizadas

| Tecnología              | Uso                                                |
| ----------------------- | -------------------------------------------------- |
| **React Native**        | Desarrollo de la aplicación móvil                  |
| **Expo**                | Entorno y herramientas de desarrollo               |
| **TypeScript**          | Lenguaje principal del proyecto                    |
| **Expo Router**         | Navegación basada en archivos                      |
| **Context API**         | Manejo de estado compartido en determinados flujos |
| **Expo ImagePicker**    | Acceso a cámara y selección de imágenes            |
| **Expo DocumentPicker** | Selección de documentos                            |

---

## 📂 Estructura general

```text
Altokke_movil/
│
├── src/
│   ├── app/             # Pantallas y navegación
│   ├── components/      # Componentes reutilizables
│   ├── constants/       # Constantes y datos utilizados
│   ├── context/         # Contextos de la aplicación
│   ├── hooks/           # Hooks personalizados
│   └── types/           # Tipos e interfaces
│
├── assets/              # Recursos gráficos
├── app.json             # Configuración de Expo
├── package.json         # Dependencias y scripts
└── README.md
```

---

# 🚀 Ejecutar el proyecto

## Requisitos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js**
- **npm**
- **Git**
- **Expo Go** en un dispositivo móvil, o un emulador Android/iOS compatible.

---

## 1. Clonar el repositorio

```bash
git clone https://github.com/hellen-mas/Altokke_movil.git
```

## 2. Ingresar al proyecto

```bash
cd Altokke_movil
```

## 3. Instalar las dependencias

```bash
npm install
```

## 4. Configurar variables de entorno (Supabase)

Debes poner las credenciales de la base de datos y crea un archivo llamado `.env` en la raíz del proyecto (junto a `package.json`) con el siguiente formato:

```env
EXPO_PUBLIC_SUPABASE_URL=aqui_va_la_url
EXPO_PUBLIC_SUPABASE_KEY=aqui_va_la_key
```

## 4. Iniciar Expo

```bash
npx expo start
```

Después de iniciar el proyecto puedes:

- Escanear el código QR utilizando **Expo Go**.
- Ejecutar la aplicación en un emulador Android.
- Utilizar las demás opciones disponibles en Expo según el entorno configurado.

Si existen problemas relacionados con la caché, puede iniciarse nuevamente con:

```bash
npx expo start -c
```

---

# 👥 Equipo

| Integrante                        | GitHub               | Participación principal                                       |
| --------------------------------- | -------------------- | ------------------------------------------------------------- |
| **Jhunior Aldahir Cercado Acuña** | `@jhunior-cercado`   | Cuenta del pasajero y funcionalidades del conductor           |
| **Elvita Donina Garro Gómez**     | `@doninaa`           | Flujo principal de solicitud y viaje del pasajero             |
| **Hellen Shanela Mas Tuesta**     | `@hellen-mas`        | Registro y cuenta del conductor                               |
| **Juan Carlos Sandoval Núñez**    | `@Juan-Sandoval-Dev` | Autenticación, recuperación de cuenta y registro del pasajero |

> La participación individual también puede identificarse mediante el historial de **commits y contribuciones del repositorio**.

---

## 🔜 Siguiente incremento

Las siguientes etapas del proyecto contemplan:

- Integración con un backend y base de datos.
- Persistencia de usuarios, vehículos y documentos.
- Verificación real de solicitudes de conductores.
- Integración completa entre registro y cuenta.
- Gestión persistente de viajes.
- Mejoras de seguridad y autenticación.
- Notificaciones y actualización del estado del servicio.

---

## 🎓 Información académica

**Universidad Nacional Toribio Rodríguez de Mendoza de Amazonas**  
**Carrera:** Ingeniería de Sistemas  
**Curso:** Programación de Aplicaciones Móviles  
**Proyecto:** Altokke  
**Avance:** 01 — Versión mínima navegable

---

<p align="center">
  <strong>🛺 Altokke</strong><br>
  <em>Tu mototaxi, cuando lo necesites.</em>
</p>

```
Altokke_movil
├─ .claude
│  └─ settings.json
├─ app.json
├─ assets
│  └─ images
│     ├─ escena-mototaxi.png
│     ├─ favicon.png
│     ├─ icon.png
│     ├─ imagen-central-v2.png
│     ├─ logo-altokke-v2.png
│     ├─ logo-glow.png
│     ├─ pin-altokke.png
│     └─ tabIcons
│        ├─ home.png
│        ├─ home@2x.png
│        └─ home@3x.png
├─ env.d.ts
├─ eslint.config.js
├─ LICENSE
├─ package-lock.json
├─ package.json
├─ README.md
├─ src
│  ├─ app
│  │  ├─ (auth)
│  │  │  ├─ bienvenida.tsx
│  │  │  ├─ crear-cuenta.tsx
│  │  │  ├─ estado-solicitud.tsx
│  │  │  ├─ login.tsx
│  │  │  ├─ recuperar-cuenta
│  │  │  │  ├─ index.tsx
│  │  │  │  ├─ nueva-contrasena.tsx
│  │  │  │  └─ verificar-codigo.tsx
│  │  │  ├─ registro-conductor
│  │  │  │  ├─ documentos.tsx
│  │  │  │  ├─ identidad-oficial.tsx
│  │  │  │  ├─ index.tsx
│  │  │  │  ├─ solicitud-enviada.tsx
│  │  │  │  ├─ vehiculo.tsx
│  │  │  │  ├─ verificacion-contacto.tsx
│  │  │  │  └─ _layout.tsx
│  │  │  ├─ registro-pasajero
│  │  │  │  ├─ index.tsx
│  │  │  │  ├─ preferencias.tsx
│  │  │  │  ├─ verificacion.tsx
│  │  │  │  └─ _layout.tsx
│  │  │  └─ _layout.tsx
│  │  ├─ (conductor)
│  │  │  ├─ cuenta
│  │  │  │  ├─ cambiar-contrasena.tsx
│  │  │  │  ├─ centro-ayuda.tsx
│  │  │  │  ├─ configuracion.tsx
│  │  │  │  ├─ documentos.tsx
│  │  │  │  ├─ historial.tsx
│  │  │  │  ├─ index.tsx
│  │  │  │  ├─ informacion-personal.tsx
│  │  │  │  ├─ reportar-indicente.tsx
│  │  │  │  ├─ seguridad.tsx
│  │  │  │  ├─ vehiculo.tsx
│  │  │  │  └─ _layout.tsx
│  │  │  ├─ ganancias.tsx
│  │  │  ├─ inicio.tsx
│  │  │  ├─ solicitudes.tsx
│  │  │  ├─ viaje-activo.tsx
│  │  │  └─ _layout.tsx
│  │  ├─ (pasajero)
│  │  │  ├─ actividad.tsx
│  │  │  ├─ ayuda.tsx
│  │  │  ├─ buscando-conductor.tsx
│  │  │  ├─ calificacion.tsx
│  │  │  ├─ confirmar-viaje.tsx
│  │  │  ├─ cuenta
│  │  │  │  ├─ configuracion.tsx
│  │  │  │  ├─ direcciones.tsx
│  │  │  │  ├─ index.tsx
│  │  │  │  ├─ informacion-personal.tsx
│  │  │  │  ├─ metodos-pago.tsx
│  │  │  │  ├─ notificaciones.tsx
│  │  │  │  └─ seguridad.tsx
│  │  │  ├─ destino.tsx
│  │  │  ├─ mapa.tsx
│  │  │  ├─ notificaciones.tsx
│  │  │  ├─ viaje-activo.tsx
│  │  │  └─ _layout.tsx
│  │  ├─ index.tsx
│  │  └─ _layout.tsx
│  ├─ components
│  │  ├─ animated-icon.module.css
│  │  ├─ animated-icon.tsx
│  │  ├─ animated-icon.web.tsx
│  │  ├─ conductor
│  │  │  ├─ AvisoInformativo.tsx
│  │  │  ├─ CabeceraConductor.tsx
│  │  │  ├─ DatoPersonal.tsx
│  │  │  ├─ DocumentoArchivo.tsx
│  │  │  ├─ DocumentoFoto.tsx
│  │  │  ├─ OpcionCuenta.tsx
│  │  │  ├─ ProgresoRegistro.tsx
│  │  │  └─ TarjetaPerfilConductor.tsx
│  │  ├─ cuenta
│  │  │  ├─ AvatarPerfil.tsx
│  │  │  ├─ EncabezadoPantalla.tsx
│  │  │  └─ ItemMenu.tsx
│  │  ├─ external-link.tsx
│  │  ├─ pasajero
│  │  │  ├─ BarraInferior.tsx
│  │  │  ├─ CabeceraPasajero.tsx
│  │  │  ├─ IconoMototaxi.tsx
│  │  │  ├─ MapaBase.tsx
│  │  │  ├─ MapaBase.web.tsx
│  │  │  ├─ PulsoBusqueda.tsx
│  │  │  ├─ TarjetaConductor.tsx
│  │  │  └─ tiposMapa.ts
│  │  └─ ui
│  │     ├─ AvisoInformativo.tsx
│  │     ├─ BotonPrincipal.tsx
│  │     ├─ BotonRedesSociales.tsx
│  │     ├─ CampoCodigoVerificacion.tsx
│  │     ├─ CampoFechaNacimiento.tsx
│  │     ├─ CampoTexto.tsx
│  │     ├─ CampoTextoHookForm.tsx
│  │     ├─ ContenedorPantalla.tsx
│  │     ├─ EncabezadoLogo.tsx
│  │     ├─ EncabezadoPagina.tsx
│  │     ├─ index.ts
│  │     ├─ IndicadorPasos.tsx
│  │     ├─ MedidorPasswordSeguro.tsx
│  │     ├─ PiePaginaAutenticacion.tsx
│  │     ├─ SelectorFotoPerfil.tsx
│  │     ├─ TarjetaOpcion.tsx
│  │     └─ TarjetaRol.tsx
│  ├─ constants
│  │  ├─ conductor.ts
│  │  ├─ cuenta.ts
│  │  ├─ pasajero.ts
│  │  └─ usuarios.ts
│  ├─ context
│  │  ├─ AuthContext.tsx
│  │  ├─ RegistroConductorContext.tsx
│  │  ├─ RegistroPasajeroContext.tsx
│  │  └─ ViajeContext.tsx
│  ├─ hooks
│  │  ├─ use-color-scheme.ts
│  │  ├─ use-color-scheme.web.ts
│  │  ├─ use-nombre-pasajero.ts
│  │  ├─ use-resumen-viaje.ts
│  │  └─ useAltokkeTheme.ts
│  ├─ lib
│  │  ├─ almacenamientoSeguro.ts
│  │  └─ supabase.ts
│  ├─ paletaColores.ts
│  ├─ services
│  │  ├─ authService.ts
│  │  ├─ avatarStorage.ts
│  │  ├─ conductorOtp.ts
│  │  ├─ conductorService.ts
│  │  ├─ documentosStorage.ts
│  │  ├─ estadoConductor.ts
│  │  ├─ storageService.ts
│  │  └─ usuarioService.ts
│  ├─ types
│  │  ├─ conductor.ts
│  │  └─ database.types.ts
│  └─ utils
│     ├─ apiDNI.ts
│     ├─ avatar.ts
│     ├─ erroresAuth.ts
│     ├─ validaciones.ts
│     ├─ validacionesConductor.ts
│     └─ viaje.ts
├─ supabase
│  ├─ config.toml
│  ├─ functions
│  │  └─ upload-avatar
│  │     ├─ .npmrc
│  │     ├─ deno.json
│  │     └─ index.ts
│  ├─ migrations
│  │  ├─ 20261014180000_agregar_avatar_url_usuarios.sql
│  │  └─ 20261019190000_agregar_dni_fecha_nacimiento.sql
│  └─ schema.sql
└─ tsconfig.json

```