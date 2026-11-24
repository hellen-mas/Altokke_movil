/**
 * SUITE DETERMINISTA DE PRUEBAS UNITARIAS: LÓGICA DE NEGOCIO Y SEGURIDAD ALTOKKE
 * Ejecución: node --test tests/unit/logica_negocio.test.js
 * Cero dependencias externas (usa node:test y node:assert oficiales)
 * Importa directamente las funciones reales de producción desde src/
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
  validarYCalcularVuelto,
  validarContraoferta,
  procesarMensajeRapido,
  esTransicionValida,
  calcularTarifa,
  distanciaKm,
  TARIFA_MINIMA_BAGUA,
  TARIFA_MAXIMA_BAGUA,
  ESTADOS_VALIDOS_VIAJE,
} from "../../src/features/viajes/utils/viaje.ts";

import {
  calcularEdad,
  sanitizarDNI,
  sanitizarTelefono,
  esDNIValido,
  esTelefonoValido,
} from "../../src/shared/utils/validaciones.ts";

// ============================================================================
// 1. MÓDULO DE VUELTO INTELIGENTE Y MANEJO DE EFECTIVO (BAGUA)
// ============================================================================
describe("Lógica de Vuelto Inteligente en Efectivo (Producción)", () => {
  test("Calcula vuelto exacto para billete de S/ 20 con tarifa de S/ 3.50", () => {
    const resultado = validarYCalcularVuelto(20, 3.5);
    assert.equal(resultado.vuelto, 16.5);
    assert.equal(resultado.esExacto, false);
    assert.equal(resultado.denominacionValida, true);
  });

  test("Identifica pago exacto cuando paga_con es igual a la tarifa", () => {
    const resultado = validarYCalcularVuelto(5.0, 5.0);
    assert.equal(resultado.vuelto, 0);
    assert.equal(resultado.esExacto, true);
    assert.equal(resultado.denominacionValida, true);
  });

  test("Calcula vuelto con billete de S/ 50 y tarifa de S/ 4.00", () => {
    const resultado = validarYCalcularVuelto(50, 4.0);
    assert.equal(resultado.vuelto, 46.0);
    assert.equal(resultado.esExacto, false);
    assert.equal(resultado.denominacionValida, true);
  });

  test("Rechaza pago cuando el dinero entregado es inferior a la tarifa", () => {
    assert.throws(
      () => validarYCalcularVuelto(3.0, 4.5),
      /El monto de pago no puede ser menor a la tarifa/
    );
  });

  test("Rechaza montos negativos o valores NaN", () => {
    assert.throws(() => validarYCalcularVuelto(-10, 3.0));
    assert.throws(() => validarYCalcularVuelto(NaN, 3.0));
    assert.throws(() => validarYCalcularVuelto("veinte", 3.0));
    assert.throws(() => validarYCalcularVuelto(20, 0));
    assert.throws(() => validarYCalcularVuelto(20, -5));
  });
});

// ============================================================================
// 2. MÓDULO DE CONTRAOFERTAS (MODELO INDRIVE REGULADO PARA BAGUA)
// ============================================================================
describe("Lógica de Contraofertas y Control Tarifario (Producción)", () => {
  test("Acepta contraoferta razonable dentro del rango permitido (S/ 4.00 sobre base S/ 3.00)", () => {
    const res = validarContraoferta(4.0, 3.0);
    assert.equal(res.valido, true);
    assert.equal(res.montoFinal, 4.0);
  });

  test("Rechaza contraoferta abusiva que supera el 200% (S/ 7.00 sobre base S/ 3.00)", () => {
    const res = validarContraoferta(7.0, 3.0);
    assert.equal(res.valido, false);
    assert.match(res.razon, /200%/);
  });

  test("Rechaza contraoferta que reduce más del 50% (S/ 1.00 sobre base S/ 3.00)", () => {
    const res = validarContraoferta(1.0, 3.0);
    assert.equal(res.valido, false);
  });

  test("Rechaza contraofertas por encima del techo absoluto de Bagua (S/ 25.00)", () => {
    const res = validarContraoferta(25.0, 10.0);
    assert.equal(res.valido, false);
    assert.match(res.razon, /techo máximo permitido/);
  });

  test("Rechaza contraofertas por debajo del piso absoluto de Bagua", () => {
    const res = validarContraoferta(1.0, 1.5);
    assert.equal(res.valido, false);
    assert.match(res.razon, /piso de Bagua/);
  });

  test("Rechaza entradas no numéricas o NaN", () => {
    const resNaN = validarContraoferta(NaN, 5.0);
    assert.equal(resNaN.valido, false);
    const resString = validarContraoferta("cinco", 5.0);
    assert.equal(resString.valido, false);
  });
});

// ============================================================================
// 3. MÓDULO DE COMUNICACIÓN EFÍMERA Y PROTECCIÓN DE PRIVACIDAD
// ============================================================================
describe("Privacidad y Sanitización de Chat In-App (Producción)", () => {
  test("Permite respuestas rápidas comunes y seguras", () => {
    const res = procesarMensajeRapido("Ya estoy en el punto de encuentro, en la moto azul.");
    assert.equal(res.permitido, true);
    assert.equal(res.texto, "Ya estoy en el punto de encuentro, en la moto azul.");
  });

  test("Detecta y bloquea números telefónicos peruanos para resguardo de privacidad", () => {
    const res = procesarMensajeRapido("Escríbeme a mi número personal 945892104 para acordar.");
    assert.equal(res.permitido, false);
    assert.match(res.razon, /Violación de privacidad/);
  });

  test("Detecta y bloquea números telefónicos peruanos con guiones o espacios", () => {
    const resConGuion = procesarMensajeRapido("Llámame al 945-892-104 urgente.");
    assert.equal(resConGuion.permitido, false);
    assert.match(resConGuion.razon, /Violación de privacidad/);

    const resConEspacio = procesarMensajeRapido("Mi número es 945 892 104.");
    assert.equal(resConEspacio.permitido, false);
    assert.match(resConEspacio.razon, /Violación de privacidad/);
  });

  test("Sanitiza etiquetas HTML o scripts maliciosos (XSS)", () => {
    const res = procesarMensajeRapido("<script>alert('xss')</script>Llegué afuera.");
    assert.equal(res.permitido, true);
    assert.equal(res.texto, "alert('xss')Llegué afuera.");
  });

  test("Rechaza mensajes vacíos o que exceden la longitud máxima de 120 caracteres", () => {
    const resVacio = procesarMensajeRapido("   ");
    assert.equal(resVacio.permitido, false);

    const resLargo = procesarMensajeRapido("a".repeat(121));
    assert.equal(resLargo.permitido, false);
    assert.match(resLargo.razon, /Longitud no autorizada/);
  });
});

// ============================================================================
// 4. MÁQUINA DE ESTADOS DE VIAJE Y TRANSICIONES PERMITIDAS
// ============================================================================
describe("Casos Límite de Estado de Viaje y Transiciones (Producción)", () => {
  test("Permite el ciclo de vida feliz del viaje completo", () => {
    assert.equal(esTransicionValida("buscando", "aceptado"), true);
    assert.equal(esTransicionValida("aceptado", "conductor_en_camino"), true);
    assert.equal(esTransicionValida("conductor_en_camino", "esperando_pasajero"), true);
    assert.equal(esTransicionValida("esperando_pasajero", "en_curso"), true);
    assert.equal(esTransicionValida("en_curso", "finalizado"), true);
  });

  test("Permite cancelación antes de finalizar", () => {
    assert.equal(esTransicionValida("buscando", "cancelado"), true);
    assert.equal(esTransicionValida("aceptado", "cancelado"), true);
    assert.equal(esTransicionValida("conductor_en_camino", "cancelado"), true);
    assert.equal(esTransicionValida("esperando_pasajero", "cancelado"), true);
    assert.equal(esTransicionValida("en_curso", "cancelado"), true);
  });

  test("Rechaza transiciones ilegales hacia atrás o desde estados terminales", () => {
    // Desde finalizado no se puede revivir
    assert.equal(esTransicionValida("finalizado", "buscando"), false);
    assert.equal(esTransicionValida("finalizado", "en_curso"), false);
    // Desde cancelado no se puede reactivar
    assert.equal(esTransicionValida("cancelado", "en_curso"), false);
    assert.equal(esTransicionValida("cancelado", "buscando"), false);
    // Saltos ilegales
    assert.equal(esTransicionValida("buscando", "finalizado"), false);
    assert.equal(esTransicionValida("en_curso", "buscando"), false);
  });

  test("Permite idempotencia en el mismo estado", () => {
    assert.equal(esTransicionValida("buscando", "buscando"), true);
    assert.equal(esTransicionValida("en_curso", "en_curso"), true);
  });
});

// ============================================================================
// 5. VALIDACIONES DE IDENTIDAD Y DATOS PERUANOS (RENIEC / TELEFONÍA)
// ============================================================================
describe("Validación de Datos de Identidad y Contacto (Producción)", () => {
  test("Valida DNI peruano de exactamente 8 dígitos", () => {
    assert.equal(esDNIValido("74859612"), true);
    assert.equal(esDNIValido("1234567"), false); // 7 dígitos
    assert.equal(esDNIValido("123456789"), false); // 9 dígitos
    assert.equal(esDNIValido("7485961A"), false); // con letras
  });

  test("Sanitiza DNI extrayendo únicamente los primeros 8 dígitos numéricos", () => {
    assert.equal(sanitizarDNI("  74.859.612-K "), "74859612");
    assert.equal(sanitizarDNI("abc74859612extra"), "74859612");
  });

  test("Valida teléfono celular peruano (comienza con 9 y tiene 9 dígitos)", () => {
    assert.equal(esTelefonoValido("987654321"), true);
    assert.equal(esTelefonoValido("887654321"), false); // no empieza en 9
    assert.equal(esTelefonoValido("98765432"), false); // 8 dígitos
    assert.equal(esTelefonoValido("9876543210"), false); // 10 dígitos
  });

  test("Sanitiza teléfono quitando prefijo internacional +51", () => {
    assert.equal(sanitizarTelefono("+51 987 654 321"), "987654321");
    assert.equal(sanitizarTelefono("51987654321"), "987654321");
    assert.equal(sanitizarTelefono("987654321"), "987654321");
  });

  test("Calcula correctamente la mayoría de edad (18+ años)", () => {
    const hoy = new Date();
    const hace17Anios = new Date(hoy.getFullYear() - 17, hoy.getMonth(), hoy.getDate());
    const hace18Anios = new Date(hoy.getFullYear() - 18, hoy.getMonth(), hoy.getDate());
    const hace25Anios = new Date(hoy.getFullYear() - 25, hoy.getMonth(), hoy.getDate());

    assert.equal(calcularEdad(hace17Anios), 17);
    assert.equal(calcularEdad(hace18Anios), 18);
    assert.equal(calcularEdad(hace25Anios), 25);
  });
});

// ============================================================================
// 6. MOTOR TARIFARIO Y DISTANCIA HAVERSINE (BAGUA)
// ============================================================================
describe("Motor Tarifario y Cálculo Geográfico (Producción)", () => {
  test("Aplica tarifa mínima garantizada cuando la distancia es corta", () => {
    // 0.2 km no debe costar menos de la tarifa mínima (S/ 3.00)
    const tarifaNormal = calcularTarifa(0.2, "normal");
    assert.ok(tarifaNormal >= 3.0);
  });

  test("Aplica recargo proporcional en servicio Express", () => {
    const tarifaNormal = calcularTarifa(3.0, "normal");
    const tarifaExpress = calcularTarifa(3.0, "express");
    assert.ok(tarifaExpress > tarifaNormal);
  });

  test("Calcula distancia Haversine positiva entre Plaza de Armas y UNTRM Bagua", () => {
    const plazaArmas = { latitude: -5.6394, longitude: -78.5311 };
    const untrm = { latitude: -5.645, longitude: -78.525 };
    const distancia = distanciaKm(plazaArmas, untrm);

    assert.ok(distancia > 0);
    assert.ok(distancia < 5.0); // En Bagua la distancia urbana es menor a 5 km
  });
});
