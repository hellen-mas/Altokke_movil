# Suite Profesional de Pruebas de Carga, Seguridad y Concurrencia (k6) - Altokke Móvil

Esta suite evalúa el rendimiento, la contienda de recursos y el blindaje de seguridad contra la API REST, funciones RPC y Edge Functions de **Altokke**.

---

## 1. Archivos de la Suite

| Archivo | Escenario / Propósito | VUs | Criterios de Aceptación |
| :--- | :--- | :--- | :--- |
| `tests/k6/k6_smoke_y_seguridad.js` | Ciclo de vida completo REST/RPC y 4 pruebas negativas de seguridad RLS/Auth | 1 a 2 | 100% checks de seguridad superados, `p(95) < 800ms` |
| `tests/k6/k6_concurrencia.js` | Condición de carrera en `aceptar_viaje` e idempotencia en `finalizar_viaje` | 15 (defecto) | Exactamente 1 ganador, N-1 rechazos limpios (400/409), 0 fallos 500, `p(95) < 800ms` |
| `tests/k6/k6_load_test.js` | Prueba de carga escalada (ramping VUs) para hora pico en Bagua | 0 a 100 | Rendimiento continuo con `p(95) < 500ms` y `p(99) < 1200ms` |

---

## 2. Variables de Entorno

Puedes definir estas variables en un archivo `.env` o pasarlas directamente por línea de comandos mediante `-e VARIABLE=valor`:

| Variable | Descripción | Valor por Defecto |
| :--- | :--- | :--- |
| `SUPABASE_URL` | URL base del proyecto Supabase (local o cloud) | `http://127.0.0.1:54321` |
| `SUPABASE_ANON_KEY` | Clave anónima pública del proyecto | `test-anon-key` |
| `PASAJERO_JWT` / `TEST_PASAJERO_JWT` | Token JWT de un usuario con rol de pasajero | `Bearer test-pasajero-jwt` |
| `CONDUCTOR_JWT` / `TEST_CONDUCTOR_JWT` | Token JWT de un usuario con rol de conductor aprobado | `Bearer test-conductor-jwt` |
| `CONDUCTORES_POOL` | Lista separada por comas de tokens JWT para múltiples mototaxis en pugna | `Bearer JWT_1,Bearer JWT_2,...` |
| `VIAJE_ID` | UUID del viaje sobre el que se ejecutan las pruebas de contienda | `00000000-0000-0000-0000-000000000001` |
| `VUS` | Cantidad de mototaxistas compitiendo concurrentemente | `15` |

---

## 3. Instrucciones de Ejecución

### Opción A: Con binario nativo de k6

```bash
# 1. Prueba de Humo y Seguridad Negativa (RLS y permisos de RPC)
k6 run tests/k6/k6_smoke_y_seguridad.js \
  -e SUPABASE_URL=http://127.0.0.1:54321 \
  -e SUPABASE_ANON_KEY="tu-anon-key" \
  -e PASAJERO_JWT="tu-jwt-pasajero" \
  -e CONDUCTOR_JWT="tu-jwt-conductor"

# 2. Prueba de Concurrencia y Condición de Carrera (15 VUs)
k6 run tests/k6/k6_concurrencia.js \
  -e SUPABASE_URL=http://127.0.0.1:54321 \
  -e SUPABASE_ANON_KEY="tu-anon-key" \
  -e CONDUCTORES_POOL="Bearer token1,Bearer token2,Bearer token3" \
  -e VIAJE_ID="uuid-del-viaje-activo" \
  -e VUS=15

# 3. Prueba de Carga General
k6 run tests/k6/k6_load_test.js \
  -e SUPABASE_URL=http://127.0.0.1:54321 \
  -e SUPABASE_ANON_KEY="tu-anon-key"
```

### Opción B: Mediante Docker

```bash
docker run --rm -i \
  -v ${PWD}/tests/k6:/scripts \
  --network host \
  grafana/k6 run /scripts/k6_smoke_y_seguridad.js \
  -e SUPABASE_URL=http://127.0.0.1:54321 \
  -e SUPABASE_ANON_KEY="tu-anon-key"
```

---

## 4. Validaciones Específicas de Auditoría

1. **Blindaje de Viajes:**
   - Todo intento de `INSERT` directo en `public.viajes` sin pasar por la RPC soberana `solicitar_viaje` es rechazado con error `42501` / `403 Forbidden`.
2. **Blindaje de Billetera:**
   - La función `procesar_transaccion_billetera` está restringida exclusivamente a `service_role`. Cualquier intento de invocación desde roles `authenticated` o `anon` es denegado con código `401` / `403`.
3. **Pugna Atómica sin Deadlocks:**
   - Bajo la prueba de 15 VUs simultáneas en `aceptar_viaje`, la sentencia `UPDATE ... WHERE estado = 'buscando' AND conductor_id IS NULL` garantiza que solo 1 transacción realiza la asignación; las otras 14 reciben una excepción limpia de `Solicitud no disponible` sin errores `500` ni bloqueos de base de datos.
4. **Idempotencia de Cierre:**
   - La RPC `finalizar_viaje` incluye cláusula `FOR UPDATE` y validación de idempotencia: cierres concurrentes no generan duplicación de comisiones en `public.transacciones`.
