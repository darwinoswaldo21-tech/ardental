"use client";

import { useState } from "react";
import OrthodonticTreatmentForm from "@/components/orthodontics/OrthodonticTreatmentForm";
import OrthodonticBracketsSection from "@/components/orthodontics/OrthodonticBracketsSection";
import OrthodonticAdjustmentsSection from "@/components/orthodontics/OrthodonticAdjustmentsSection";

type OrthodonticsSectionProps = {
  patientId: string;
};

export default function OrthodonticsSection({
  patientId,
}: OrthodonticsSectionProps) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Ortodoncia</h2>
          <p className="text-sm text-slate-600">
            Crea tratamientos y registra controles sin tocar la base actual.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((prev) => !prev)}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Nuevo tratamiento
        </button>
      </div>

      {showForm ? (
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <OrthodonticTreatmentForm patientId={patientId} />
        </div>
      ) : null}

      <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
        Si ya existe un tratamiento, se cargara automaticamente para editar.
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <OrthodonticBracketsSection patientId={patientId} />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <OrthodonticAdjustmentsSection patientId={patientId} />
      </div>
    </div>
  );
}
