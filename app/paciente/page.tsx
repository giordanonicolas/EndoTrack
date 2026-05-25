/**
 * Dashboard del paciente.
 * Server Component: verifica la sesión y el rol EN EL SERVIDOR antes de renderizar.
 */
import { LogoutButton } from "@/app/components/LogoutButton";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function PacientePage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (!user || userError) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "paciente") redirect("/medico");

  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="w-full px-6 py-4 border-b border-rose-100 bg-white">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <span className="text-lg font-bold text-rose-700">EndoTrack</span>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500">{profile.display_name}</span>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Contenido */}
      <div className="flex-1 max-w-5xl mx-auto w-full px-6 py-10">
        {/* Bienvenida */}
        <div className="mb-8">
          <span className="inline-block rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700 mb-3">
            Paciente
          </span>
          <h1 className="text-3xl font-bold text-slate-800">
            Hola, {profile.display_name} 👋
          </h1>
          <p className="text-slate-500 mt-1">
            Este es tu espacio de seguimiento clínico en EndoTrack.
          </p>
        </div>

        {/* Tarjetas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">

          {/* ── Registrar síntomas — activo ── */}
          <Link
            href="/paciente/registrar-dolor"
            className="rounded-2xl bg-white border border-rose-200 shadow-sm p-6 flex flex-col gap-2 hover:shadow-md hover:border-rose-300 transition-all group"
          >
            <span className="text-2xl">📋</span>
            <h2 className="font-semibold text-slate-800 group-hover:text-rose-700 transition-colors">
              Registrar síntomas
            </h2>
            <p className="text-xs text-slate-500">
              Anotá un episodio de dolor para compartir con tu médico.
            </p>
          </Link>

          {/* ── Historial de síntomas — activo ── */}
          <Link
            href="/paciente/historial"
            className="rounded-2xl bg-white border border-rose-200 shadow-sm p-6 flex flex-col gap-2 hover:shadow-md hover:border-rose-300 transition-all group"
          >
            <span className="text-2xl">🗂️</span>
            <h2 className="font-semibold text-slate-800 group-hover:text-rose-700 transition-colors">
              Historial de síntomas
            </h2>
            <p className="text-xs text-slate-500">
              Revisá todos tus episodios registrados.
            </p>
          </Link>

          {/* ── Mis reportes — próximamente ── */}
          <div className="rounded-2xl bg-white border border-rose-100 shadow-sm p-6 flex flex-col gap-2 opacity-50 cursor-not-allowed">
            <span className="text-2xl">📄</span>
            <h2 className="font-semibold text-slate-700">Mis reportes</h2>
            <p className="text-xs text-slate-400">Próximamente</p>
          </div>

        </div>

        <p className="mt-10 text-xs text-slate-400 text-center">
          EndoTrack no realiza diagnósticos ni reemplaza la consulta médica.
        </p>
      </div>
    </main>
  );
}
