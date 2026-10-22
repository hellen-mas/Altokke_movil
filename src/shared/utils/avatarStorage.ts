import { storageService } from "@/shared/utils/storageService";

export async function subirAvatar(usuarioId: string, fotoUri: string): Promise<string> {
  const ruta = `${usuarioId}/perfil-${Date.now()}.jpg`;
  await storageService.subirArchivo("avatars", ruta, fotoUri, {
    anchoMaximo: 800,
    calidad: 0.8,
  });
  return storageService.obtenerUrlPublica("avatars", ruta);
}
