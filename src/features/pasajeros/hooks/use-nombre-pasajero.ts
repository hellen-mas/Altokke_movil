import { supabase } from "@/shared/api/supabase";
import { useEffect, useState } from "react";

// "DONINA GARRO" -> "Donina" (la API de DNI devuelve los nombres en mayúsculas)
function primerNombre(nombreCompleto: string) {
  const primero = nombreCompleto.trim().split(" ")[0];
  return primero.charAt(0).toUpperCase() + primero.slice(1).toLowerCase();
}

/**
 * Primer nombre del pasajero que inició sesión.
 * Se lee de la sesión de Supabase, donde el registro guardó el nombre.
 * Devuelve "" mientras carga o si la cuenta no tiene nombre.
 */
export function useNombrePasajero() {
  const [nombre, setNombre] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const datos = session?.user.user_metadata;
      // "nombre" lo guarda nuestro registro; "full_name" lo trae Google
      const nombreCompleto = datos?.nombre || datos?.full_name || "";
      if (nombreCompleto) setNombre(primerNombre(nombreCompleto));
    });
  }, []);

  return nombre;
}
