/**
 * Formulario de registro de episodio de dolor.
 * Client Component: maneja estado, validación e inserción en Supabase.
 *
 * Seguridad:
 * - patient_id NUNCA viene del formulario — siempre de auth.getUser()
 * - Se verifica user.id antes de insertar
 * - No se guardan generated_summary ni confirmed_summary todavía
 */
"use client";

import { createClient } from "@/lib/supabase/client";
import type { NewPainRecord } from "@/lib/types/pain";
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

/** Devuelve la fecha de hoy en formato YYYY-MM-DD para el input type="date" */
function today(): string {
  return new Date().toISOString().split("T")[0];
}

/** Color del slider de intensidad según el valor */
function intensityColor(value: number): string {
  if (value <= 3) return "text-emerald-600";
  if (value <= 6) return "text-amber-500";
  return "text-red-600";
}

// ─── Props ───────────────────────────────────────────────────

type Props = {
  /** UUID del usuario autenticado, verificado en el Server Component */
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

  // Estado de UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Manejo de checkboxes de associated_with
  const toggleAssociated = (option: string) => {
    setAssociatedWith((prev) =>
      prev.includes(option)
        ? prev.filter((o) => o !== option)
        : [...prev, option]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Verificar que el usuario sigue autenticado antes de insertar.
    // patient_id siempre viene de auth.getUser(), nunca del formulario.
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (!user || userError || user.id !== userId) {
      setError("Tu sesión expiró. Por favor, ingresá de nuevo.");
      setLoading(false);
      return;
    }

    // Construir el objeto a insertar (sin generated_summary ni confirmed_summary)
    const newRecord: NewPainRecord = {
      patient_id: user.id,              // ← siempre del usuario autenticado
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
    };

    const { error: insertError } = await supabase
      .from("pain_records")
      .insert(newRecord);

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
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-6"
    >

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
          <span
            className={`text-2xl font-bold w-8 text-center ${intensityColor(intensity)}`}
          >
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
            <label
              key={opt}
              className="flex items-center gap-3 cursor-pointer"
            >
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
        <h2 className="font-semibold text-slate-700">
          Impacto en tu día
        </h2>
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
