/**
 * Página de registro de episodio de dolor.
 * Server Component: verifica sesión y rol antes de mostrar el formulario.
 *
 * Seguridad:
 * - Sin sesión → /login
 * - Sesión con role != 'paciente' → /login
 * - El userId verificado se pasa como prop al formulario (Client Component)
 */
import { PainForm } from "@/app/paciente/registrar-dolor/PainForm";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function RegistrarDolorPage() {
  const supabase = await createClient();

  // Verificación de sesión con el servidor de Supabase (más seguro que getSession)
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (!user || userError) redirect("/login");

  // Verificación de rol
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, display_name")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "paciente") redirect("/login");

  return (
    <main className="min-h-screen flex flex-col bg-rose-50">
      {/* Header */}
      <header className="w-full px-6 py-4 border-b border-rose-100 bg-white">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link
            href="/paciente"
            className="text-sm text-slate-500 hover:text-rose-700 transition-colors flex items-center gap-1"
          >
            ← Volver al inicio
          </Link>
          <span className="text-base font-bold text-rose-700">EndoTrack</span>
        </div>
      </header>

      {/* Contenido */}
      <div className="flex-1 max-w-2xl mx-auto w-full px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">
            Registrar episodio de dolor
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Hola, {profile.display_name}. Completá los campos que recuerdes.
          </p>
        </div>

        {/* Aviso clínico */}
        <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800 mb-6">
          <span className="text-base leading-none mt-0.5">⚠️</span>
          <p>
            EndoTrack no realiza diagnósticos ni recomienda tratamientos. Este
            registro es solo para ayudarte a comunicar mejor tu experiencia con
            tu equipo de salud.
          </p>
        </div>

        {/* Formulario — Client Component */}
        {/* userId viene verificado del servidor, nunca del navegador */}
        <PainForm userId={user.id} />
      </div>
    </main>
  );
}
