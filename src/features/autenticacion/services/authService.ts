import { identidadService } from "@/features/autenticacion/services/identidadService";
import { supabase } from "@/shared/api/supabase";
import { subirFotoAvatar } from "@/shared/utils/avatar";
import * as AppleAuthentication from "expo-apple-authentication";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";

export interface RegistroPasajeroInput {
  correo: string;
  contrasena: string;
  nombres: string;
  apellidos: string;
  telefono: string;
  dni: string;
  fechaNacimiento: string;
  notificaciones: boolean;
  ubicacion: boolean;
  promociones: boolean;
  fotoPerfil?: string | null;
  fotoBase64?: string | null;
}

export type PerfilOAuthInput = Omit<RegistroPasajeroInput, "correo" | "contrasena">;

const cleanEmail = (correo: string) => (correo || "").trim().toLowerCase();

const extraerMetadata = (d: PerfilOAuthInput) => ({
  nombre: d.nombres,
  apellidos: d.apellidos,
  telefono: d.telefono,
  dni: d.dni,
  fecha_nacimiento: d.fechaNacimiento,
  notificaciones: d.notificaciones,
  ubicacion: d.ubicacion,
  promociones: d.promociones,
  rol: "pasajero",
});


const comprobarEstadoCuenta = async (usuarioId: string) => {
  const { data: perfil, error } = await supabase
    .from("usuarios")
    .select("estado_cuenta")
    .eq("id", usuarioId)
    .single();

  if (error || !perfil) {
    await supabase.auth.signOut({ scope: "local" });
    throw new Error("No fue posible verificar el estado de tu cuenta.");
  }

  if (perfil.estado_cuenta !== "activo") {
    await supabase.auth.signOut({ scope: "local" });

    switch (perfil.estado_cuenta) {
      case "eliminada":
        throw new Error("Esta cuenta ya no está disponible.");

      case "suspendido":
        throw new Error(
          "Tu cuenta ha sido suspendida. Contacta con soporte de Altokke."
        );

      case "desactivado":
        throw new Error(
          "Tu cuenta está desactivada. Contacta con soporte para solicitar su reactivación."
        );

      default:
        throw new Error("Tu cuenta no está disponible.");
    }
  }
};

export const authService = {
  async obtenerSesionActiva() {
    const { data, error } = await supabase.auth.getSession();

    if (error) throw error;

    return data.session;
  },

  async loginConPassword(email: string, contrasena: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail(email),
      password: contrasena,
    });
    if (error) throw error;

    if (!data.user) throw new Error("No se pudo obtener el usuario.");

    await comprobarEstadoCuenta(data.user.id);
    return data.user;
  },

  async loginConGoogle() {
    const redirectUrl = AuthSession.makeRedirectUri();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: redirectUrl },
    });
    if (error) throw error;
    if (!data?.url) throw new Error("No se pudo generar la URL de autenticación con Google.");

    const res = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
    if (res.type !== "success" || !res.url) return null;

    const hashOrQuery = res.url.split("#")[1] || res.url.split("?")[1];
    if (!hashOrQuery) return null;

    const params = new URLSearchParams(hashOrQuery);
    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");
    if (!access_token || !refresh_token) return null;

    const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    });
    
    if (sessionError) throw sessionError;

    const usuarioGoogle = sessionData?.session?.user;

    if (!usuarioGoogle) return null;

    await comprobarEstadoCuenta(usuarioGoogle.id);

    return usuarioGoogle;
  },

  async loginConApple() {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    if (!credential.identityToken) {
      throw new Error("No se obtuvo el token de identidad de Apple.");
    }

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: "apple",
      token: credential.identityToken,
    });

    if (error) throw error;
    if (!data.user) throw new Error("No se pudo obtener el usuario de Apple.");

    await comprobarEstadoCuenta(data.user.id);

    return data.user;
  },

  async registrarPasajero(datos: RegistroPasajeroInput) {
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail(datos.correo),
      password: datos.contrasena,
      options: { data: extraerMetadata(datos) },
    });
    if (error) throw error;
    let avatarExitoso = !datos.fotoPerfil;
    let errorAvatar: string | undefined;

    if (data.user?.id && datos.fotoPerfil) {
      const resultado = await subirFotoAvatar(
        datos.fotoPerfil,
        data.user.id,
        datos.fotoBase64 || undefined
      );

      avatarExitoso = resultado.ok;

      if (!resultado.ok) {
        errorAvatar =
          resultado.error ||
          "No se pudo guardar la fotografía de perfil.";
      }
    } else if (datos.fotoPerfil) {
      avatarExitoso = false;
      errorAvatar = "No se obtuvo el usuario para guardar la fotografía.";
    }
    return {
      ...data,
      usuario: data.user,
      avatarExitoso,
      errorAvatar,
    };
  },

  async actualizarPerfilOAuth(userId: string, datos: PerfilOAuthInput) {
    const { error } = await supabase.auth.updateUser({ data: extraerMetadata(datos) });
    if (error) throw error;

    let avatarExitoso = !datos.fotoPerfil;
    let errorAvatar: string | undefined;

    if (datos.fotoPerfil) {
      const resultado = await subirFotoAvatar(
        datos.fotoPerfil,
        userId,
        datos.fotoBase64 || undefined
      );

      avatarExitoso = resultado.ok;

      if (!resultado.ok) {
        errorAvatar =
          resultado.error ||
          "No se pudo actualizar la fotografía.";
      }
    }

    return {
      avatarExitoso,
      errorAvatar,
    };
  },

  async solicitarRecuperacionPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail(email));
    if (error) throw error;
  },

  async verificarCodigoRecuperacion(email: string, codigo: string) {
    const { error } = await supabase.auth.verifyOtp({
      email: cleanEmail(email),
      token: codigo.trim(),
      type: "recovery",
    });
    if (error) throw error;
  },

  async actualizarPassword(nuevaPassword: string) {
    const { error } = await supabase.auth.updateUser({ password: nuevaPassword });
    if (error) throw error;
    await supabase.auth.signOut();
  },

  async tieneSesionActiva(): Promise<boolean> {
    const { data, error } = await supabase.auth.getSession();

    if (error || !data.session?.user) {
      return false;
    }

    await comprobarEstadoCuenta(data.session.user.id);

    return true;
  },

  async obtenerUsuarioActual() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },
  
  async eliminarMiCuenta(): Promise<void> {
    const { data, error } = await supabase.functions.invoke(
      "finalizar-eliminacion-cuenta",
      { body: {} }
    );

    if (error) {
      let mensaje = "No se pudo completar la eliminación de la cuenta.";

      if (error.context instanceof Response) {
        try {
          const detalle = await error.context.clone().json();
          mensaje = detalle.error || detalle.message || mensaje;
        } catch {
          mensaje = error.message;
        }
      } else {
        mensaje = error.message;
      }

      throw new Error(mensaje);
    }

    if (!data?.ok) {
      throw new Error(
        data?.error || "No se pudo completar la eliminación de la cuenta."
      );
    }

    await supabase.auth.signOut({ scope: "local" });
  },

  async cerrarSesion() {
    await supabase.auth.signOut();
  },

  /**
   * Valida si un número telefónico cumple con el estándar móvil de Perú (9 dígitos, inicia en 9).
   * Soporta tanto formato local (9XXXXXXXX) como internacional E.164 (+51 9XXXXXXXX).
   */
  validarTelefonoPeruano(telefono: string): boolean {
    const digitos = (telefono || "").replace(/\D/g, "");
    const sinPrefijo =
      digitos.length === 11 && digitos.startsWith("51")
        ? digitos.slice(2)
        : digitos;
    return /^9\d{8}$/.test(sinPrefijo);
  },

  /**
   * Verifica en el servidor si el correo o el teléfono ya están registrados (L-02).
   */
  async verificarDisponibilidadCuenta(
    email?: string | null,
    telefono?: string | null
  ): Promise<{ emailDisponible: boolean; telefonoDisponible: boolean }> {
    try {
      const emailLimpio = email ? cleanEmail(email) : null;
      let telefonoLimpio = telefono ? telefono.replace(/\D/g, "") : null;
      if (telefonoLimpio && telefonoLimpio.length === 11 && telefonoLimpio.startsWith("51")) {
        telefonoLimpio = telefonoLimpio.slice(2);
      }

      const { data, error } = await supabase.rpc("verificar_disponibilidad_cuenta", {
        p_email: emailLimpio,
        p_telefono: telefonoLimpio,
      });

      if (error || !data) {
        console.warn("Aviso al verificar disponibilidad de cuenta en RPC:", error?.message);
        return { emailDisponible: true, telefonoDisponible: true };
      }

      const res = data as { ok?: boolean; email_disponible?: boolean; telefono_disponible?: boolean };
      return {
        emailDisponible: res.email_disponible ?? true,
        telefonoDisponible: res.telefono_disponible ?? true,
      };
    } catch (err: unknown) {
      console.warn("Excepción al verificar disponibilidad de cuenta:", err);
      return { emailDisponible: true, telefonoDisponible: true };
    }
  },

  /**
   * Reenvía el código de confirmación de registro por correo (L-02).
   */
  async reenviarCodigoConfirmacion(email: string): Promise<void> {
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: cleanEmail(email),
    });
    if (error) throw error;
  },

  /**
   * Verifica el código de 6 dígitos para confirmar la cuenta nueva de registro (L-02).
   */
  async verificarCodigoSignup(email: string, codigo: string): Promise<void> {
    const { error } = await supabase.auth.verifyOtp({
      email: cleanEmail(email),
      token: codigo.trim(),
      type: "signup",
    });
    if (error) throw error;
  },

  // Delegaciones para compatibilidad con módulos dependientes
  existeDni: (dni: string) => identidadService.existeDni(dni),
  validarIdentidadDNI: (dni: string) => identidadService.validarIdentidadDNI(dni),
};
