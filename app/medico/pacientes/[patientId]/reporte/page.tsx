/**
 * Reporte clínico de una paciente — vista del médico.
 * Server Component con ruta dinámica: /medico/pacientes/[patientId]/reporte
 *
 * Seguridad (capas en orden):
 *  1. Verificación de sesión activa con getUser()
 *  2. Verificación de rol = 'medico' en profiles
 *  3. Verificación de vínculo accepted en patient_doctor_links
 *     → Si no existe: pantalla de acceso denegado, sin datos
 *  4. Filtro explícito .eq("patient_id", patientId) en la consulta
 *  5. RLS en pain_records como segunda capa automática
 *
 * EndoTrack no diagnostica ni interpreta clínicamente.
 * Solo organiza información ingresada por la paciente.
 */
import { createClient } from "@/lib/supabase/server";
import type { PainRecord } from "@/lib/types/pain";
import Link from "next/link";
import { redirect } from "next/navigation";

// ─── Helpers de cálculo ────────────────────────────────────────

function frecuencia(items: string[], top = 3): { valor: string; count: number }[] {
  const mapa: Record<string, number> = {};
  for (const item of items) {
    if (item) mapa[item] = (mapa[item] ?? 0) + 1;
  }
  return Object.entries(mapa)
    .map(([valor, count]) => ({ valor, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, top);
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

// ─── Sub-componentes ────────────────────────────────────────────

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-white border border-violet-100 shadow-sm p-6 flex flex-col gap-3">
      <h2 className="font-semibold text-slate-700 text-base">{title}</h2>
      {children}
    </section>
  );
}

function FreqRow({ valor, count, total }: { valor: string; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-slate-700">{valor}</span>
          <span className="text-slate-400 text-xs">
            {count} {count === 1 ? "vez" : "veces"} · {pct}%
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-violet-100">
          <div
            className="h-1.5 rounded-full bg-violet-400"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Página ────────────────────────────────────────────────────

export default async function MedicoReportePage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const { patientId } = await params;
  const supabase = await createClient();

  // ── 1. Verificación de sesión ──────────────────────────────
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (!user || userError) redirect("/login");

  // ── 2. Verificación de rol ─────────────────────────────────
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "medico") redirect("/paciente");

  // ── 3. Verificación de vínculo accepted ────────────────────
  //    Ambas condiciones deben cumplirse: doctor_id = usuario actual
  //    Y patient_id = patientId de la URL Y status = accepted
  const { data: link } = await supabase
    .from("patient_doctor_links")
    .select("id")
    .eq("doctor_id", user.id)
    .eq("patient_id", patientId)
    .eq("status", "accepted")
    .maybeSingle();

  // Si no hay vínculo accepted → pantalla de acceso denegado
  if (!link) {
    return (
      <main className="min-h-screen flex flex-col bg-slate-50">
        <header className="w-full px-6 py-4 border-b border-slate-200 bg-white">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <Link
              href="/medico/vinculos"
              className="text-sm text-slate-500 hover:text-violet-700 transition-colors"
            >
              ← Volver a mis pacientes
            </Link>
            <span className="text-base font-bold text-violet-700">EndoTrack</span>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="rounded-2xl bg-white border border-red-100 shadow-sm p-10 flex flex-col items-center gap-4 text-center max-w-md">
            <span className="text-4xl">🔒</span>
            <h1 className="text-xl font-bold text-slate-800">Acceso denegado</h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              No tenés autorización para ver el reporte de esta paciente.
            </p>
            <p className="text-xs text-slate-400 leading-relaxed">
              Solo podés acceder a reportes de pacientes con quienes tenés un vínculo activo y aceptado.
            </p>
            <Link
              href="/medico/vinculos"
              className="mt-2 rounded-full bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 transition-colors"
            >
              Ver mis pacientes vinculadas
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // ── 4. Perfil de la paciente ───────────────────────────────
  const { data: patientProfile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", patientId)
    .maybeSingle();

  const patientName = patientProfile?.display_name ?? "Paciente";

  // ── 5. Consulta de registros — filtro explícito + RLS ──────
  const { data: rawRecords } = await supabase
    .from("pain_records")
    .select("*")
    .eq("patient_id", patientId)   // defensa en profundidad
    .order("pain_date", { ascending: false })
    .order("created_at", { ascending: false });

  const records = (rawRecords ?? []) as PainRecord[];
  const total = records.length;

  // ── Cálculos del reporte ───────────────────────────────────

  const fechaMasReciente = total > 0 ? records[0].pain_date : null;
  const fechaMasAntigua  = total > 0 ? records[total - 1].pain_date : null;

  const intensidadPromedio =
    total > 0
      ? round1(records.reduce((s, r) => s + r.intensity, 0) / total)
      : null;

  const intensidadMaxima =
    total > 0 ? Math.max(...records.map((r) => r.intensity)) : null;

  const zonasFrec    = frecuencia(records.map((r) => r.body_zone));
  const tiposFrec    = frecuencia(records.map((r) => r.pain_type));
  const factoresFrec = frecuencia(records.flatMap((r) => r.associated_with ?? []));
  const impactosFrec = frecuencia(
    records.map((r) => r.impact ?? "").filter(Boolean)
  );

  const descripcionesConfirmadas = records.filter((r) => r.confirmed_summary);

  // ── Render ─────────────────────────────────────────────────

  return (
    <main className="min-h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <header className="w-full px-6 py-4 border-b border-slate-200 bg-white">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link
            href="/medico/vinculos"
            className="text-sm text-slate-500 hover:text-violet-700 transition-colors"
          >
            ← Volver a mis pacientes
          </Link>
          <span className="text-base font-bold text-violet-700">EndoTrack</span>
        </div>
      </header>

      <div className="flex-1 max-w-2xl mx-auto w-full px-6 py-8 flex flex-col gap-6">

        {/* Título */}
        <div>
          <p className="text-xs font-semibold text-violet-600 uppercase tracking-wide mb-1">
            Reporte clínico · Vista médico
          </p>
          <h1 className="text-2xl font-bold text-slate-800">
            {patientName}
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Información registrada por la paciente
          </p>
        </div>

        {/* Aviso clínico */}
        <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
          <span className="text-base leading-none mt-0.5">⚠️</span>
          <p>
            Este reporte organiza información ingresada por la paciente y debe
            ser interpretado por un profesional de salud. No constituye
            diagnóstico médico.
          </p>
        </div>

        {/* Estado vacío */}
        {total === 0 ? (
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-10 flex flex-col items-center gap-4 text-center">
            <span className="text-4xl">📄</span>
            <p className="text-slate-600 font-medium">
              Esta paciente todavía no tiene registros cargados.
            </p>
            <p className="text-sm text-slate-400 max-w-xs">
              Cuando la paciente registre episodios de dolor, el reporte aparecerá aquí.
            </p>
          </div>
        ) : (
          <>
            {/* ── Resumen general ── */}
            <SectionCard title="Resumen general">
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-xs text-slate-400 uppercase tracking-wide font-medium">
                    Total de registros
                  </dt>
                  <dd className="text-2xl font-bold text-slate-800 mt-0.5">
                    {total}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs text-slate-400 uppercase tracking-wide font-medium">
                    Intensidad promedio
                  </dt>
                  <dd className="text-2xl font-bold text-slate-800 mt-0.5">
                    {intensidadPromedio}/10
                  </dd>
                </div>

                <div>
                  <dt className="text-xs text-slate-400 uppercase tracking-wide font-medium">
                    Intensidad máxima
                  </dt>
                  <dd className="text-2xl font-bold text-red-600 mt-0.5">
                    {intensidadMaxima}/10
                  </dd>
                </div>

                <div>
                  <dt className="text-xs text-slate-400 uppercase tracking-wide font-medium">
                    Rango de fechas
                  </dt>
                  <dd className="text-sm font-semibold text-slate-700 mt-0.5 leading-snug">
                    {fechaMasAntigua && fechaMasReciente
                      ? fechaMasAntigua === fechaMasReciente
                        ? formatDate(fechaMasReciente)
                        : `${formatDate(fechaMasAntigua)} — ${formatDate(fechaMasReciente)}`
                      : "—"}
                  </dd>
                </div>
              </dl>
            </SectionCard>

            {/* ── Zonas del cuerpo ── */}
            {zonasFrec.length > 0 && (
              <SectionCard title="Zonas del cuerpo más frecuentes">
                <div className="flex flex-col gap-3">
                  {zonasFrec.map(({ valor, count }) => (
                    <FreqRow key={valor} valor={valor} count={count} total={total} />
                  ))}
                </div>
              </SectionCard>
            )}

            {/* ── Tipos de dolor ── */}
            {tiposFrec.length > 0 && (
              <SectionCard title="Tipos de dolor más frecuentes">
                <div className="flex flex-col gap-3">
                  {tiposFrec.map(({ valor, count }) => (
                    <FreqRow key={valor} valor={valor} count={count} total={total} />
                  ))}
                </div>
              </SectionCard>
            )}

            {/* ── Factores asociados ── */}
            {factoresFrec.length > 0 && (
              <SectionCard title="Factores asociados más frecuentes">
                <div className="flex flex-col gap-3">
                  {factoresFrec.map(({ valor, count }) => (
                    <FreqRow
                      key={valor}
                      valor={valor}
                      count={count}
                      total={total}
                    />
                  ))}
                </div>
              </SectionCard>
            )}

            {/* ── Impacto ── */}
            {impactosFrec.length > 0 && (
              <SectionCard title="Impacto en actividades diarias">
                <div className="flex flex-col gap-3">
                  {impactosFrec.map(({ valor, count }) => (
                    <FreqRow key={valor} valor={valor} count={count} total={total} />
                  ))}
                </div>
              </SectionCard>
            )}

            {/* ── Descripciones confirmadas ── */}
            {descripcionesConfirmadas.length > 0 && (
              <SectionCard title="Descripciones confirmadas por la paciente">
                <p className="text-xs text-slate-400">
                  Texto revisado y confirmado por la paciente para compartir
                  con el profesional de salud.
                </p>
                <div className="flex flex-col gap-4 mt-1">
                  {descripcionesConfirmadas.map((r) => (
                    <div
                      key={r.id}
                      className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-4 flex flex-col gap-2"
                    >
                      <p className="text-xs font-semibold text-violet-600 uppercase tracking-wide">
                        {formatDate(r.pain_date)}
                      </p>
                      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {r.confirmed_summary}
                      </p>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}
          </>
        )}

        <p className="text-xs text-slate-400 text-center pb-4">
          Este reporte solo es visible para médicos con vínculo activo y aceptado por la paciente.
        </p>
      </div>
    </main>
  );
}
