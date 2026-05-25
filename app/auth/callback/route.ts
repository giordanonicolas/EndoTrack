/**
 * Ruta de callback de Supabase Auth.
 * Se usa cuando la confirmación de email está ACTIVADA:
 * Supabase redirige al usuario aquí con un código, y este handler
 * lo intercambia por una sesión válida.
 *
 * Con confirmación de email desactivada (modo desarrollo) esta ruta
 * no se usa, pero conviene tenerla lista para cuando se active en producción.
 */
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    await supabase.auth.exchangeCodeForSession(code);
  }

  // Después de confirmar el email, mandamos al login para que ingrese
  return NextResponse.redirect(`${origin}/login`);
}
