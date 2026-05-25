/**
 * Acciones del médico sobre sus vínculos entrantes.
 * Client Component: aceptar o revocar invitaciones de pacientes.
 */
"use client";

import { createClient } from "@/lib/supabase/client";
import type { LinkWithPatient } from "@/lib/types/link";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  userId: string;
  pending: LinkWithPatient[];
  accepted: LinkWithPatient[];
  revoked: LinkWithPatient[];
};

export function VinculoActions({ userId, pending, accepted, revoked }: Props) {
  const supabase = createClient();
  const router = useRouter();

  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError]         = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const updateStatus = async (
    linkId: string,
    newStatus: "accepted" | "revoked"
  ) => {
    setLoadingId(linkId);
    setError("");
    setSuccessMsg("");

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (!user || userError || user.id !== userId) {
      setError("Tu sesión expiró. Por favor, ingresá de nuevo.");
      setLoadingId(null);
      return;
    }

    const { error: updateError } = await supabase
      .from("patient_doctor_links")
      .update({ status: newStatus })
      .eq("id", linkId)
      .eq("doctor_id", user.id);   // defensa extra: solo sus propios vínculos

    if (updateError) {
      console.warn("[EndoTrack] Error al actualizar vínculo:", updateError.message);
      setError("No se pudo actualizar el vínculo. Intentá de nuevo.");
    } else {
      setSuccessMsg(
        newStatus === "accepted" ? "Invitación aceptada." : "Acceso revocado."
      );
      router.refresh();
    }

    setLoadingId(null);
  };

  const totalActive = pending.length + accepted.length;

  return (
    <div className="flex flex-col gap-6">

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

      {/* ── Sin invitaciones ── */}
      {totalActive === 0 && revoked.length === 0 && (
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-10 flex flex-col items-center gap-2 text-center">
          <span className="text-3xl">📭</span>
          <p className="text-slate-600 font-medium text-sm">
            Todavía no recibiste ninguna invitación.
          </p>
          <p className="text-xs text-slate-400">
            Cuando una paciente te invite, aparecerá aquí.
          </p>
        </div>
      )}

      {/* ── Invitaciones pendientes ── */}
      {pending.length > 0 && (
        <div className="rounded-2xl bg-white border border-amber-200 shadow-sm p-6 flex flex-col gap-3">
          <h2 className="font-semibold text-slate-700 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-400" />
            Invitaciones pendientes ({pending.length})
          </h2>
          <div className="flex flex-col gap-3">
            {pending.map((link) => (
              <div
                key={link.id}
                className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 flex items-center justify-between gap-3"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    {link.patient?.display_name ?? "Paciente desconocida"}
                  </p>
                  <p className="text-xs text-slate-400">{link.patient?.email}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => updateStatus(link.id, "accepted")}
                    disabled={loadingId === link.id}
                    className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
                  >
                    {loadingId === link.id ? "..." : "Aceptar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => updateStatus(link.id, "revoked")}
                    disabled={loadingId === link.id}
                    className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    Rechazar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Pacientes aceptadas ── */}
      {accepted.length > 0 && (
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6 flex flex-col gap-3">
          <h2 className="font-semibold text-slate-700 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
            Pacientes vinculadas ({accepted.length})
          </h2>
          <div className="flex flex-col gap-3">
            {accepted.map((link) => (
              <div
                key={link.id}
                className="rounded-xl border border-slate-100 px-4 py-3 flex items-center justify-between gap-3"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    {link.patient?.display_name ?? "Paciente desconocida"}
                  </p>
                  <p className="text-xs text-slate-400">{link.patient?.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/medico/pacientes/${link.patient_id}/reporte`}
                    className="rounded-full bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-700 transition-colors"
                  >
                    Ver reporte
                  </Link>
                  <button
                    type="button"
                    onClick={() => updateStatus(link.id, "revoked")}
                    disabled={loadingId === link.id}
                    className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    {loadingId === link.id ? "..." : "Revocar"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Revocados ── */}
      {revoked.length > 0 && (
        <details className="rounded-2xl bg-white border border-slate-100 shadow-sm p-6">
          <summary className="text-sm font-medium text-slate-400 cursor-pointer select-none">
            Accesos revocados ({revoked.length})
          </summary>
          <div className="flex flex-col gap-2 mt-4">
            {revoked.map((link) => (
              <div
                key={link.id}
                className="rounded-xl border border-slate-100 px-4 py-3 flex items-center justify-between opacity-60"
              >
                <div>
                  <p className="text-sm text-slate-600">
                    {link.patient?.display_name ?? "Paciente desconocida"}
                  </p>
                  <p className="text-xs text-slate-400">{link.patient?.email}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-500">
                  Revocado
                </span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
