/**
 * Historial de síntomas de la paciente.
 * Server Component: consulta pain_records en el servidor con el token
 * de la paciente autenticada. RLS garantiza que solo ve sus propios registros.
 *
 * EndoTrack no diagnostica ni interpreta clínicamente estos datos.
 * Solo muestra información ingresada por la propia paciente.
 */
import { createClient } from "@/lib/supabase/server";
import type { PainRecord } from "@/lib/types/pain";
import Link from "next/link";
import { redirect } from "next/navigation";

// ─── Helpers de presentación ───────────────────────────────────

function formatDate(dateStr: string): string {
  // pain_date viene como "YYYY-MM-DD"
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

function intensityLabel(value: number): string {
  if (value <= 2) return "Leve";
  if (value <= 4) return "Moderado-bajo";
  if (value <= 6) return "Moderado";
  if (value <= 8) return "Intenso";
  return "Muy intenso";
}

function intensityStyle(value: number): string {
  if (value <= 3) return "bg-emerald-100 text-emerald-700";
  if (value <= 6) return "bg-amber-100 text-amber-700";
  return "bg-red-100 text-red-700";
}

// ─── Componente de tarjeta ─────────────────────────────────────

function PainCard({ record }: { record: PainRecord }) {
  return (
    <article className="rounded-2xl bg-white border border-rose-100 shadow-sm p-6 flex flex-col gap-4">

      {/* Encabezado: fecha + intensidad */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">
            Episodio registrado
          </p>
          <p className="text-lg font-bold text-slate-800 mt-0.5">
            {formatDate(record.pain_date)}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-sm font-semibold whitespace-nowrap ${intensityStyle(record.intensity)}`}
        >
          {record.intensity}/10 — {intensityLabel(record.intensity)}
        </span>
      </div>

      {/* Campos principales */}
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">

        <div>
          <dt className="text-xs font-medium text-slate-400 uppercase tracking-wide">
            Zona del cuerpo
          </dt>
          <dd className="text-slate-700 mt-0.5">
            {record.body_zone}
            {record.pain_side ? ` · ${record.pain_side}` : ""}
          </dd>
        </div>

        <div>
          <dt className="text-xs font-medium text-slate-400 uppercase tracking-wide">
            Tipo de dolor
          </dt>
          <dd className="text-slate-700 mt-0.5">{record.pain_type}</dd>
        </div>

        {record.pattern && (
          <div>
            <dt className="text-xs font-medium text-slate-400 uppercase tracking-wide">
              Patrón
            </dt>
            <dd className="text-slate-700 mt-0.5">{record.pattern}</dd>
          </div>
        )}

        {record.duration && (
          <div>
            <dt className="text-xs font-medium text-slate-400 uppercase tracking-wide">
              Duración
            </dt>
            <dd className="text-slate-700 mt-0.5">{record.duration}</dd>
          </div>
        )}

        {record.impact && (
          <div className="sm:col-span-2">
            <dt className="text-xs font-medium text-slate-400 uppercase tracking-wide">
              Impacto en el día
            </dt>
            <dd className="text-slate-700 mt-0.5">{record.impact}</dd>
          </div>
        )}

        {record.medication_taken && (
          <div className="sm:col-span-2">
            <dt className="text-xs font-medium text-slate-400 uppercase tracking-wide">
              Medicación tomada
            </dt>
            <dd className="text-slate-700 mt-0.5">{record.medication_taken}</dd>
          </div>
        )}
      </dl>

      {/* Factores asociados */}
      {record.associated_with && record.associated_with.length > 0 && (
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">
            Asociado a
          </p>
          <div className="flex flex-wrap gap-2">
            {record.associated_with.map((factor) => (
              <span
                key={factor}
                className="rounded-full bg-rose-50 border border-rose-100 px-3 py-1 text-xs text-rose-700"
              >
                {factor}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Notas personales */}
      {record.patient_free_text && (
        <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">
            Notas personales
          </p>
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
            {record.patient_free_text}
          </p>
        </div>
      )}

      {/* Timestamp discreto */}
      <p className="text-xs text-slate-300 text-right">
        Guardado el {new Date(record.created_at).toLocaleDateString("es-AR")}
      </p>
    </article>
  );
}

// ─── Página principal ──────────────────────────────────────────

export default async function HistorialPage() {
  const supabase = await createClient();

  // Verificación de sesión en el servidor
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (!user || userError) redirect("/login");

  // Verificación de rol
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "paciente") redirect("/medico");

  // Consulta de registros — RLS filtra automáticamente por patient_id = user.id
  const { data: records, error: recordsError } = await supabase
    .from("pain_records")
    .select("*")
    .eq("patient_id", user.id)
    .order("pain_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (recordsError) {
    console.warn("[EndoTrack] Error al cargar historial:", recordsError.message);
  }

  const painRecords = (records ?? []) as PainRecord[];

  return (
    <main className="min-h-screen flex flex-col bg-rose-50">
      {/* Header */}
      <header className="w-full px-6 py-4 border-b border-rose-100 bg-white">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link
            href="/paciente"
            className="text-sm text-slate-500 hover:text-rose-700 transition-colors"
          >
            ← Volver al inicio
          </Link>
          <span className="text-base font-bold text-rose-700">EndoTrack</span>
        </div>
      </header>

      {/* Contenido */}
      <div className="flex-1 max-w-2xl mx-auto w-full px-6 py-8">

        {/* Título + acción */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Historial de síntomas
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {painRecords.length === 0
                ? "Todavía no registraste síntomas."
                : `${painRecords.length} ${painRecords.length === 1 ? "registro" : "registros"} guardado${painRecords.length === 1 ? "" : "s"}.`}
            </p>
          </div>
          <Link
            href="/paciente/registrar-dolor"
            className="shrink-0 rounded-full bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 transition-colors"
          >
            + Nuevo registro
          </Link>
        </div>

        {/* Aviso clínico */}
        <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800 mb-6">
          <span className="text-base leading-none mt-0.5">⚠️</span>
          <p>
            Esta información fue ingresada por vos. EndoTrack no realiza
            diagnósticos ni interpreta clínicamente estos registros.
          </p>
        </div>

        {/* Lista de registros o estado vacío */}
        {painRecords.length === 0 ? (
          <div className="rounded-2xl bg-white border border-rose-100 shadow-sm p-10 flex flex-col items-center gap-4 text-center">
            <span className="text-4xl">📋</span>
            <p className="text-slate-600 font-medium">
              Todavía no registraste síntomas.
            </p>
            <p className="text-sm text-slate-400 max-w-xs">
              Cuando registres un episodio de dolor, aparecerá aquí para que
              puedas compartirlo con tu equipo de salud.
            </p>
            <Link
              href="/paciente/registrar-dolor"
              className="mt-2 rounded-full bg-rose-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 transition-colors"
            >
              Registrar mi primer síntoma
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {painRecords.map((record) => (
              <PainCard key={record.id} record={record} />
            ))}
          </div>
        )}

        <p className="mt-8 text-xs text-slate-400 text-center">
          Solo vos podés ver estos registros. EndoTrack no comparte tu
          información sin tu consentimiento.
        </p>
      </div>
    </main>
  );
}
