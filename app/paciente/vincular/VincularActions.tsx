/**
 * Acciones de vinculación desde la vista de la paciente.
 * Client Component: búsqueda de médico, envío de invitación y revocación.
 */
"use client";

import { createClient } from "@/lib/supabase/client";
import type { LinkWithDoctor, LinkStatus } from "@/lib/types/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

// ─── Helpers ──────────────────────────────────────────────────

const STATUS_LABEL: Record<LinkStatus, string> = {
  pending: "Pendiente",
  accepted: "Aceptada",
  revoked: "Revocada",
};

const STATUS_STYLE: Record<LinkStatus, string> = {
  pending: "bg-amber-100 text-amber-700",
  accepted: "bg-emerald-100 text-emerald-700",
  revoked: "bg-slate-100 text-slate-500",
};

// ─── Props ────────────────────────────────────────────────────

type Props = {
  userId: string;
  initialLinks: LinkWithDoctor[];
};

// ─── Componente ──────────────────────────────────────────────

export function VincularActions({ userId, initialLinks }: Props) {
  const supabase = createClient();
  const router = useRouter();

  const [searchEmail, setSearchEmail] = useState("");
  const [searchResult, setSearchResult] = useState<{
    id: string;
    display_name: string;
    email: string;
  } | null>(null);
  const [searchDone, setSearchDone] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [revokeLoadingId, setRevokeLoadingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const activeLinks = initialLinks.filter((l) => l.status !== "revoked");
  const revokedLinks = initialLinks.filter((l) => l.status === "revoked");

  // ── Buscar médico por email ───────────────────────────────

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearchLoading(true);
    setSearchResult(null);
    setSearchDone(false);
    setError("");
    setSuccessMsg("");

    const { data, error: searchError } = await supabase
      .from("profiles")
      .select("id, display_name, email")
      .eq("email", searchEmail.trim().toLowerCase())
      .eq("role", "medico")
      .maybeSingle();

    if (searchError) {
      setError("Error al buscar. Intentá de nuevo.");
    } else {
      setSearchResult(data ?? null);
    }

    setSearchDone(true);
    setSearchLoading(false);
  };

  // ── Enviar invitación ─────────────────────────────────────

  const handleInvite = async () => {
    if (!searchResult) return;
    setInviteLoading(true);
    setError("");
    setSuccessMsg("");

    // Verificar que sigue autenticada
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (!user || userError || user.id !== userId) {
      setError("Tu sesión expiró. Por favor, ingresá de nuevo.");
      setInviteLoading(false);
      return;
    }

    // Verificar que no existe ya un vínculo activo con este médico
    const existing = initialLinks.find(
      (l) => l.doctor_id === searchResult.id && l.status !== "revoked"
    );
    if (existing) {
      setError(
        `Ya tenés un vínculo ${STATUS_LABEL[existing.status].toLowerCase()} con este profesional.`
      );
      setInviteLoading(false);
      return;
    }

    const { error: insertError } = await supabase
      .from("patient_doctor_links")
      .insert({
        patient_id: user.id,   // siempre del usuario autenticado
        doctor_id: searchResult.id,
        status: "pending",
      });

    if (insertError) {
      console.warn("[EndoTrack] Error al crear vínculo:", insertError.message);
      setError("No se pudo enviar la invitación. Intentá de nuevo.");
    } else {
      setSuccessMsg(`Invitación enviada a ${searchResult.display_name}.`);
      setSearchEmail("");
      setSearchResult(null);
      setSearchDone(false);
      router.refresh();
    }

    setInviteLoading(false);
  };

  // ── Revocar vínculo ───────────────────────────────────────

  const handleRevoke = async (linkId: string) => {
    setRevokeLoadingId(linkId);
    setError("");
    setSuccessMsg("");

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (!user || userError || user.id !== userId) {
      setError("Tu sesión expiró.");
      setRevokeLoadingId(null);
      return;
    }

    const { error: updateError } = await supabase
      .from("patient_doctor_links")
      .update({ status: "revoked" })
      .eq("id", linkId)
      .eq("patient_id", user.id);   // defensa extra: solo sus propios vínculos

    if (updateError) {
      console.warn("[EndoTrack] Error al revocar vínculo:", updateError.message);
      setError("No se pudo revocar el acceso. Intentá de nuevo.");
    } else {
      setSuccessMsg("Acceso revocado correctamente.");
      router.refresh();
    }

    setRevokeLoadingId(null);
  };

  // ─── Render ──────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6">

      {/* ── Buscar y agregar médico ── */}
      <div className="rounded-2xl bg-white border border-rose-100 shadow-sm p-6 flex flex-col gap-4">
        <h2 className="font-semibold text-slate-700">Invitar a un profesional</h2>

        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="email"
            value={searchEmail}
            onChange={(e) => {
              setSearchEmail(e.target.value);
              setSearchDone(false);
              setSearchResult(null);
            }}
            placeholder="Email del profesional de salud"
            required
            className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-300"
          />
          <button
            type="submit"
            disabled={searchLoading}
            className="shrink-0 rounded-full bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 transition-colors disabled:opacity-50"
          >
            {searchLoading ? "Buscando..." : "Buscar"}
          </button>
        </form>

        {/* Resultado de búsqueda */}
        {searchDone && (
          <>
            {searchResult ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    {searchResult.display_name}
                  </p>
                  <p className="text-xs text-slate-500">{searchResult.email}</p>
                </div>
                <button
                  type="button"
                  onClick={handleInvite}
                  disabled={inviteLoading}
                  className="shrink-0 rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  {inviteLoading ? "Enviando..." : "Invitar"}
                </button>
              </div>
            ) : (
              <p className="text-sm text-slate-500 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                No se encontró ningún profesional registrado con ese email.
              </p>
            )}
          </>
        )}
      </div>

      {/* ── Mensajes globales ── */}
      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {successMsg && (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          ✅ {successMsg}
        </p>
      )}

      {/* ── Vínculos activos ── */}
      {activeLinks.length > 0 && (
        <div className="rounded-2xl bg-white border border-rose-100 shadow-sm p-6 flex flex-col gap-3">
          <h2 className="font-semibold text-slate-700">Profesionales vinculados</h2>
          <div className="flex flex-col gap-3">
            {activeLinks.map((link) => (
              <div
                key={link.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    {link.doctor?.display_name ?? "Médico desconocido"}
                  </p>
                  <p className="text-xs text-slate-400">{link.doctor?.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[link.status]}`}>
                    {STATUS_LABEL[link.status]}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRevoke(link.id)}
                    disabled={revokeLoadingId === link.id}
                    className="rounded-full border border-red-200 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    {revokeLoadingId === link.id ? "..." : "Revocar"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Sin vínculos ── */}
      {initialLinks.length === 0 && (
        <div className="rounded-2xl bg-white border border-rose-100 shadow-sm p-8 text-center flex flex-col items-center gap-2">
          <span className="text-3xl">🩺</span>
          <p className="text-slate-600 font-medium text-sm">
            Todavía no invitaste a ningún profesional.
          </p>
          <p className="text-xs text-slate-400">
            Buscá por email y enviá una invitación.
          </p>
        </div>
      )}

      {/* ── Vínculos revocados (colapsado) ── */}
      {revokedLinks.length > 0 && (
        <details className="rounded-2xl bg-white border border-slate-100 shadow-sm p-6">
          <summary className="text-sm font-medium text-slate-400 cursor-pointer select-none">
            Accesos revocados ({revokedLinks.length})
          </summary>
          <div className="flex flex-col gap-2 mt-4">
            {revokedLinks.map((link) => (
              <div
                key={link.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 px-4 py-3 opacity-60"
              >
                <div>
                  <p className="text-sm text-slate-600">
                    {link.doctor?.display_name ?? "Médico desconocido"}
                  </p>
                  <p className="text-xs text-slate-400">{link.doctor?.email}</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE.revoked}`}>
                  Revocado
                </span>
              </div>
            ))}
          </div>
        </details>
      )}

      <p className="text-xs text-slate-400 text-center pb-4">
        EndoTrack no comparte tus datos sin tu autorización explícita.
      </p>
    </div>
  );
}
