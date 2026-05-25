/**
 * Dashboard del médico / profesional de salud.
 * Server Component: verifica la sesión y el rol EN EL SERVIDOR antes de renderizar.
 *
 * Protecciones:
 * - Sin sesión → redirige a /login
 * - Sesión con role = 'paciente' → redirige a /paciente
 * - Solo accede alguien con role = 'medico'
 */
import { LogoutButton } from "@/app/components/LogoutButton";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function MedicoPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (!user || userError) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("display_name, role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    redirect("/login");
  }

  // Si el usuario es paciente, redirigir a su dashboard
  if (profile.role !== "medico") {
    redirect("/paciente");
  }

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
        {/* Bienvenida */}
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

        {/* Tarjetas — próximamente */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[
            {
              icon: "👥",
              title: "Mis pacientes",
              desc: "Próximamente",
            },
            {
              icon: "📊",
              title: "Reportes recibidos",
              desc: "Próximamente",
            },
            {
              icon: "📝",
              title: "Notas clínicas",
              desc: "Próximamente",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl bg-white border border-violet-100 shadow-sm p-6 flex flex-col gap-2 opacity-60"
            >
              <span className="text-2xl">{item.icon}</span>
              <h2 className="font-semibold text-slate-700">{item.title}</h2>
              <p className="text-xs text-slate-400">{item.desc}</p>
            </div>
          ))}
        </div>

        <p className="mt-10 text-xs text-slate-400 text-center">
          EndoTrack no reemplaza el criterio clínico del profesional de salud.
        </p>
      </div>
    </main>
  );
}
