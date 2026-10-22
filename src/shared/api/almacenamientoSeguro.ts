import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as aesjs from "aes-js";
import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";

const memoryStorage = new Map<string, string>();

// Guardo la sesion cifrada en AsyncStorage y su llave en SecureStore, porque SecureStore solo acepta valores pequeños (como 2 KB) y la sesion es mas grande
class AlmacenamientoSeguro {
  // Cifro el valor con una llave nueva y guardo esa llave en la caja fuerte
  private async cifrar(clave: string, valor: string) {
    const llave = Crypto.getRandomBytes(32);
    const cifrador = new aesjs.ModeOfOperation.ctr(llave, new aesjs.Counter(1));
    const bytesCifrados = cifrador.encrypt(aesjs.utils.utf8.toBytes(valor));

    await SecureStore.setItemAsync(clave, aesjs.utils.hex.fromBytes(llave));
    return aesjs.utils.hex.fromBytes(bytesCifrados);
  }

  // Saco la llave de la caja fuerte y descifro el valor
  private async descifrar(clave: string, valorCifrado: string) {
    const llaveHex = await SecureStore.getItemAsync(clave);
    if (!llaveHex) return null;

    const cifrador = new aesjs.ModeOfOperation.ctr(
      aesjs.utils.hex.toBytes(llaveHex),
      new aesjs.Counter(1)
    );
    const bytes = cifrador.decrypt(aesjs.utils.hex.toBytes(valorCifrado));
    return aesjs.utils.utf8.fromBytes(bytes);
  }

  async getItem(clave: string) {
    if (typeof window === "undefined") {
      return memoryStorage.get(clave) ?? null;
    }
    if (Platform.OS === "web") {
      return AsyncStorage.getItem(clave);
    }
    const valorCifrado = await AsyncStorage.getItem(clave);
    if (!valorCifrado) return null;
    return this.descifrar(clave, valorCifrado);
  }

  async setItem(clave: string, valor: string) {
    if (typeof window === "undefined") {
      memoryStorage.set(clave, valor);
      return;
    }
    if (Platform.OS === "web") {
      await AsyncStorage.setItem(clave, valor);
      return;
    }
    const valorCifrado = await this.cifrar(clave, valor);
    await AsyncStorage.setItem(clave, valorCifrado);
  }

  async removeItem(clave: string) {
    if (typeof window === "undefined") {
      memoryStorage.delete(clave);
      return;
    }
    if (Platform.OS === "web") {
      await AsyncStorage.removeItem(clave);
      return;
    }
    await AsyncStorage.removeItem(clave);
    await SecureStore.deleteItemAsync(clave);
  }
}

export const almacenamientoSeguro = new AlmacenamientoSeguro();