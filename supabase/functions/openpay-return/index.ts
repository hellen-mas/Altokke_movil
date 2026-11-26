
Deno.serve((req: Request) => {
  if (req.method !== "GET") {
    return new Response("Método no permitido.", {
      status: 405,
    });
  }

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>ALTOKKE - Pago finalizado</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background: #0A130E;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      text-align: center;
    }
    main {
      padding: 32px;
      max-width: 380px;
    }
    a {
      display: inline-block;
      margin-top: 20px;
      padding: 14px 24px;
      background: #16A34A;
      color: white;
      text-decoration: none;
      border-radius: 12px;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <main>
    <h2>¡Gracias por utilizar ALTOKKE!</h2>
    <p>Tu pago está siendo verificado.</p>
    <p>Regresa a la aplicación para consultar el estado de tu recarga.</p>
    <a href="altokkemovil://">Volver a ALTOKKE</a>
  </main>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
});
