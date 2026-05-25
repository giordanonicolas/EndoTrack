/**
 * Tipos TypeScript para la tabla public.pain_records.
 * Refleja exactamente la estructura de la base de datos.
 *
 * Centralizar los tipos aquí evita duplicarlos en cada componente
 * y hace que TypeScript avise si algo no coincide con el schema.
 */

/** Registro completo tal como existe en la base de datos. */
export type PainRecord = {
  id: string;
  patient_id: string;
  pain_date: string;           // "YYYY-MM-DD"
  body_zone: string;
  pain_side: string | null;
  intensity: number;           // 0–10
  pain_type: string;
  pattern: string | null;
  duration: string | null;
  associated_with: string[] | null;
  impact: string | null;
  medication_taken: string | null;
  patient_free_text: string | null;
  generated_summary: string | null;   // para uso futuro con IA
  confirmed_summary: string | null;   // para uso futuro
  created_at: string;
  updated_at: string;
};

/**
 * Tipo para insertar un registro nuevo.
 * Excluye los campos que maneja la base de datos sola (id, timestamps)
 * y los que no usamos todavía (generated_summary, confirmed_summary).
 * patient_id siempre viene del usuario autenticado, nunca del formulario.
 */
export type NewPainRecord = Omit<
  PainRecord,
  "id" | "generated_summary" | "confirmed_summary" | "created_at" | "updated_at"
>;
