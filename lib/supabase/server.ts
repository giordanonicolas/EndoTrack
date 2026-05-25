/**
 * Cliente de Supabase para componentes del SERVIDOR (Server Components,
 * Server Actions y Route Handlers).
 *
 * Usá esta función en archivos que NO tienen "use client", o en
 * archivos api/ y actions/. Este cliente lee y escribe cookies de sesión
 * de forma segura en el servidor.
 */
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Si se llama desde un Server Component (no desde una Server Action),
            // Next.js no permite escribir cookies. Se puede ignorar este error
            // siempre que el middleware esté configurado para refrescar sesiones.
          }
        },
      },
    }
  );
}
