/**
 * Cliente de Supabase para componentes del NAVEGADOR (Client Components).
 *
 * Usá esta función en componentes que tienen "use client" al inicio,
 * por ejemplo: formularios interactivos, botones de login, etc.
 */
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
