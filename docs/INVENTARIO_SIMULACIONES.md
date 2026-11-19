# INVENTARIO Y AUDITORÍA DE SIMULACIONES (OBSERVACIÓN P-09)
**Proyecto**: ALTOKKE Móvil - Transporte Urbano Bagua  
**Líder Técnico Responsable**: Juan Carlos Sandoval Núñez  
**Fecha de Auditoría**: 19 de Noviembre de 2026  
**Objetivo**: Identificar, aislar y erradicar datos quemados (hardcoded), temporizadores artificiales y mocks, reemplazándolos de forma determinista por canales de Supabase Realtime, RPCs transaccionales y consultas vivas en PostgreSQL.

---

## 1. Resumen Ejecutivo de Hallazgos

| ID | Ubicación | Tipo de Simulación | Estado Previo | Estrategia de Reemplazo Realtime / Backend |
|---|---|---|---|---|
| **SIM-01** | `src/features/pasajeros/constants/cuenta.ts` | Objeto `PASAJERO_DEMO` estático | Datos ficticios de pasajero (John Doe / mock) | Perfil real consultado desde `usuarios` y `pasajeros_perfil` con fallback seguro de sesión `auth.users`. |
| **SIM-02** | `src/features/viajes/utils/viaje.ts` | Tarifa de ejemplo fija S/ 4.94 (`TARIFA_BASE = 2.0`, `TARIFA_POR_KM = 2.26`) | Tarifa fija quemada según mockup de 1.3 km | Cálculo dinámico soberano mediante RPC `solicitar_viaje` en PostgreSQL con fórmula Haversine y geocerca de Bagua. |
| **SIM-03** | `src/features/viajes/constants/pasajero.ts` | `CONDUCTORES_CERCANOS` estáticos | 3 coordenadas fijas simuladas de mototaxis | Sustituido por suscripción a geolocalización viva de conductores con `en_linea = true` y estado `disponible` en Bagua. |
| **SIM-04** | `src/features/viajes/hooks/use-conductor-viaje.ts` | Polling con `setInterval(cargar, refrescarCadaMs)` | Bucle temporal ciego que simula actualización | Canal Postgres Changes de Supabase Realtime sobre tabla `viajes` (evento UPDATE) filtrado por `id=eq.${viajeId}`. |
| **SIM-05** | `src/features/conductores/services/conductorService.ts` | Silenciamiento de errores en `catch { return null; }` | Errores silenciosos que ocultan caídas de BD | Manejo de excepciones tipadas con `ConductorServiceError` y propagación de errores reales a la interfaz. |
| **SIM-06** | `src/features/viajes/screens/pasajero/buscando-conductor.tsx` | Timeout de simulación de espera | `setTimeout(() => setSinConductor(true), TIEMPO_MAXIMO_BUSQUEDA)` | Escucha reactiva en canal Realtime de `viajes`: si el estado cambia a `aceptado` o `cancelado`, la UI reacciona instantáneamente. |
| **SIM-07** | `src/features/viajes/store/viajeStore.ts` | Inicialización con `HISTORIAL_EJEMPLO` | Arreglo mock de viajes | Historial vacío inicial (`[]`) y sincronización reactiva bajo demanda desde `viajes` mediante `obtenerHistorialPasajero`. |

---

## 2. Plan de Reemplazo e Implementación Técnica

### 2.1. Canal de Viaje en Vivo (`useViajeEnVivo`)
- **Canal Realtime**: `supabase.channel('viaje_en_vivo_${viajeId}')`
- **Filtro PostgreSQL**: `postgres_changes`, tabla `viajes`, filtro `id=eq.${viajeId}`.
- **Resiliencia de Red**: Throttle de eventos para prevenir renderizados redundantes por oscilaciones GPS, con sincronización de estado `finalizado_en` / `aceptado_en`.

### 2.2. Canal de Solicitudes del Conductor (`useSolicitudesConductor`)
- **Canal Realtime**: `supabase.channel('solicitudes_conductor_en_vivo')`
- **Filtro PostgreSQL**: Inserción y actualización sobre `viajes` en estado `buscando` dentro de la geocerca de Bagua.
- **Aceptación Atómica**: Invocación exclusiva al RPC `aceptar_viaje` que implementa `SELECT ... FOR UPDATE` para prevenir condiciones de carrera entre múltiples mototaxistas.

### 2.3. Canal de Cancelación del Conductor (`useCancelacionConductor`)
- **Detección Instantánea**: Cuando el conductor cancela la solicitud previamente aceptada, el RPC `cancelar_viaje_conductor` reabre el viaje a estado `buscando` y registra `cancelado_por = <conductor_id>` y `motivo_cancelacion`.
- **Notificación Reactiva**: El hook detecta la reapertura del viaje y notifica al pasajero de inmediato sin requerir recarga manual ni reinicio de la aplicación.
