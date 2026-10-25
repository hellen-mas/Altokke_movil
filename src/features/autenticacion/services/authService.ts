import { supabase } from "@/shared/api/supabase";
import { subirFotoAvatar } from "@/shared/utils/avatar";
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
const aTitulo = (str: string) => str.toLowerCase().replace(/(^|\s)\S/g, (l) => l.toUpperCase());
const cacheDni = new Map<string, { nombres: string; apellidos: string }>();

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

export const authService = {
  async loginConPassword(email: string, contrasena: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail(email),
      password: contrasena,
    });
    if (error) throw error;
    if (!data.user) throw new Error("No se pudo obtener el usuario.");
    return data.user;
  },

  async loginConGoogle() {
    const redirectUrl = AuthSession.makeRedirectUri();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: redirectUrl },
    });
    if (error) {
      throw error;
    }
    if (!data?.url) {
      throw new Error("No se pudo generar la URL de autenticación con Google.");
    }

    const res = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
    if (res.type !== "success" || !res.url) {
      return null;
    }

    const hashOrQuery = res.url.split("#")[1] || res.url.split("?")[1];
    if (!hashOrQuery) {
      return null;
    }

    const params = new URLSearchParams(hashOrQuery);
    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");
    if (!access_token || !refresh_token) {
      return null;
    }

    const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    });
    if (sessionError) {
      throw sessionError;
    }
    return sessionData?.session?.user || null;
  },

  async registrarPasajero(datos: RegistroPasajeroInput) {
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail(datos.correo),
      password: datos.contrasena,
      options: { data: extraerMetadata(datos) },
    });
    if (error) throw error;

    if (data.user?.id && datos.fotoPerfil) {
      subirFotoAvatar(datos.fotoPerfil, data.user.id, datos.fotoBase64 || undefined).catch((err) =>
        console.warn("Aviso foto inicial:", err)
      );
    }
    return data;
  },

  async actualizarPerfilOAuth(userId: string, datos: PerfilOAuthInput) {
    const { error } = await supabase.auth.updateUser({ data: extraerMetadata(datos) });
    if (error) throw error;

    if (datos.fotoPerfil) {
      subirFotoAvatar(datos.fotoPerfil, userId, datos.fotoBase64 || undefined).catch((err) =>
        console.warn("Aviso foto OAuth:", err)
      );
    }
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
    const { data } = await supabase.auth.getSession();
    return Boolean(data?.session);
  },

  async obtenerUsuarioActual() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  async cerrarSesion() {
    await supabase.auth.signOut();
  },

  async existeDni(dni: string): Promise<boolean> {
    try {
      const { data } = await supabase
        .from("usuarios")
        .select("id")
        .eq("dni", dni.trim())
        .maybeSingle();

      return Boolean(data);
    } catch {
      return false;
    }
  },

  async validarIdentidadDNI(dni: string) {
    const limpio = dni.trim();

    const yaRegistrado = await this.existeDni(limpio);
    if (yaRegistrado) {
      const err = new Error("DNI_YA_REGISTRADO");
      (err as any).code = "DNI_YA_REGISTRADO";
      throw err;
    }

    const guardado = cacheDni.get(limpio);
    if (guardado) {
      return { ...guardado };
    }

    const token = process.env.EXPO_PUBLIC_DNI_API_TOKEN?.trim();
    if (!token) {
      throw new Error("Servicio de validación no disponible temporalmente.");
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const res = await fetch("https://api.apiperu.dev/dni", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ dni: limpio }),
        signal: controller.signal,
      });

      const data = await res.json();
      if (!res.ok || !data?.success || !data?.data) {
        throw new Error("No se encontraron datos registrados para este DNI.");
      }

      const { nombres = "", apellido_paterno = "", apellido_materno = "" } = data.data;
      const resultado = {
        nombres: aTitulo(nombres.trim()),
        apellidos: aTitulo([apellido_paterno, apellido_materno].filter(Boolean).join(" ").trim()),
      };

      if (cacheDni.size >= 30) {
        const primerElemento = cacheDni.keys().next().value;
        if (primerElemento) {
          cacheDni.delete(primerElemento);
        }
      }
      cacheDni.set(limpio, resultado);

      return resultado;
    } catch (err: any) {
      if (err?.name === "AbortError") {
        throw new Error("La consulta de DNI tardó más de lo esperado. Verifica tu conexión a internet.");
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  },
};
