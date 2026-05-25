/**
 * Formulario de registro de episodio de dolor.
 * Client Component: maneja estado, validación, generación de descripción
 * e inserción en Supabase.
 *
 * Seguridad:
 * - patient_id NUNCA viene del formulario — siempre de auth.getUser()
 * - Se verifica user.id antes de insertar
 *
 * Descripción asistida:
 * - generateSummary() construye un texto desde los campos del formulario
 * - No usa IA ni servicios externos
 * - La paciente puede editar el texto antes de guardar
 * - generated_summary = texto original generado
 * - confirmed_summary = texto final editado/confirmado por la paciente
 * - Si no se genera descripción, ambos quedan en null
 *
 * EndoTrack no diagnostica ni recomienda tratamientos.
 */
"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useState } from "react";

// ─── Opciones de los campos ───────────────────────────────────

const BODY_ZONES = [
  "Pelvis / abdomen bajo",
  "Abdomen medio",
  "Abdomen alto",
  "Zona lumbar / espalda baja",
  "Piernas",
  "Otro",
];

const PAIN_SIDES = ["Izquierdo", "Derecho", "Central", "Ambos lados"];

const PAIN_TYPES = [
  "Cólico",
  "Punzante",
  "Presión / peso",
  "Quemazón",
  "Sordo / constante",
  "Otro",
];

const PATTERNS = [
  "Constante",
  "Intermitente",
  "Al movimiento",
  "En reposo",
  "Variable",
];

const DURATIONS = [
  "Menos de 30 minutos",
  "30 minutos a 1 hora",
  "1 a 4 horas",
  "Más de 4 horas",
  "Todo el día",
];

const ASSOCIATED_OPTIONS = [
  "Menstruación",
  "Días previos a la menstruación",
  "Relaciones sexuales",
  "Al orinar",
  "Al defecar",
  "Actividad física",
  "Sin relación aparente",
];

const IMPACTS = [
  "Pude hacer mis actividades normales",
  "Reducción parcial de actividades",
  "No pude hacer mis actividades habituales",
  "Tuve que guardar cama",
];

// ─── Helpers ─────────────────────────────────────────────────

function today(): string {
  return new Date().toISOString().split("T")[0];
}

function intensityColor(value: number): string {
  if (value <= 3) return "text-emerald-600";
  if (value <= 6) return "text-amber-500";
  return "text-red-600";
}

/**
 * Construye el texto de descripción a partir de los campos del formulario.
 * No usa IA ni servicios externos. Solo ordena la información que la paciente
 * ya ingresó en un formato legible para el profesional de salud.
 */
function buildSummary({
  bodyZone,
  painSide,
  intensity,
  painType,
  pattern,
  duration,
  associatedWith,
  impact,
  medicationTaken,
  patientFreeText,
}: {
  bodyZone: string;
  painSide: string;
  intensity: number;
  painType: string;
  pattern: string;
  duration: string;
  associatedWith: string[];
  impact: string;
  medicationTaken: string;
  patientFreeText: string;
}): string {
  let text = `Refiero dolor en ${bodyZone}`;

  if (painSide) text += `, con localización ${painSide.toLowerCase()}`;

  text += `, de intensidad ${intensity}/10.`;
  text += ` Lo describo como un dolor ${painType.toLowerCase()}.`;

  if (pattern && duration) {
    text += ` El patrón es ${pattern.toLowerCase()} y la duración aproximada fue ${duration.toLowerCase()}.`;
  } else if (pattern) {
    text += ` El patrón es ${pattern.toLowerCase()}.`;
  } else if (duration) {
    text += ` La duración aproximada fue ${duration.toLowerCase()}.`;
  }

  if (associatedWith.length > 0) {
    text += ` Se asocia con: ${associatedWith.join(", ").toLowerCase()}.`;
  }

  if (impact) {
    text += ` El impacto en el día fue: ${impact.toLowerCase()}.`;
  }

  if (medicationTaken.trim()) {
    text += ` Medicación tomada: ${medicationTaken.trim()}.`;
  }

  if (patientFreeText.trim()) {
    text += ` Comentario de la paciente: ${patientFreeText.trim()}`;
    if (!patientFreeText.trim().endsWith(".")) text += ".";
  }

  return text;
}

// ─── Props ───────────────────────────────────────────────────

type Props = {
  userId: string;
};

// ─── Componente ──────────────────────────────────────────────

export function PainForm({ userId }: Props) {
  const supabase = createClient();

  // Estado del formulario
  const [painDate, setPainDate] = useState(today());
  const [bodyZone, setBodyZone] = useState("");
  const [painSide, setPainSide] = useState("");
  const [intensity, setIntensity] = useState(5);
  const [painType, setPainType] = useState("");
  const [pattern, setPattern] = useState("");
  const [duration, setDuration] = useState("");
  const [associatedWith, setAssociatedWith] = useState<string[]>([]);
  const [impact, setImpact] = useState("");
  const [medicationTaken, setMedicationTaken] = useState("");
  const [patientFreeText, setPatientFreeText] = useState("");

  // Estado de la descripción asistida
  const [generatedSummary, setGeneratedSummary] = useState("");
  const [confirmedSummary, setConfirmedSummary] = useState("");
  const [summaryVisible, setSummaryVisible] = useState(false);

  // Estado de UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const toggleAssociated = (option: string) => {
    setAssociatedWith((prev) =>
      prev.includes(option)
        ? prev.filter((o) => o !== option)
        : [...prev, option]
    );
  };

  // Genera el texto descriptivo a partir del estado actual del formulario
  const handleGenerateSummary = () => {
    const text = buildSummary({
      bodyZone,
      painSide,
      intensity,
      painType,
      pattern,
      duration,
      associatedWith,
      impact,
      medicationTaken,
      patientFreeText,
    });
    setGeneratedSummary(text);
    setConfirmedSummary(text); // pre-carga el textarea con el texto generado
    setSummaryVisible(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Verificar sesión antes de insertar
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (!user || userError || user.id !== userId) {
      setError("Tu sesión expiró. Por favor, ingresá de nuevo.");
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase
      .from("pain_records")
      .insert({
        patient_id: user.id,
        pain_date: painDate,
        body_zone: bodyZone,
        pain_side: painSide || null,
        intensity,
        pain_type: painType,
        pattern: pattern || null,
        duration: duration || null,
        associated_with: associatedWith.length > 0 ? associatedWith : null,
        impact: impact || null,
        medication_taken: medicationTaken.trim() || null,
        patient_free_text: patientFreeText.trim() || null,
        // Descripción asistida: null si la paciente no generó descripción
        generated_summary: generatedSummary || null,
        confirmed_summary: confirmedSummary.trim() || null,
      });

    if (insertError) {
      console.warn("[EndoTrack] Error al insertar pain_record:", insertError.message);
      setError("No se pudo guardar el registro. Intentá de nuevo.");
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  // ─── Pantalla de éxito ──────────────────────────────────────
  if (success) {
    return (
      <div className="rounded-2xl bg-white border border-emerald-100 shadow-sm p-8 text-center flex flex-col items-center gap-4">
        <span className="text-4xl">✅</span>
        <h2 className="text-xl font-bold text-slate-800">
          Registro guardado correctamente
        </h2>
        <p className="text-sm text-slate-500 max-w-sm">
          Tu episodio de dolor quedó registrado. Podés volver al inicio o
          registrar otro episodio.
        </p>
        <div className="flex gap-3 mt-2">
          <Link
            href="/paciente"
            className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Volver al inicio
          </Link>
          <button
            onClick={() => {
              setSuccess(false);
              setPainDate(today());
              setBodyZone("");
              setPainSide("");
              setIntensity(5);
              setPainType("");
              setPattern("");
              setDuration("");
              setAssociatedWith([]);
              setImpact("");
              setMedicationTaken("");
              setPatientFreeText("");
              setGeneratedSummary("");
              setConfirmedSummary("");
              setSummaryVisible(false);
            }}
            className="rounded-full bg-rose-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-rose-700 transition-colors"
          >
            Registrar otro episodio
          </button>
        </div>
      </div>
    );
  }

  // ─── Formulario ─────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">

      {/* ── Fecha ── */}
      <div className="rounded-2xl bg-white border border-rose-100 shadow-sm p-6 flex flex-col gap-3">
        <h2 className="font-semibold text-slate-700">¿Cuándo ocurrió?</h2>
        <input
          type="date"
          required
          value={painDate}
          max={today()}
          onChange={(e) => setPainDate(e.target.value)}
          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-300"
        />
      </div>

      {/* ── Zona del cuerpo ── */}
      <div className="rounded-2xl bg-white border border-rose-100 shadow-sm p-6 flex flex-col gap-3">
        <h2 className="font-semibold text-slate-700">
          ¿Dónde duele? <span className="text-rose-500">*</span>
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {BODY_ZONES.map((zone) => (
            <button
              key={zone}
              type="button"
              onClick={() => setBodyZone(zone)}
              className={`rounded-xl border px-3 py-2.5 text-sm text-left transition-colors ${
                bodyZone === zone
                  ? "border-rose-500 bg-rose-50 text-rose-700 font-medium"
                  : "border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              {zone}
            </button>
          ))}
        </div>
      </div>

      {/* ── Lado ── */}
      <div className="rounded-2xl bg-white border border-rose-100 shadow-sm p-6 flex flex-col gap-3">
        <h2 className="font-semibold text-slate-700">¿De qué lado?</h2>
        <div className="grid grid-cols-2 gap-2">
          {PAIN_SIDES.map((side) => (
            <button
              key={side}
              type="button"
              onClick={() => setPainSide(painSide === side ? "" : side)}
              className={`rounded-xl border px-3 py-2.5 text-sm text-left transition-colors ${
                painSide === side
                  ? "border-rose-500 bg-rose-50 text-rose-700 font-medium"
                  : "border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              {side}
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-400">Opcional — dejá sin seleccionar si no aplica.</p>
      </div>

      {/* ── Intensidad ── */}
      <div className="rounded-2xl bg-white border border-rose-100 shadow-sm p-6 flex flex-col gap-3">
        <h2 className="font-semibold text-slate-700">
          Intensidad <span className="text-rose-500">*</span>
        </h2>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min={0}
            max={10}
            step={1}
            value={intensity}
            onChange={(e) => setIntensity(Number(e.target.value))}
            className="flex-1 accent-rose-500"
          />
          <span className={`text-2xl font-bold w-8 text-center ${intensityColor(intensity)}`}>
            {intensity}
          </span>
        </div>
        <div className="flex justify-between text-xs text-slate-400">
          <span>0 — Sin dolor</span>
          <span>10 — Dolor máximo</span>
        </div>
      </div>

      {/* ── Tipo de dolor ── */}
      <div className="rounded-2xl bg-white border border-rose-100 shadow-sm p-6 flex flex-col gap-3">
        <h2 className="font-semibold text-slate-700">
          ¿Cómo es el dolor? <span className="text-rose-500">*</span>
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {PAIN_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setPainType(type)}
              className={`rounded-xl border px-3 py-2.5 text-sm text-left transition-colors ${
                painType === type
                  ? "border-rose-500 bg-rose-50 text-rose-700 font-medium"
                  : "border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* ── Patrón ── */}
      <div className="rounded-2xl bg-white border border-rose-100 shadow-sm p-6 flex flex-col gap-3">
        <h2 className="font-semibold text-slate-700">¿Cómo viene el dolor?</h2>
        <div className="grid grid-cols-2 gap-2">
          {PATTERNS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPattern(pattern === p ? "" : p)}
              className={`rounded-xl border px-3 py-2.5 text-sm text-left transition-colors ${
                pattern === p
                  ? "border-rose-500 bg-rose-50 text-rose-700 font-medium"
                  : "border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* ── Duración ── */}
      <div className="rounded-2xl bg-white border border-rose-100 shadow-sm p-6 flex flex-col gap-3">
        <h2 className="font-semibold text-slate-700">¿Cuánto duró?</h2>
        <div className="flex flex-col gap-2">
          {DURATIONS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDuration(duration === d ? "" : d)}
              className={`rounded-xl border px-3 py-2.5 text-sm text-left transition-colors ${
                duration === d
                  ? "border-rose-500 bg-rose-50 text-rose-700 font-medium"
                  : "border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* ── Factores asociados ── */}
      <div className="rounded-2xl bg-white border border-rose-100 shadow-sm p-6 flex flex-col gap-3">
        <h2 className="font-semibold text-slate-700">¿Asociado a...?</h2>
        <p className="text-xs text-slate-400">Podés seleccionar más de uno.</p>
        <div className="flex flex-col gap-2">
          {ASSOCIATED_OPTIONS.map((opt) => (
            <label key={opt} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={associatedWith.includes(opt)}
                onChange={() => toggleAssociated(opt)}
                className="w-4 h-4 rounded accent-rose-500"
              />
              <span className="text-sm text-slate-700">{opt}</span>
            </label>
          ))}
        </div>
      </div>

      {/* ── Impacto ── */}
      <div className="rounded-2xl bg-white border border-rose-100 shadow-sm p-6 flex flex-col gap-3">
        <h2 className="font-semibold text-slate-700">Impacto en tu día</h2>
        <div className="flex flex-col gap-2">
          {IMPACTS.map((imp) => (
            <button
              key={imp}
              type="button"
              onClick={() => setImpact(impact === imp ? "" : imp)}
              className={`rounded-xl border px-3 py-2.5 text-sm text-left transition-colors ${
                impact === imp
                  ? "border-rose-500 bg-rose-50 text-rose-700 font-medium"
                  : "border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              {imp}
            </button>
          ))}
        </div>
      </div>

      {/* ── Medicación ── */}
      <div className="rounded-2xl bg-white border border-rose-100 shadow-sm p-6 flex flex-col gap-3">
        <h2 className="font-semibold text-slate-700">
          Medicación tomada{" "}
          <span className="text-xs font-normal text-slate-400">(opcional)</span>
        </h2>
        <p className="text-xs text-slate-400">
          Solo registrá lo que ya tomaste. EndoTrack no recomienda medicación.
        </p>
        <input
          type="text"
          value={medicationTaken}
          onChange={(e) => setMedicationTaken(e.target.value)}
          placeholder="Ej: ibuprofeno 400mg"
          className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-300"
        />
      </div>

      {/* ── Notas personales ── */}
      <div className="rounded-2xl bg-white border border-rose-100 shadow-sm p-6 flex flex-col gap-3">
        <h2 className="font-semibold text-slate-700">
          Notas personales{" "}
          <span className="text-xs font-normal text-slate-400">(opcional)</span>
        </h2>
        <p className="text-xs text-slate-400">
          Agregá cualquier detalle que quieras recordar o compartir con tu médico.
        </p>
        <textarea
          value={patientFreeText}
          onChange={(e) => setPatientFreeText(e.target.value)}
          placeholder="Escribí con tus propias palabras..."
          rows={4}
          className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-300 resize-none"
        />
      </div>

      {/* ── Descripción asistida ── */}
      <div className="rounded-2xl bg-white border border-violet-100 shadow-sm p-6 flex flex-col gap-4">
        <div>
          <h2 className="font-semibold text-slate-700">
            Descripción para el profesional de salud{" "}
            <span className="text-xs font-normal text-slate-400">(opcional)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Generá un texto ordenado con tus datos para compartir con tu médico.
            Podés editarlo antes de guardar.
          </p>
        </div>

        {/* Botón de generación — requiere campos obligatorios completos */}
        <button
          type="button"
          onClick={handleGenerateSummary}
          disabled={!bodyZone || !painType}
          className="self-start rounded-full border-2 border-violet-400 px-5 py-2 text-sm font-semibold text-violet-700 hover:bg-violet-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {summaryVisible ? "↺ Regenerar descripción" : "Generar descripción"}
        </button>

        {/* Bloque editable — aparece solo después de generar */}
        {summaryVisible && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-slate-600 font-medium">
              Revisá si esta descripción representa lo que sentís. Podés
              modificarla antes de guardarla.
            </p>

            <textarea
              value={confirmedSummary}
              onChange={(e) => setConfirmedSummary(e.target.value)}
              rows={6}
              className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-300 resize-none leading-relaxed"
            />

            {/* Aclaración clínica */}
            <div className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
              <span className="leading-none mt-0.5">⚠️</span>
              <p>
                Esta descripción no es un diagnóstico. Es un resumen editable
                de la información que ingresaste para facilitar la comunicación
                con profesionales de salud.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Error ── */}
      {error && (
        <p className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {/* ── Botón de envío ── */}
      <button
        type="submit"
        disabled={loading || !bodyZone || !painType}
        className="w-full rounded-full bg-rose-600 px-6 py-3.5 text-sm font-semibold text-white hover:bg-rose-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? "Guardando..." : "Guardar registro"}
      </button>

      <p className="text-xs text-slate-400 text-center pb-4">
        Los campos con <span className="text-rose-500">*</span> son obligatorios.
        Los demás son opcionales pero ayudan a tu médico a entender mejor tu situación.
      </p>
    </form>
  );
}
