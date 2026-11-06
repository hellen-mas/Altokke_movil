/**
 * @fileoverview Adaptador de Enrutamiento Expo Router (Thin Export)
 *
 * MOTIVO ARQUITECTÓNICO:
 * Cumple con el principio de Screaming Architecture y desacoplamiento de capas:
 * 1. La capa de enrutamiento (`src/app/`) solo define la jerarquía de URLs
 *    del sistema de archivos y layouts sin albergar lógica de negocio ni estado.
 * 2. La implementación completa de la pantalla reside en su dominio natural
 *    (`@/features/finanzas/screens/metodos-pago`), permitiendo reutilizarla o
 *    migrar el motor de navegación sin tocar componentes de interfaz ni reglas de dominio.
 */

export { default } from "@/features/finanzas/screens/metodos-pago";
