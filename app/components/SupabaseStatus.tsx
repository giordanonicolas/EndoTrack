/**
 * Componente de verificación de conexión con Supabase.
 * Solo para desarrollo — lo vamos a eliminar antes de hacer deploy.
 *
 * Es un Server Component: corre en el servidor, llama a Supabase
 * y muestra si la conexión funciona.
 */
import { createClient } from "@/lib/supabase/server";

export async function SupabaseStatus() {
  let status: "ok" | "error" = "error";
  let detail = "";

  try {
    const supabase = await createClient();
    // getSession() no requiere ninguna tabla propia — solo comprueba
    // que la URL y la key sean válidas y que Supabase responda.
    const { error } = await supabase.auth.getSession();

    if (error) {
      detail = error.message;
    } else {
      status = "ok";
      detail = "Supabase responde correctamente.";
    }
  } catch (e) {
    detail = e instanceof Error ? e.message : "Error desconocido";
  }

  return (
    <div
      className={`mx-auto max-w-3xl px-6 pb-6`}
    >
      <div
        className={`flex items-start gap-3 rounded-xl border px-5 py-4 text-sm ${
          status === "ok"
            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
            : "border-red-200 bg-red-50 text-red-800"
        }`}
      >
        <span className="text-lg leading-none mt-0.5">
          {status === "ok" ? "✅" : "❌"}
        </span>
        <div>
          <p className="font-semibold">
            {status === "ok"
              ? "Supabase conectado"
              : "Error de conexión con Supabase"}
          </p>
          <p className="mt-0.5 text-xs opacity-80">{detail}</p>
        </div>
      </div>
    </div>
  );
}
