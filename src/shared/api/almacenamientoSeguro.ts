import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

const memory = new Map<string, string>();
const isSSR = typeof window === "undefined";
const isWeb = Platform.OS === "web";

function normalizarClave(clave: string): string {
  // SecureStore en Android e iOS restringe claves a caracteres alfanuméricos, '.', '-' y '_'
  return clave.replace(/[^a-zA-Z0-9._-]/g, "_");
}

/**
 * Almacenamiento seguro de tokens y credenciales de sesión.
 * Utiliza Keychain en iOS y Android Keystore mediante expo-secure-store en dispositivos móviles,
 * con fallback a AsyncStorage para entornos Web de desarrollo.
 */
class AlmacenamientoSeguro {
  async getItem(clave: string): Promise<string | null> {
    if (isSSR) {
      return memory.get(clave) ?? null;
    }
    if (isWeb) {
      return await AsyncStorage.getItem(clave);
    }
    try {
      const claveSegura = normalizarClave(clave);
      const valor = await SecureStore.getItemAsync(claveSegura);
      if (valor !== null) {
        return valor;
      }
      return await AsyncStorage.getItem(clave);
    } catch (error: unknown) {
      console.warn("Aviso al leer almacenamiento seguro:", error);
      return await AsyncStorage.getItem(clave);
    }
  }

  async setItem(clave: string, valor: string): Promise<void> {
    if (isSSR) {
      memory.set(clave, valor);
      return;
    }
    if (isWeb) {
      await AsyncStorage.setItem(clave, valor);
      return;
    }
    try {
      const claveSegura = normalizarClave(clave);
      await SecureStore.setItemAsync(claveSegura, valor, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED,
      });
    } catch (error: unknown) {
      console.warn("Aviso al guardar en almacenamiento seguro:", error);
      await AsyncStorage.setItem(clave, valor);
    }
  }

  async removeItem(clave: string): Promise<void> {
    if (isSSR) {
      memory.delete(clave);
      return;
    }
    if (isWeb) {
      await AsyncStorage.removeItem(clave);
      return;
    }
    try {
      const claveSegura = normalizarClave(clave);
      await SecureStore.deleteItemAsync(claveSegura);
    } catch (error: unknown) {
      console.warn("Aviso al remover de almacenamiento seguro:", error);
    }
    await AsyncStorage.removeItem(clave);
  }
}

export const almacenamientoSeguro = new AlmacenamientoSeguro();
