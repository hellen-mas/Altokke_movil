export const paletaColores = {
  // Superficies y fondos modo oscuro (60% regla visual)
  fondo: "#0A130E",
  superficie: "#121E18",
  superficieElevada: "#182720",
  tarjeta: "#13221A",
  input: "#121E18",

  // Tipografía y contraste calibrados para WCAG AAA (Mínimo 7:1 en texto normal)
  texto: "#FFFFFF",
  textoSecundario: "#D4E3DB", // Contraste 13.8:1 sobre fondo #0A130E (pasa AAA holgadamente)
  textoTerciario: "#A3B8AC",  // Contraste 8.9:1 sobre fondo #0A130E
  textoOscuro: "#04160C",     // Contraste 6.3:1 sobre botón #24A665 (texto grande/bold pasa AAA)

  // Bordes definidos (30% regla visual para affordance y baja visión)
  borde: "#2D4537",           // Borde visible con contraste tangible frente a superficies
  bordeFuerte: "#436652",

  // Color primario de marca (10% botones de acción principal)
  boton: "#24A665",
  botonPresionado: "#1C8450",
  verde: "#24A665",

  // Modo claro accesible
  fondoClaro: "#F7F9F8",
  superficieClara: "#FFFFFF",
  textoClaro: "#121A15",
  textoSecundarioClaro: "#4A5E53",
  bordeClaro: "#CBD8D1",
  inputClaro: "#FFFFFF",

  // Estados semánticos de alta visibilidad
  error: "#FF5C5C",
  errorFondo: "rgba(255, 92, 92, 0.14)",
  advertencia: "#E5A93C",
  advertenciaFondo: "rgba(229, 169, 60, 0.14)",
  exito: "#24A665",
  exitoFondo: "rgba(36, 166, 101, 0.14)",
  disabled: "#223329",
  disabledTexto: "rgba(255, 255, 255, 0.38)",
};

