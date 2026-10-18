/**
 * Traduce los mensajes de error devueltos por Supabase Auth, APIs y conexiones
 * a un español claro, profesional y amigable para el usuario.
 */
const REGLAS_ERRORES: [string[], string][] = [
  [
    ["user already registered", "already registered", "email already in use", "user with this email already exists"],
    "Este correo electrónico ya se encuentra registrado. Por favor inicia sesión o recupera tu contraseña.",
  ],
  [
    ["usuarios_telefono_key", "phone number already exists", "duplicate key", "telefono"],
    "Este número de teléfono ya está asociado a otra cuenta registrada. Por favor ingresa otro número.",
  ],
  [
    ["database error saving new user", "saving new user"],
    "Hubo un problema temporal en el servidor al registrar tu perfil. Por favor vuelve a intentarlo en un momento.",
  ],
  [
    ["invalid login credentials", "invalid credentials", "wrong password"],
    "Correo o contraseña incorrectos. Por favor, verifica tus datos e inténtalo nuevamente.",
  ],
  [
    ["email not confirmed"],
    "Tu correo electrónico aún no ha sido confirmado. Revisa tu bandeja de entrada o carpeta de spam.",
  ],
  [
    ["password should be at least", "weak password", "signup requires a valid password"],
    "La contraseña ingresada no cumple con los requisitos mínimos de seguridad.",
  ],
  [
    ["rate limit", "too many requests", "over_email_send_rate_limit", "security purposes", "once every"],
    "Has alcanzado el límite de intentos permitidos. Por seguridad, espera unos momentos antes de reintentar.",
  ],
  [
    ["token has expired", "otp expired", "token is expired"],
    "El código de verificación ha expirado. Por favor solicita uno nuevo.",
  ],
  [
    ["token is invalid", "invalid token", "otp invalid"],
    "El código de verificación es incorrecto o no es válido. Verifica el número recibido.",
  ],
  [
    ["user not found", "no user found"],
    "No encontramos ninguna cuenta asociada a este correo electrónico.",
  ],
  [
    ["network request failed", "fetch failed", "network error", "timeout"],
    "No se pudo conectar con el servidor. Por favor verifica tu conexión a internet e inténtalo nuevamente.",
  ],
  [
    ["session expired", "jwt expired", "auth session missing"],
    "Tu sesión ha expirado. Por favor vuelve a iniciar sesión.",
  ],
  [
    ["invalid email", "email address is invalid"],
    "El correo electrónico ingresado no tiene un formato válido.",
  ],
  [
    ["dni"],
    "No se encontraron datos para el número de DNI ingresado. Por favor verifica los 8 dígitos.",
  ],
];

export function traducirErrorAuth(
  error: any,
  mensajePorDefecto = "Ocurrió un error. Por favor, inténtalo nuevamente más tarde."
): string {
  if (!error) return mensajePorDefecto;
  const msg = (typeof error === "string" ? error : error?.message || "").toLowerCase().trim();
  const coincidencia = REGLAS_ERRORES.find(([patrones]) => patrones.some((p) => msg.includes(p)));
  return coincidencia ? coincidencia[1] : mensajePorDefecto;
}

