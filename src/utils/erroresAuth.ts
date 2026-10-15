/**
 * Traduce los mensajes de error devueltos por Supabase Auth, APIs y conexiones
 * a un español claro, profesional y amigable para el usuario.
 */
export function traducirErrorAuth(
  error: any,
  mensajePorDefecto: string = "Ocurrió un error. Por favor, inténtalo nuevamente más tarde."
): string {
  if (!error) return mensajePorDefecto;

  const msg = (typeof error === "string" ? error : error?.message || "").toLowerCase().trim();

  // Usuario ya registrado
  if (
    msg.includes("user already registered") ||
    msg.includes("already registered") ||
    msg.includes("email already in use") ||
    msg.includes("user with this email already exists")
  ) {
    return "Este correo electrónico ya se encuentra registrado. Por favor inicia sesión o recupera tu contraseña si la olvidaste.";
  }

  // Teléfono o dato duplicado
  if (
    msg.includes("usuarios_telefono_key") ||
    msg.includes("phone number already exists") ||
    (msg.includes("duplicate key") && msg.includes("telefono"))
  ) {
    return "Este número de teléfono ya está asociado a otra cuenta registrada. Por favor ingresa otro número.";
  }

  // Error de base de datos al guardar nuevo usuario
  if (msg.includes("database error saving new user") || msg.includes("saving new user")) {
    return "Hubo un problema temporal en el servidor al registrar tu perfil. Por favor vuelve a intentarlo en un momento.";
  }

  // Credenciales incorrectas
  if (
    msg.includes("invalid login credentials") ||
    msg.includes("invalid credentials") ||
    msg.includes("wrong password")
  ) {
    return "Correo o contraseña incorrectos. Por favor, verifica tus datos e inténtalo nuevamente.";
  }

  // Correo pendiente de confirmación
  if (msg.includes("email not confirmed")) {
    return "Tu correo electrónico aún no ha sido confirmado. Revisa tu bandeja de entrada o carpeta de spam.";
  }

  // Contraseña inválida o débil
  if (
    msg.includes("password should be at least") ||
    msg.includes("weak password") ||
    msg.includes("signup requires a valid password")
  ) {
    return "La contraseña ingresada no cumple con los requisitos de seguridad (mínimo 8 caracteres, mayúscula, minúscula, número y símbolo).";
  }

  // Límite de intentos / Rate limiting
  if (
    msg.includes("rate limit") ||
    msg.includes("too many requests") ||
    msg.includes("over_email_send_rate_limit")
  ) {
    return "Has alcanzado el límite de intentos permitidos. Por seguridad, espera unos minutos antes de volver a intentarlo.";
  }

  if (
    msg.includes("security purposes") ||
    msg.includes("once every")
  ) {
    return "Por seguridad, debes esperar unos segundos antes de solicitar una nueva acción o código.";
  }

  // Códigos OTP / Tokens expirados o inválidos
  if (
    msg.includes("token has expired") ||
    msg.includes("otp expired") ||
    msg.includes("token is expired")
  ) {
    return "El código de verificación ha expirado. Por favor solicita uno nuevo.";
  }

  if (
    msg.includes("token is invalid") ||
    msg.includes("invalid token") ||
    msg.includes("otp invalid") ||
    msg.includes("token has expired or is invalid")
  ) {
    return "El código de verificación es incorrecto o no es válido. Verifica el número recibido.";
  }

  // Usuario no encontrado
  if (
    msg.includes("user not found") ||
    msg.includes("no user found")
  ) {
    return "No encontramos ninguna cuenta asociada a este correo electrónico.";
  }

  // Error de conexión o red
  if (
    msg.includes("network request failed") ||
    msg.includes("fetch failed") ||
    msg.includes("network error") ||
    msg.includes("timeout")
  ) {
    return "No se pudo conectar con el servidor. Por favor verifica tu conexión a internet e inténtalo nuevamente.";
  }

  // Sesión expirada
  if (
    msg.includes("session expired") ||
    msg.includes("jwt expired") ||
    msg.includes("auth session missing")
  ) {
    return "Tu sesión ha expirado. Por favor vuelve a iniciar sesión.";
  }

  // Formato de correo inválido
  if (
    msg.includes("invalid email") ||
    msg.includes("email address is invalid")
  ) {
    return "El correo electrónico ingresado no tiene un formato válido.";
  }

  // DNI y RENIEC
  if (
    msg.includes("dni") &&
    (msg.includes("no encontrado") || msg.includes("no existe") || msg.includes("not found"))
  ) {
    return "No se encontraron datos para el número de DNI ingresado. Por favor verifica los 8 dígitos.";
  }

  return mensajePorDefecto;
}
