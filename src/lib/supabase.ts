import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';
import type { Database } from '@/types/database.types';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_KEY || "placeholder_key";

// Inicializo el cliente de Supabase guardando la sesion en el almacenamiento local
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
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
