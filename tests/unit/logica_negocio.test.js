/**
 * SUITE DETERMINISTA DE PRUEBAS UNITARIAS: LÓGICA DE NEGOCIO Y SEGURIDAD ALTOKKE
 * Ejecución: node --test tests/unit/logica_negocio.test.js
 * Cumplimiento: Cero dependencias externas (usa node:test y node:assert oficiales)
 */

const { test, describe } = require("node:test");
const assert = require("node:assert/strict");

// ============================================================================
// 1. MÓDULO DE VUELTO INTELIGENTE Y MANEJO DE EFECTIVO (BAGUA)
// ============================================================================
describe("Lógica de Vuelto Inteligente en Efectivo", () => {
  function validarYCalcularVuelto(pagaCon, montoTarifa) {
    if (typeof pagaCon !== "number" || typeof montoTarifa !== "number") {
      throw new TypeError("Los montos deben ser numéricos");
    }
    if (isNaN(pagaCon) || isNaN(montoTarifa)) {
      throw new Error("Montos no pueden ser NaN");
    }
    if (montoTarifa <= 0) {
      throw new Error("La tarifa del viaje debe ser mayor a 0");
    }
    if (pagaCon < montoTarifa) {
      throw new Error("El monto de pago no puede ser menor a la tarifa");
    }

    const vuelto = Math.round((pagaCon - montoTarifa) * 100) / 100;
    const esExacto = vuelto === 0;

    return {
      pagaCon,
      montoTarifa,
      vuelto,
      esExacto,
      denominacionValida: [10, 20, 50, 100].includes(pagaCon) || esExacto,
    };
  }

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
  });
});

// ============================================================================
// 2. MÓDULO DE CONTRAOFERTAS (MODELO INDRIVE REGULADO PARA BAGUA)
// ============================================================================
describe("Lógica de Contraofertas y Control Tarifario", () => {
  const TARIFA_MINIMA_BAGUA = 1.5;
  const TARIFA_MAXIMA_BAGUA = 15.0;

  function validarContraoferta(montoContraoferta, tarifaBase) {
    if (typeof montoContraoferta !== "number" || typeof tarifaBase !== "number") {
      return { valido: false, razon: "Valores no numéricos" };
    }
    if (isNaN(montoContraoferta) || isNaN(tarifaBase)) {
      return { valido: false, razon: "Valores no válidos (NaN)" };
    }
    if (montoContraoferta < TARIFA_MINIMA_BAGUA) {
      return { valido: false, razon: `Monto por debajo del piso de Bagua (S/ ${TARIFA_MINIMA_BAGUA.toFixed(2)})` };
    }
    if (montoContraoferta > TARIFA_MAXIMA_BAGUA) {
      return { valido: false, razon: `Monto supera el techo máximo permitido (S/ ${TARIFA_MAXIMA_BAGUA.toFixed(2)})` };
    }

    const pisoPermitido = Math.round(tarifaBase * 0.5 * 10) / 10;
    const techoPermitido = Math.round(tarifaBase * 2.0 * 10) / 10;

    if (montoContraoferta < pisoPermitido) {
      return { valido: false, razon: "La contraoferta no puede ser inferior al 50% de la tarifa propuesta" };
    }
    if (montoContraoferta > techoPermitido) {
      return { valido: false, razon: "La contraoferta no puede superar el 200% de la tarifa propuesta" };
    }

    const montoRedondeado = Math.round(montoContraoferta * 10) / 10;
    return { valido: true, montoFinal: montoRedondeado };
  }

  test("Acepta contraoferta razonable dentro del rango permitido (S/ 4.00 sobre base S/ 3.00)", () => {
    const res = validarContraoferta(4.0, 3.0);
    assert.equal(res.valido, true);
    assert.equal(res.montoFinal, 4.0);
  });

  test("Rechaza contraoferta abusiva que duplica más del 200% (S/ 7.00 sobre base S/ 3.00)", () => {
    const res = validarContraoferta(7.0, 3.0);
    assert.equal(res.valido, false);
    assert.match(res.razon, /200%/);
  });

  test("Rechaza contraoferta predator que reduce más del 50% (S/ 1.00 sobre base S/ 3.00)", () => {
    const res = validarContraoferta(1.0, 3.0);
    assert.equal(res.valido, false);
  });

  test("Rechaza contraofertas por encima del techo absoluto de Bagua (S/ 25.00)", () => {
    const res = validarContraoferta(25.0, 10.0);
    assert.equal(res.valido, false);
    assert.match(res.razon, /techo máximo permitido/);
  });
});

// ============================================================================
// 3. MÓDULO DE COMUNICACIÓN EFÍMERA Y PROTECCIÓN DE PRIVACIDAD
// ============================================================================
describe("Privacidad y Sanitización de Chat In-App", () => {
  const REGEX_NUMERO_PERU = /\b9\d{8}\b|\b9\d{2}[-.\s]\d{3}[-.\s]\d{3}\b/;

  function procesarMensajeRapido(texto) {
    if (typeof texto !== "string") {
      return { permitido: false, razon: "Mensaje inválido" };
    }
    const limpio = texto.trim();
    if (limpio.length === 0 || limpio.length > 120) {
      return { permitido: false, razon: "Longitud no autorizada (1 a 120 caracteres)" };
    }

    // Prevención de elusión de plataforma y fuga de privacidad (teléfonos móviles 9xx xxx xxx)
    if (REGEX_NUMERO_PERU.test(limpio)) {
      return {
        permitido: false,
        razon: "Violación de privacidad: Prohibido compartir números telefónicos directos en el chat.",
      };
    }

    // Sanitización básica de tags HTML / scripts
    const sanitizado = limpio.replace(/<[^>]*>?/gm, "");

    return { permitido: true, texto: sanitizado };
  }

  test("Permite respuestas rápidas comunes y seguras", () => {
    const res = procesarMensajeRapido("Ya estoy en el punto de encuentro, en la moto azul.");
    assert.equal(res.permitido, true);
    assert.equal(res.texto, "Ya estoy en el punto de encuentro, en la moto azul.");
  });

  test("Detecta y bloquea números telefónicos peruanos para resguardo de pasajero/conductor", () => {
    const res = procesarMensajeRapido("Escríbeme a mi número personal 945892104 para acordar.");
    assert.equal(res.permitido, false);
    assert.match(res.razon, /Violación de privacidad/);
  });

  test("Sanitiza etiquetas HTML o scripts maliciosos", () => {
    const res = procesarMensajeRapido("<script>alert('xss')</script>Llegué afuera.");
    assert.equal(res.permitido, true);
    assert.equal(res.texto, "alert('xss')Llegué afuera.");
  });
});
