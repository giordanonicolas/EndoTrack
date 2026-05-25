/**
 * Middleware de Next.js.
 *
 * Por ahora es un pass-through: deja pasar todas las peticiones sin modificar.
 *
 * Cuando implementemos autenticación, vamos a activar aquí:
 * - Refresco automático del token de sesión de Supabase
 * - Protección de rutas (redirigir al login si no hay sesión)
 */
import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
