/**
 * Página de login.
 * Client Component: maneja el formulario y redirige según el rol del usuario.
 *
 * Flujo:
 * 1. Usuario ingresa email y contraseña.
 * 2. Se llama a supabase.auth.signInWithPassword().
 * 3. El rol se lee desde user_metadata (JWT) — no requiere consulta DB ni RLS.
 * 4. También se intenta leer desde public.profiles como verificación secundaria.
 * 5. Se redirige al dashboard correspondiente.
 */
"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // 1. Autenticar
    const { data: authData, error: signInError } =
      await supabase.auth.signInWithPassword({ email, password });

    if (signInError || !authData.user) {
      setError("Email o contraseña incorrectos.");
      setLoading(false);
      return;
    }

    // 2. Leer rol desde el JWT (user_metadata).
    //    Este dato se guardó al registrarse con signUp({ options: { data: { role } } })
    //    y está dentro del token — no depende de RLS ni de una consulta extra.
    const roleFromToken = authData.user.user_metadata?.role as
      | string
      | undefined;

    // Verificación secundaria: intentar leer desde public.profiles.
    // Si RLS tarda en propagarse o hay otro problema, usamos el del token.
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", authData.user.id)
      .maybeSingle();

    if (profileError) {
      // Solo para depuración — quitar antes de producción
      console.warn("[EndoTrack] profiles query:", profileError?.message);
    }

    // Preferimos el rol de la DB; si falla, usamos el del JWT
    const role = profile?.role ?? roleFromToken;

    if (!role) {
      setError(
        "No se pudo determinar tu rol. Intentá cerrar sesión y volver a ingresar."
      );
      setLoading(false);
      return;
    }

    // 3. Redirigir según rol
    router.push(role === "paciente" ? "/paciente" : "/medico");
    router.refresh();
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      {/* Logo */}
      <Link
        href="/"
        className="text-2xl font-bold text-rose-700 mb-8 tracking-tight"
      >
        EndoTrack
      </Link>

      <div className="w-full max-w-md bg-white rounded-2xl border border-rose-100 shadow-sm p-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-1">Ingresar</h1>
        <p className="text-sm text-slate-500 mb-6">
          Bienvenida de vuelta a EndoTrack.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="email"
              className="text-sm font-medium text-slate-700"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-300"
            />
          </div>

          {/* Contraseña */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="password"
              className="text-sm font-medium text-slate-700"
            >
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Tu contraseña"
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-300"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="rounded-lg bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-700">
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-full bg-rose-600 px-6 py-3 text-sm font-semibold text-white hover:bg-rose-700 transition-colors disabled:opacity-50"
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

        {/* Link a registro */}
        <p className="mt-6 text-sm text-center text-slate-500">
          ¿No tenés cuenta?{" "}
          <Link
            href="/registro"
            className="text-rose-600 font-medium hover:underline"
          >
            Registrate aquí
          </Link>
        </p>
      </div>
    </main>
  );
}
