import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/features/autenticacion/context/AuthContext";
import {
  conductorService,
  cachePerfilConductor,
  type PerfilConductor,
  type DatosVehiculo,
} from "@/features/conductores/services/conductorService";

export function usePerfilConductor() {
  const { user, userId } = useAuth();

  const [perfil, setPerfil] = useState<PerfilConductor>(() => {
    if (userId && cachePerfilConductor.has(userId)) {
      return cachePerfilConductor.get(userId)!;
    }

    const meta = user?.user_metadata || {};
    const nombre = (meta.nombre || "").trim();
    const apellidos = (meta.apellidos || "").trim();
    const nombreCompleto =
      `${nombre} ${apellidos}`.trim() ||
      user?.email?.split("@")[0] ||
      "Conductor Altokke";

    return {
      id: userId || "conductor-local",
      nombre: nombreCompleto,
      apellidos,
      nombreCompleto,
      correo: user?.email || "",
      telefono: user?.phone || meta.telefono || "",
      dni: meta.dni || "",
      fechaNacimiento: meta.fechaNacimiento || "No especificada",
      ciudad: "Bagua, Amazonas",
      foto: meta.avatar_url || meta.foto_url || null,
      calificacion: 5.0,
      viajes: 0,
      estado: "Conductor activo",
      enLinea: false,
      saldoBilletera: 0,
      vehiculo: {
        placa: "M1-ALTO",
        marca: "Honda",
        modelo: "150",
        anio: 2026,
        color: "Negro",
        capacidad: 3,
      },
      contactoEmergencia: {
        nombre: "Central Altokke",
        parentesco: "Soporte",
        telefono: "+51 987 654 321",
      },
      documentos: {
        dni: { estado: "VERIFICADO" },
        licencia: { estado: "VERIFICADO" },
        soat: { estado: "VERIFICADO" },
        tarjetaPropiedad: { estado: "VERIFICADO" },
        antecedentesPenales: { estado: "VERIFICADO" },
      },
      seguridad: {
        identidadVerificada: true,
        contactoEmergenciaConfigurado: true,
        compartirViaje: true,
      },
    };
  });

  const [cargando, setCargando] = useState(false);

  const cargar = useCallback(async () => {
    if (!userId) return;
    setCargando(true);
    try {
      const datos = await conductorService.obtenerPerfilConductor(userId);
      if (datos) {
        setPerfil(datos);
      }
    } catch (err) {
      console.warn("Aviso al sincronizar perfil del conductor:", err);
    } finally {
      setCargando(false);
    }
  }, [userId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const actualizarPerfil = async (datos: {
    nombre?: string;
    apellidos?: string;
    telefono?: string;
    fotoUrl?: string | null;
    enLinea?: boolean;
  }) => {
    if (!userId) return;
    await conductorService.actualizarPerfilConductor(userId, datos);
    await cargar();
  };

  const actualizarVehiculo = async (datos: DatosVehiculo) => {
    if (!userId) return;
    await conductorService.registrarVehiculo(userId, datos);
    await cargar();
  };

  return {
    perfil,
    cargando,
    recargar: cargar,
    actualizarPerfil,
    actualizarVehiculo,
  };
}
