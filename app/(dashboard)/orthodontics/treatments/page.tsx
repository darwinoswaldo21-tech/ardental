"use client";

export default function OrthodonticTreatmentsPage() {
  return (
    <section className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
        <h1 className="text-xl font-semibold text-slate-900">Tratamientos</h1>
        <p className="text-sm text-slate-600">
          Lista y creacion rapida de tratamientos ortodonticos.
        </p>
        </div>
        <button
          type="button"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Nuevo tratamiento
        </button>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="grid grid-cols-4 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <span>Paciente</span>
          <span>Estado</span>
          <span>Inicio</span>
          <span>Proximo control</span>
        </div>
        <div className="px-4 py-6 text-sm text-slate-600">
          No hay tratamientos creados. Usa "Nuevo tratamiento" para empezar.
        </div>
      </div>
    </section>
  );
}
