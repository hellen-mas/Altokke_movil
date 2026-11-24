// Ambient type declarations for Supabase Edge Functions (Deno Runtime)

declare namespace Deno {
  export interface Env {
    get(key: string): string | undefined;
    set(key: string, value: string): void;
    delete(key: string): void;
    has(key: string): boolean;
    toObject(): Record<string, string>;
  }
  export const env: Env;
  export function serve(
    handler: (req: Request) => Promise<Response> | Response
  ): void;
}

declare module "jsr:@supabase/functions-js/edge-runtime.d.ts" {
  // Edge runtime type definitions
}

declare module "npm:@supabase/supabase-js@2" {
  export * from "@supabase/supabase-js";
}

declare module "npm:@supabase/supabase-js@^2" {
  export * from "@supabase/supabase-js";
}

declare module "https://esm.sh/@supabase/supabase-js*" {
  export * from "@supabase/supabase-js";
}
