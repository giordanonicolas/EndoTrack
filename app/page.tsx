const features = [
  {
    icon: "📋",
    title: "Registro de síntomas",
    description:
      "Anotá tus síntomas día a día de forma simple y ordenada. Llevá un historial completo que evoluciona con vos.",
  },
  {
    icon: "🩺",
    title: "Descripción asistida del dolor",
    description:
      "Respondé preguntas guiadas para describir el dolor con precisión: intensidad, ubicación, momento del ciclo y más.",
  },
  {
    icon: "📄",
    title: "Reportes para el médico",
    description:
      "Generá un resumen claro y estructurado listo para compartir con tu ginecólogo u otro profesional de salud.",
  },
];

export default function Home() {
  return (
    <main className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="w-full px-6 py-5 flex items-center justify-between max-w-5xl mx-auto">
        <span className="text-xl font-bold tracking-tight text-rose-700">
          EndoTrack
        </span>
        <span className="text-sm text-slate-500 font-medium">
          Apoyo clínico · No diagnóstico
        </span>
      </header>

      {/* Hero */}
      <section className="flex flex-col items-center text-center px-6 pt-16 pb-12 max-w-3xl mx-auto w-full">
        <span className="inline-block mb-5 rounded-full bg-rose-100 px-4 py-1.5 text-sm font-semibold text-rose-700 tracking-wide">
          Prototipo académico
        </span>

        <h1 className="text-4xl sm:text-5xl font-bold text-slate-800 leading-tight mb-6">
          Seguimiento clínico para una{" "}
          <span className="text-rose-600">detección más temprana</span>
        </h1>

        <p className="text-lg text-slate-600 leading-relaxed max-w-2xl mb-8">
          EndoTrack ayuda a registrar síntomas, describir el dolor y generar
          reportes claros para compartir con profesionales de salud.
        </p>

        <button className="rounded-full bg-rose-600 px-8 py-3.5 text-white font-semibold text-base shadow-sm hover:bg-rose-700 transition-colors">
          Ingresar a EndoTrack
        </button>
      </section>

      {/* Aviso médico */}
      <section className="w-full px-6 pb-6 max-w-3xl mx-auto">
        <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
          <span className="text-lg leading-none mt-0.5">⚠️</span>
          <p>
            <strong>Importante:</strong> EndoTrack no realiza diagnósticos ni
            reemplaza la consulta médica. Es una herramienta de apoyo para
            mejorar la comunicación con profesionales de salud.
          </p>
        </div>
      </section>

      {/* Tarjetas de funcionalidades */}
      <section className="w-full px-6 pb-20 max-w-5xl mx-auto">
        <h2 className="text-center text-2xl font-bold text-slate-700 mb-10">
          ¿Qué podés hacer con EndoTrack?
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl bg-white border border-rose-100 shadow-sm p-7 flex flex-col gap-3 hover:shadow-md transition-shadow"
            >
              <span className="text-3xl">{feature.icon}</span>
              <h3 className="text-lg font-semibold text-slate-800">
                {feature.title}
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto w-full border-t border-rose-100 px-6 py-6 text-center text-xs text-slate-400">
        EndoTrack · Proyecto en desarrollo · Creado por Lucía y Nico
      </footer>
    </main>
  );
}
