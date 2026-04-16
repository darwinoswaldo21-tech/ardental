"use client";

export default function OrthodonticAdjustmentsPage() {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">
          Ajustes y controles
        </h1>
        <p className="text-sm text-slate-600">
          Registro rapido ligado a la cita de ortodoncia.
        </p>
      </div>

      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">
        Vista inicial. No se crea ajuste hasta que el doctor guarde.
      </div>
    </section>
  );
}
