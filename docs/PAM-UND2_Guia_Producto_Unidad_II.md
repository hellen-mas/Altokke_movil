# GUÍA PARA LA ELABORACIÓN DEL PRODUCTO DE UNIDAD II
## Programación de Aplicaciones Móviles

**Universidad Nacional Toribio Rodríguez de Mendoza de Amazonas**
**Facultad de Ingeniería de Sistemas y Mecánica Eléctrica**
**Docente:** Mg. Eder N. Figueroa Piscoya

---

## I. INDICACIONES GENERALES

### 1. Nombre del entregable
Entregable N° 02 del Trabajo de Fin de Curso.

### 2. Descripción
Cada equipo continuará el proyecto móvil presentado en la Unidad I y documentará el avance funcional alcanzado durante la Unidad II. Si el equipo cambió de proyecto o redujo su alcance, deberá explicar la decisión y precisar qué problema atiende la versión actual.

El informe debe fundamentar las decisiones técnicas y demostrar el funcionamiento de la aplicación. Se espera evidencia de:
- navegación,
- presentación de colecciones de datos,
- tipado y transformación de datos,
- componentes o hooks reutilizables,
- y, según las necesidades del proyecto, consumo de servicios web y persistencia de información.

No se exige utilizar todas las herramientas vistas en clase si alguna no corresponde al problema que resuelve la aplicación. Ejemplo: TanStack Query puede incorporarse, pero su uso no será obligatorio ni otorgará puntos por sí solo. Si el equipo utiliza alguna herramienta, deberá explicar qué necesidad resuelve y demostrar su funcionamiento.

### 3. Resultado de aprendizaje
Desarrolla aplicaciones móviles escalables, integrando tecnologías emergentes de computación móvil, persistencia de datos y servicios web bajo patrones de diseño y estándares de calidad de software.

### 4. Cantidad de integrantes
04 integrantes (máx. 05). Se mantienen los equipos definidos para el Avance 01.

### 5. Fecha de entrega
Miércoles, 30 de septiembre del 2026.

---

## II. ESQUEMA DEL TRABAJO

El equipo deberá presentar una carpeta comprimida con el código fuente y un Informe Técnico en PDF con el siguiente esquema:

| Apartado | Contenido esperado |
|---|---|
| **Portada** | Universidad, escuela, curso, título del proyecto, unidad, integrantes, docente y fecha, etc. |
| **Resumen del avance** | Problema atendido, usuarios, objetivo de la aplicación y principales funcionalidades implementadas en la Unidad II. **Máximo una página.** |
| **1. Introducción y alcance** | Contexto del proyecto; relación con la propuesta de la Unidad I; cambios de alcance debidamente justificados; funcionalidades que comprende la versión presentada. |
| **2. Requerimientos y funcionalidades** | Requerimientos funcionales priorizados y descripción de los flujos que el usuario ya puede completar. Diferenciar con claridad lo **implementado**, lo **parcial** y lo **pendiente**. |
| **3. Arquitectura y organización del proyecto** | Diagrama sencillo de la estructura de la aplicación; propósito de las carpetas principales; relación entre pantallas, componentes, hooks, servicios, tipos o interfaces y mappers, según corresponda. Fundamentar las decisiones de reutilización y separación de responsabilidades. |
| **4. Navegación e interfaz** | Mapa de pantallas y flujo de navegación. Explicar el uso de Expo Router, layouts, Stack, Tabs y rutas dinámicas cuando estén presentes. Mostrar cómo se aplicaron los estilos y cómo responde la interfaz a distintos tamaños de pantalla. |
| **5. Gestión de datos e integración** | Origen de los datos y recorrido desde su obtención hasta la pantalla. Cuando exista una API: endpoint, petición HTTP con Axios, estructura de la respuesta, tipado, mapeo y tratamiento de carga, error y ausencia de resultados. Cuando exista persistencia: qué datos se guardan, dónde, cómo se recuperan y qué ocurre al cerrar y volver a abrir la aplicación. |
| **6. Implementación de funcionalidades** | Explicar las funcionalidades principales mediante fragmentos **breves y seleccionados** de código, acompañados de una explicación propia. Incluir el papel de FlatList, componentes reutilizables y hooks personalizados cuando se utilicen. Evitar pegar archivos completos sin análisis. |
| **7. Verificación y calidad** | Tabla de pruebas manuales: acción realizada, resultado esperado, resultado obtenido y estado. Incluir casos normales y al menos un caso de error o dato ausente. Describir errores encontrados, correcciones efectuadas y limitaciones conocidas. |
| **8. Resultados y trabajo pendiente** | Evidencias visuales de los flujos terminados, evaluación del avance respecto del objetivo del proyecto y tareas concretas para la siguiente unidad. |
| **Conclusiones** | Qué logró el equipo, qué decisiones técnicas resultaron adecuadas y qué dificultades quedan por resolver. Las conclusiones deben corresponder a resultados comprobables. |
| **Referencias** | Documentación oficial y otras fuentes efectivamente utilizadas, con un formato bibliográfico consistente. Citar también recursos externos empleados en la elaboración del informe. |
| **Anexos** | Enlace al repositorio y al commit o versión presentada; capturas adicionales o evidencias complementarias; instrucciones breves para ejecutar la app si son necesarias; **Declaración de uso de I.A. generativa** en el formato proporcionado por el docente (ver última página de esta guía). |

> **Criterio transversal:** cada afirmación importante del informe debe poder relacionarse con una pantalla, un flujo ejecutable, una prueba o una parte identificable del repositorio. Una funcionalidad planificada no debe presentarse como implementada.

---

## III. ENTREGABLES Y FORMA DE PRESENTACIÓN

1. Un informe grupal en PDF.
2. Enlace al repositorio con el código correspondiente a la versión evaluada. El equipo debe identificar la rama y, de preferencia, el commit presentado.
3. Demostración funcional de la aplicación durante la exposición. Cada integrante deberá intervenir y responder preguntas sobre decisiones y código del proyecto.
4. Entrega en Moodle: un integrante sube el PDF y registra el enlace al repositorio, de acuerdo con la tarea habilitada por el docente. **No subir comprimidos (ni ZIP ni RAR).**

No deben incluir claves de API, tokens u otras credenciales en el PDF, las capturas o el repositorio. Si la ejecución requiere variables de entorno, documentar sus nombres y la forma de configurarlas sin publicar sus valores.

---

## IV. INSTRUMENTOS DE EVALUACIÓN

### 4.1. Rúbrica para evaluar el Producto 2 – UND1 (grupal)

Puntaje total: 6 + 5 + 5 + 4 = **20 pt**.

#### Criterio 1. Implementación y evidencia del avance funcional (6 pt)

| Nivel | Puntaje | Descriptor |
|---|---|---|
| Nulo | 0 | No presenta una versión verificable ni evidencia de funcionalidades. |
| Inicio | 1 | Presenta pantallas o código aislado; los flujos principales no funcionan. |
| En proceso | 3 | Funciona al menos un flujo, pero otros declarados fallan o carecen de evidencia. |
| Logrado | 4 | Los flujos priorizados funcionan y están respaldados por capturas y referencia al código. |
| Avanzado | 6 | Los flujos priorizados funcionan de extremo a extremo; las evidencias permiten comprobar estados normales, vacíos o de error pertinentes. |

#### Criterio 2. Arquitectura, navegación y fundamentación técnica (5 pt)

| Nivel | Puntaje | Descriptor |
|---|---|---|
| Nulo | 0 | No describe la organización ni las decisiones técnicas. |
| Inicio | 1 | Enumera carpetas o herramientas sin explicar su función. |
| En proceso | 2 | Explica parcialmente pantallas, navegación y organización; presenta responsabilidades mezcladas o justificaciones débiles. |
| Logrado | 4 | Explica de forma coherente rutas, componentes, hooks y separación de responsabilidades, con decisiones acordes al proyecto. |
| Avanzado | 5 | Además, muestra mediante diagramas y ejemplos concretos cómo la organización facilita mantenimiento, reutilización y ampliación. |

#### Criterio 3. Integración y tratamiento de datos (5 pt)

| Nivel | Puntaje | Descriptor |
|---|---|---|
| Nulo | 0 | No identifica ni demuestra cómo obtiene o conserva los datos usados por la aplicación. |
| Inicio | 1 | Menciona una API o almacenamiento, pero sin explicar el flujo ni aportar evidencia. |
| En proceso | 2 | Presenta obtención o persistencia funcional, aunque omite aspectos relevantes como tipado, transformación, estados o recuperación. |
| Logrado | 4 | Documenta y demuestra el flujo de datos pertinente: servicio web, tipado y mapeo, o persistencia y recuperación, con manejo básico de estados. |
| Avanzado | 5 | Explica y demuestra el recorrido completo de los datos y sus decisiones de diseño; verifica casos de error o ausencia de información aplicables. |

#### Criterio 4. Pruebas, redacción y trazabilidad (4 pt)

| Nivel | Puntaje | Descriptor |
|---|---|---|
| Nulo | 0 | No presenta pruebas; el documento no permite identificar la versión evaluada. |
| Inicio | 1 | Presenta capturas sin explicar qué comprueban; hay omisiones importantes de forma o referencias. |
| En proceso | 2 | Registra pruebas básicas y fuentes, pero la relación entre afirmaciones, resultados y repositorio es incompleta. |
| Logrado | 3 | Presenta pruebas con resultados, redacción clara, referencias y enlace preciso a la versión del proyecto. |
| Avanzado | 4 | Además, analiza fallos, limitaciones y correcciones; el informe permite reproducir y verificar el avance sin ambigüedades. |

---

### 4.2. Rúbrica para evaluar el Desempeño 3 – UND1 (individual)

Puntaje total: 6 + 5 + 5 + 4 = **20 pt**.

#### Criterio 1. Dominio técnico del proyecto (6 pt)

| Nivel | Puntaje | Descriptor |
|---|---|---|
| Nulo | 0 | No logra explicar su participación ni conceptos básicos del proyecto. |
| Inicio | 1 | Nombra herramientas o archivos, pero no explica cómo funcionan. |
| En proceso | 3 | Explica una parte de su trabajo; necesita ayuda para relacionarla con el funcionamiento general. |
| Logrado | 4 | Explica con precisión su aporte y la relación entre pantallas, lógica y datos. |
| Avanzado | 6 | Explica con precisión su aporte y otras partes relevantes; justifica decisiones técnicas y reconoce sus límites. |

#### Criterio 2. Demostración funcional (5 pt)

| Nivel | Puntaje | Descriptor |
|---|---|---|
| Nulo | 0 | No realiza demostración ni identifica un flujo implementado. |
| Inicio | 1 | Muestra pantallas sin completar una acción verificable. |
| En proceso | 2 | Completa parcialmente el flujo asignado o necesita intervención constante de otro integrante. |
| Logrado | 4 | Demuestra de manera autónoma un flujo funcional y explica qué sucede al interactuar con la app. |
| Avanzado | 5 | Demuestra el flujo con soltura e incluye la respuesta de la aplicación ante una condición alternativa o de error pertinente. |

#### Criterio 3. Respuestas y argumentación sobre el código (5 pt)

| Nivel | Puntaje | Descriptor |
|---|---|---|
| Nulo | 0 | No responde preguntas sobre el código presentado. |
| Inicio | 1 | Da respuestas vagas o contradictorias que no corresponden al código. |
| En proceso | 2 | Identifica archivos o líneas, pero explica de forma incompleta por qué se utilizaron. |
| Logrado | 4 | Responde correctamente y señala en el código la implementación que sustenta su explicación. |
| Avanzado | 5 | Responde con precisión, explica el efecto de cambiar una decisión o línea relevante y reconoce posibles mejoras. |

#### Criterio 4. Comunicación y desenvolvimiento profesional (4 pt)

| Nivel | Puntaje | Descriptor |
|---|---|---|
| Nulo | 0 | No participa en la exposición. |
| Inicio | 1 | Lee de forma íntegra, es difícil comprender su intervención o excede significativamente el tiempo. |
| En proceso | 2 | Comunica la idea principal, aunque con poca claridad, orden o control del tiempo. |
| Logrado | 3 | Expone con orden, vocabulario técnico comprensible y respeto del tiempo asignado. |
| Avanzado | 4 | Presenta una explicación clara y fluida, utiliza la demostración como apoyo y responde con seguridad y precisión. |

---

## ANEXO N° ___ – Declaración del Uso de I.A. generativa (formato del docente)

- **Título del trabajo:** [Título completo]
- **Autor(es):** [Apellidos y Nombres de cada integrante]
- **Fecha:** [Día, Mes y Año de entrega]

El/la abajo firmante declara que en la elaboración del presente trabajo académico ha utilizado las siguientes herramientas de inteligencia artificial generativa:

| Nombre de la herramienta de IA / versión | ¿Para qué se utilizó la herramienta de IA? | ¿Cuál fue el prompt utilizado? | ¿Cómo has utilizado o modificado el resultado generado por la IA generativa? |
|---|---|---|---|
| | | | |
| | | | |
| | | | |
| … | | | |

En [ciudad], a [día] de [mes] de [año]

Firmas: Integrante 1, Integrante 2, Integrante 3, Integrante 4 (línea de firma para cada uno).

---

*Nota de conversión: las rúbricas del PDF original se titulan "Producto 2 – UND1" y "Desempeño 3 – UND1" aunque la guía es de la Unidad II. Se mantuvo el texto tal cual.*
