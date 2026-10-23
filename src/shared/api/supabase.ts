import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';
import type { Database } from '@/shared/types/database.types';
import { almacenamientoSeguro } from '@/shared/api/almacenamientoSeguro';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.EXPO_PUBLIC_SUPABASE_KEY ||
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Faltan las credenciales de Supabase. Revisa tu archivo .env"
  );
}

// Inicializo el cliente de Supabase guardando la sesion en el almacenamiento seguro (AsyncStorage + SecureStore) para que la sesion persista entre reinicios de la app
export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    storage: almacenamientoSeguro,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Tipos de entidades para uso transversal en la aplicación
export type UsuarioFila = Database['public']['Tables']['usuarios']['Row'];
export type UsuarioInsertar = Database['public']['Tables']['usuarios']['Insert'];
export type UsuarioActualizar = Database['public']['Tables']['usuarios']['Update'];
export type { Database };
