/**
 * Pantalla de vinculación paciente → médico.
 * Server Component: verifica sesión, carga vínculos existentes
 * y pasa los datos al componente cliente.
 */
import { VincularActions } from "@/app/paciente/vincular/VincularActions";
import { createClient } from "@/lib/supabase/server";
import type { LinkWithDoctor, PatientDoctorLink } from "@/lib/types/link";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function VincularPage() {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (!user || userError) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "paciente") redirect("/login");

  // 1. Cargar vínculos de la paciente
  const { data: rawLinks } = await supabase
    .from("patient_doctor_links")
    .select("*")
    .eq("patient_id", user.id)
    .order("created_at", { ascending: false });

  const links = (rawLinks ?? []) as PatientDoctorLink[];

  // 2. Cargar perfiles de los médicos vinculados (query separada)
  const doctorIds = links.map((l) => l.doctor_id);
  let doctorMap: Record<string, { id: string; display_name: string; email: string }> = {};

  if (doctorIds.length > 0) {
    const { data: doctors } = await supabase
      .from("profiles")
      .select("id, display_name, email")
      .in("id", doctorIds);

    for (const d of doctors ?? []) {
      doctorMap[d.id] = d;
    }
  }

  // 3. Combinar vínculos con datos del médico
  const linksWithDoctors: LinkWithDoctor[] = links.map((l) => ({
    ...l,
    doctor: doctorMap[l.doctor_id] ?? null,
  }));

  return (
    <main className="min-h-screen flex flex-col bg-rose-50">
      <header className="w-full px-6 py-4 border-b border-rose-100 bg-white">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href="/paciente" className="text-sm text-slate-500 hover:text-rose-700 transition-colors">
            ← Volver al inicio
          </Link>
          <span className="text-base font-bold text-rose-700">EndoTrack</span>
        </div>
      </header>

      <div className="flex-1 max-w-2xl mx-auto w-full px-6 py-8 flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Mis médicos</h1>
          <p className="text-sm text-slate-500 mt-1">
            Invitá a un profesional de salud para que pueda ver tus reportes.
          </p>
        </div>

        <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
          <span className="text-base leading-none mt-0.5">⚠️</span>
          <p>
            Solo los profesionales que vos invités y que acepten la invitación
            podrán ver tus registros. Podés revocar el acceso en cualquier momento.
          </p>
        </div>

        <VincularActions userId={user.id} initialLinks={linksWithDoctors} />
      </div>
    </main>
  );
}
