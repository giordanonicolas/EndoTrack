/**
 * Botón de cierre de sesión.
 * Client Component: necesita interacción del usuario y acceso al router.
 */
"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="rounded-full border border-rose-200 px-4 py-1.5 text-sm font-medium text-rose-700 hover:bg-rose-50 transition-colors disabled:opacity-50"
    >
      {loading ? "Saliendo..." : "Cerrar sesión"}
    </button>
  );
}
