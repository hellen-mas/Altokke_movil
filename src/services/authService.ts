import { supabase } from "@/lib/supabase";
import { subirFotoAvatar } from "@/utils/avatar";
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

export const authService = {
  /**
   * Inicia sesión con correo y contraseña
   */
  async loginConPassword(email: string, contrasena: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: contrasena,
    });
    if (error) throw error;
    if (!data.user) throw new Error("No se pudo obtener el usuario.");
    return data.user;
  },

  /**
   * Inicia sesión o registro con Google OAuth
   */
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
    return sessionData?.session?.user || null;
  },

  /**
   * Registra un nuevo pasajero con correo y contraseña
   */
  async registrarPasajero(datos: RegistroPasajeroInput) {

    const metadata = {
      nombre: datos.nombres,
      apellidos: datos.apellidos,
      telefono: datos.telefono,
      dni: datos.dni,
      fecha_nacimiento: datos.fechaNacimiento,
      notificaciones: datos.notificaciones,
      ubicacion: datos.ubicacion,
      promociones: datos.promociones,
      rol: "pasajero",
    };

    const { data, error } = await supabase.auth.signUp({
      email: datos.correo.trim().toLowerCase(),
      password: datos.contrasena,
      options: { data: metadata },
    });

    if (error) throw error;

    if (data.user?.id && datos.fotoPerfil) {
      try {
        await subirFotoAvatar(datos.fotoPerfil, data.user.id, datos.fotoBase64 || undefined);
      } catch (err) {
        console.warn("Aviso al subir foto inicial:", err);
      }
    }

    return data;
  },

  /**
   * Actualiza el perfil de un usuario registrado vía OAuth
   */
  async actualizarPerfilOAuth(userId: string, datos: PerfilOAuthInput) {
    const metadata = {
      nombre: datos.nombres,
      apellidos: datos.apellidos,
      telefono: datos.telefono,
      dni: datos.dni,
      fecha_nacimiento: datos.fechaNacimiento,
      notificaciones: datos.notificaciones,
      ubicacion: datos.ubicacion,
      promociones: datos.promociones,
      rol: "pasajero",
    };

    const { error } = await supabase.auth.updateUser({ data: metadata });
    if (error) throw error;

    if (datos.fotoPerfil) {
      try {
        await subirFotoAvatar(datos.fotoPerfil, userId, datos.fotoBase64 || undefined);
      } catch (err) {
        console.warn("Aviso al subir foto inicial OAuth:", err);
      }
    }
  },

  /**
   * Solicita el envío de un código OTP para recuperar contraseña
   */
  async solicitarRecuperacionPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase());
    if (error) throw error;
  },

  /**
   * Verifica el código OTP de recuperación
   */
  async verificarCodigoRecuperacion(email: string, codigo: string) {
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: codigo.trim(),
      type: "recovery",
    });
    if (error) throw error;
  },

  /**
   * Actualiza la contraseña del usuario y cierra la sesión
   */
  async actualizarPassword(nuevaPassword: string) {
    const { error } = await supabase.auth.updateUser({ password: nuevaPassword });
    if (error) throw error;
    await supabase.auth.signOut();
  },

  /**
   * Verifica si existe una sesión activa persistida
   */
  async tieneSesionActiva(): Promise<boolean> {
    const { data } = await supabase.auth.getSession();
    return Boolean(data?.session);
  },

  /**
   * Obtiene el usuario autenticado actualmente
   */
  async obtenerUsuarioActual() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  /**
   * Cierra la sesión activa
   */
  async cerrarSesion() {
    await supabase.auth.signOut();
  },
};


