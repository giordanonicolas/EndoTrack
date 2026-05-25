/**
 * Pantalla de vínculos del médico.
 * Server Component: verifica sesión, carga invitaciones entrantes
 * y pasa los datos al componente cliente.
 */
import { VinculoActions } from "@/app/medico/vinculos/VinculoActions";
import { createClient } from "@/lib/supabase/server";
import type { LinkWithPatient, PatientDoctorLink } from "@/lib/types/link";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function VinculosPage() {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (!user || userError) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "medico") redirect("/paciente");

  // 1. Cargar vínculos donde el médico es destinatario
  const { data: rawLinks } = await supabase
    .from("patient_doctor_links")
    .select("*")
    .eq("doctor_id", user.id)
    .order("created_at", { ascending: false });

  const links = (rawLinks ?? []) as PatientDoctorLink[];

  // 2. Cargar perfiles de las pacientes
  const patientIds = links.map((l) => l.patient_id);
  let patientMap: Record<string, { id: string; display_name: string; email: string }> = {};

  if (patientIds.length > 0) {
    const { data: patients } = await supabase
      .from("profiles")
      .select("id, display_name, email")
      .in("id", patientIds);

    for (const p of patients ?? []) {
      patientMap[p.id] = p;
    }
  }

  // 3. Combinar
  const linksWithPatients: LinkWithPatient[] = links.map((l) => ({
    ...l,
    patient: patientMap[l.patient_id] ?? null,
  }));

  const pending  = linksWithPatients.filter((l) => l.status === "pending");
  const accepted = linksWithPatients.filter((l) => l.status === "accepted");
  const revoked  = linksWithPatients.filter((l) => l.status === "revoked");

  return (
    <main className="min-h-screen flex flex-col bg-slate-50">
      <header className="w-full px-6 py-4 border-b border-slate-200 bg-white">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href="/medico" className="text-sm text-slate-500 hover:text-violet-700 transition-colors">
            ← Volver al inicio
          </Link>
          <span className="text-base font-bold text-rose-700">EndoTrack</span>
        </div>
      </header>

      <div className="flex-1 max-w-2xl mx-auto w-full px-6 py-8 flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Mis pacientes</h1>
          <p className="text-sm text-slate-500 mt-1">
            Dr/a. {profile.display_name} — invitaciones recibidas de pacientes.
          </p>
        </div>

        <div className="flex gap-3 rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-xs text-violet-800">
          <span className="text-base leading-none mt-0.5">ℹ️</span>
          <p>
            Las pacientes te invitan voluntariamente. Solo verás sus registros
            cuando aceptes la invitación y la funcionalidad esté habilitada.
          </p>
        </div>

        <VinculoActions
          userId={user.id}
          pending={pending}
          accepted={accepted}
          revoked={revoked}
        />
      </div>
    </main>
  );
}
