import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as aesjs from "aes-js";
import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";

const memory = new Map<string, string>();
const isSSR = typeof window === "undefined";
const isWeb = Platform.OS === "web";

class AlmacenamientoSeguro {
  private async cifrar(clave: string, valor: string): Promise<string> {
    const llave = Crypto.getRandomBytes(32);
    const cifrador = new aesjs.ModeOfOperation.ctr(llave, new aesjs.Counter(1));
    await SecureStore.setItemAsync(clave, aesjs.utils.hex.fromBytes(llave));
    return aesjs.utils.hex.fromBytes(cifrador.encrypt(aesjs.utils.utf8.toBytes(valor)));
  }

  private async descifrar(clave: string, valorCifrado: string): Promise<string | null> {
    const llaveHex = await SecureStore.getItemAsync(clave);
    if (!llaveHex) return null;
    const cifrador = new aesjs.ModeOfOperation.ctr(
      aesjs.utils.hex.toBytes(llaveHex),
      new aesjs.Counter(1)
    );
    return aesjs.utils.utf8.fromBytes(cifrador.decrypt(aesjs.utils.hex.toBytes(valorCifrado)));
  }

  async getItem(clave: string): Promise<string | null> {
    if (isSSR) {
      return memory.get(clave) ?? null;
    }
    if (isWeb) {
      return await AsyncStorage.getItem(clave);
    }
    const cifrado = await AsyncStorage.getItem(clave);
    if (!cifrado) {
      return null;
    }
    return await this.descifrar(clave, cifrado);
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
    const cifrado = await this.cifrar(clave, valor);
    await AsyncStorage.setItem(clave, cifrado);
  }

  async removeItem(clave: string): Promise<void> {
    if (isSSR) {
      memory.delete(clave);
      return;
    }
    await AsyncStorage.removeItem(clave);
    if (!isWeb) {
      await SecureStore.deleteItemAsync(clave);
    }
  }
}

export const almacenamientoSeguro = new AlmacenamientoSeguro();