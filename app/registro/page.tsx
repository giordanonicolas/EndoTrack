/**
 * Página de registro.
 * Client Component: maneja el formulario interactivo y llama a Supabase Auth.
 *
 * Flujo:
 * 1. Usuario completa nombre, email, contraseña y elige su rol.
 * 2. Se llama a supabase.auth.signUp() con los datos como metadata.
 * 3. El trigger de PostgreSQL crea automáticamente la fila en public.profiles.
 * 4. Se redirige al dashboard según el rol elegido.
 */
"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Role = "paciente" | "medico";

export default function RegistroPage() {
  const router = useRouter();
  const supabase = createClient();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("paciente");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
          role,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // Redirigir según el rol elegido en el formulario
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
        <h1 className="text-2xl font-bold text-slate-800 mb-1">
          Crear cuenta
        </h1>
        <p className="text-sm text-slate-500 mb-6">
          Completá tus datos para empezar a usar EndoTrack.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Nombre */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="displayName"
              className="text-sm font-medium text-slate-700"
            >
              Nombre completo
            </label>
            <input
              id="displayName"
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Ej: María García"
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-300"
            />
          </div>

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
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-300"
            />
          </div>

          {/* Rol */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-slate-700">
              Soy...
            </span>
            <div className="grid grid-cols-2 gap-3">
              {(["paciente", "medico"] as Role[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-colors text-left ${
                    role === r
                      ? "border-rose-500 bg-rose-50 text-rose-700"
                      : "border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {r === "paciente" ? (
                    <>
                      <span className="block text-lg mb-0.5">🙋‍♀️</span>
                      Paciente
                    </>
                  ) : (
                    <>
                      <span className="block text-lg mb-0.5">🩺</span>
                      Profesional de salud
                    </>
                  )}
                </button>
              ))}
            </div>
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
            {loading ? "Creando cuenta..." : "Crear cuenta"}
          </button>
        </form>

        {/* Aviso médico */}
        <p className="mt-6 text-xs text-slate-400 text-center leading-relaxed">
          EndoTrack no realiza diagnósticos ni reemplaza la consulta médica.
        </p>

        {/* Link a login */}
        <p className="mt-4 text-sm text-center text-slate-500">
          ¿Ya tenés cuenta?{" "}
          <Link href="/login" className="text-rose-600 font-medium hover:underline">
            Ingresá aquí
          </Link>
        </p>
      </div>
    </main>
  );
}
