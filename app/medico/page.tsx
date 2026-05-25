/**
 * Dashboard del médico / profesional de salud.
 * Server Component: verifica la sesión y el rol en el servidor.
 */
import { LogoutButton } from "@/app/components/LogoutButton";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function MedicoPage() {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (!user || userError) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "medico") redirect("/paciente");

  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="w-full px-6 py-4 border-b border-violet-100 bg-white">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <span className="text-lg font-bold text-rose-700">EndoTrack</span>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500">
              Dr/a. {profile.display_name}
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Contenido */}
      <div className="flex-1 max-w-5xl mx-auto w-full px-6 py-10">
        <div className="mb-8">
          <span className="inline-block rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700 mb-3">
            Profesional de salud
          </span>
          <h1 className="text-3xl font-bold text-slate-800">
            Bienvenido/a, Dr/a. {profile.display_name} 👨‍⚕️
          </h1>
          <p className="text-slate-500 mt-1">
            Desde aquí podrás revisar los reportes de tus pacientes.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">

          {/* ── Mis pacientes — activo ── */}
          <Link
            href="/medico/vinculos"
            className="rounded-2xl bg-white border border-violet-200 shadow-sm p-6 flex flex-col gap-2 hover:shadow-md hover:border-violet-300 transition-all group"
          >
            <span className="text-2xl">👥</span>
            <h2 className="font-semibold text-slate-800 group-hover:text-violet-700 transition-colors">
              Mis pacientes
            </h2>
            <p className="text-xs text-slate-500">
              Ver invitaciones y pacientes vinculadas.
            </p>
          </Link>

          {/* ── Reportes recibidos — próximamente ── */}
          <div className="rounded-2xl bg-white border border-violet-100 shadow-sm p-6 flex flex-col gap-2 opacity-50 cursor-not-allowed">
            <span className="text-2xl">📊</span>
            <h2 className="font-semibold text-slate-700">Reportes recibidos</h2>
            <p className="text-xs text-slate-400">Próximamente</p>
          </div>

          {/* ── Notas clínicas — próximamente ── */}
          <div className="rounded-2xl bg-white border border-violet-100 shadow-sm p-6 flex flex-col gap-2 opacity-50 cursor-not-allowed">
            <span className="text-2xl">📝</span>
            <h2 className="font-semibold text-slate-700">Notas clínicas</h2>
            <p className="text-xs text-slate-400">Próximamente</p>
          </div>

        </div>

        <p className="mt-10 text-xs text-slate-400 text-center">
          EndoTrack no reemplaza el criterio clínico del profesional de salud.
        </p>
      </div>
    </main>
  );
}
