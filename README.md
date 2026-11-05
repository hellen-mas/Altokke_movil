# ALTOKKE MÓVIL

**Tu mototaxi, cuando lo necesites.**

ALTOKKE MÓVIL es una aplicación desarrollada con React Native, Expo y TypeScript para conectar pasajeros y conductores de mototaxis, organizar solicitudes de transporte y gestionar el servicio desde dispositivos móviles.

Proyecto académico del curso **Programación de Aplicaciones Móviles**, Escuela Profesional de Ingeniería de Sistemas, **Universidad Nacional Toribio Rodríguez de Mendoza de Amazonas (UNTRM)**.

## Funcionalidades

### Pasajero
- Registro de cuenta en tres etapas: credenciales, verificación de identidad y preferencias.
- Inicio de sesión con correo y contraseña; integración con Google OAuth.
- Consulta de DNI y autocompletado de nombres y apellidos.
- Selección y validación de fotografía de perfil.
- Ubicación, selección de origen y destino, solicitud de viaje y seguimiento del servicio.
- Historial de actividad, calificación, perfil y ajustes de cuenta.

### Conductor
- Registro en cinco etapas: datos personales, contacto, identidad, documentos y vehículo.
- Envío de solicitud para revisión y consulta de estado de aprobación.
- Gestión de solicitudes de servicio, viaje activo, ganancias e historial.
- Consulta y actualización de información personal, vehículo y documentación.

### Autenticación y seguridad
- Gestión de usuarios y sesiones mediante Supabase Auth.
- Recuperación de contraseña por correo y código de verificación.
- Acceso condicionado por rol, estado de cuenta y aprobación del conductor.
- Políticas de seguridad a nivel de fila (**RLS**) en PostgreSQL.
- Almacenamiento de avatares y documentos mediante Supabase Storage.
- Edge Functions para consultar DNI, gestionar fotografías y realizar operaciones protegidas de cuenta.
- Eliminación lógica de cuentas con controles de integridad.

> La disponibilidad efectiva de integraciones externas, Google OAuth y operaciones administrativas depende de la configuración del entorno Supabase y de las pruebas efectuadas.

## Tecnologías y arquitectura

| Tecnología | Uso |
| --- | --- |
| React Native 0.88.1, React 19.3 y Expo SDK 58 | Aplicación móvil |
| TypeScript | Tipado de módulos y modelos |
| Expo Router | Navegación y rutas |
| Zustand | Estado local y compartido |
| TanStack Query v5 | Consultas remotas, caché y sincronización |
| React Hook Form + Yup | Formularios y reglas de validación |
| NetInfo | Detección de conectividad |
| Supabase Auth + PostgreSQL + RLS | Identidad, datos y control de acceso |
| Supabase Storage + Edge Functions | Archivos e integración segura con servicios externos |
| Expo Location + React Native Maps | Geolocalización y mapas |
| Expo ImagePicker, ImageManipulator y DocumentPicker | Selección y procesamiento de archivos |
| Shopify FlashList | Listados de historial, solicitudes y notificaciones |

El proyecto utiliza **Screaming Architecture**, organizando el código por funcionalidades del negocio. Las rutas se separan de las pantallas y la lógica de acceso a datos se concentra en hooks y servicios.

```text
Altokke_movil/
├── assets/                     # Imágenes y recursos visuales
├── src/
│   ├── app/                    # Rutas y layouts de Expo Router
│   ├── features/
│   │   ├── autenticacion/      # Registro, login, recuperación y sesiones
│   │   ├── pasajeros/          # Registro y servicios del pasajero
│   │   ├── conductores/        # Registro y servicios del conductor
│   │   └── ...                 # Otros dominios funcionales
│   └── shared/                 # UI, servicios compartidos, tipos y utilidades
├── supabase/
│   ├── functions/              # Funciones de servidor (Deno)
│   ├── migrations/             # Cambios versionados del esquema
│   └── config.toml
├── app.json
├── app.config.js
├── package.json
└── README.md
```
## Instalación y ejecución

### Requisitos
- Node.js y npm compatibles con el proyecto.
- Git.
- Dispositivo o emulador compatible con la versión de Expo utilizada.
- Acceso a un proyecto Supabase configurado con el esquema, políticas, Storage y Edge Functions necesarios.

### 1. Clonar el repositorio

```bash
git clone https://github.com/hellen-mas/Altokke_movil.git
cd Altokke_movil
```

La rama **main** contiene la versión principal una vez fusionados los cambios aprobados. Durante el trabajo colaborativo, **develop** se utiliza para integración.

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar el entorno

Crear un archivo `.env` en la raíz del proyecto con la **URL y la clave pública** del proyecto Supabase:

```dotenv
EXPO_PUBLIC_SUPABASE_URL=TU_URL_PUBLICA
EXPO_PUBLIC_SUPABASE_KEY=TU_CLAVE_PUBLICA
# Alternativa admitida por el cliente:
# EXPO_PUBLIC_SUPABASE_ANON_KEY=TU_CLAVE_PUBLICA
```

Para los mapas nativos de Android, configurar si corresponde:

```dotenv
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=TU_CLAVE_DE_MAPAS_RESTRINGIDA
```

**Importante:** toda variable `EXPO_PUBLIC_*` se incorpora al cliente y **no es secreta**. Restringir la clave de Google Maps por aplicación y API en Google Cloud. No colocar tokens de ApiPeru, Sightengine ni `SUPABASE_SERVICE_ROLE_KEY` en `.env` del cliente. Esos secretos pertenecen al entorno seguro de las Edge Functions. No subir archivos `.env` con credenciales reales al repositorio.

El funcionamiento de autenticación social, recuperación de cuenta y servicios externos también requiere la configuración correspondiente en Supabase.

### 4. Ejecutar

```bash
npm run start
```

Para reiniciar la caché de Metro:

```bash
npx expo start -c
```

Scripts adicionales:

| Comando | Función |
| --- | --- |
| `npm run android` | Abre el flujo de Expo para Android |
| `npm run ios` | Abre el flujo de Expo para iOS, si el entorno lo permite |
| `npm run web` | Ejecuta el proyecto en entorno web |
| `npm run lint` | Ejecuta ESLint |
| `npx tsc --noEmit` | Comprueba tipos TypeScript |

## Trabajo colaborativo

El equipo utiliza ramas de funcionalidades, revisión por Pull Requests y una rama `develop` para integrar avances. Los cambios aprobados se incorporan después a `main` como versión principal del proyecto.

### Equipo

- **Jhunior Aldahir Cercado Acuña**
- **Elvita Donina Garro Gómez**
- **Hellen Shanela Mas Tuesta**
- **Juan Carlos Sandoval Núñez**

Las contribuciones pueden consultarse en el historial de commits y Pull Requests del repositorio.

## Información académica

- **Universidad:** Universidad Nacional Toribio Rodríguez de Mendoza de Amazonas.
- **Carrera:** Ingeniería de Sistemas.
- **Curso:** Programación de Aplicaciones Móviles.
- **Proyecto:** ALTOKKE MÓVIL.
- **Año:** 2026.

---

**ALTOKKE MÓVIL — Tu mototaxi, cuando lo necesites.**
