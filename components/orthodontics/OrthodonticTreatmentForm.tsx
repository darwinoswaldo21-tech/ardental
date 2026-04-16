"use client";

import { useState } from "react";
import React from "react";

type OrthodonticTreatmentFormProps = {
  patientId: string;
  onSaved?: () => void;
};

export default function OrthodonticTreatmentForm({
  patientId,
  onSaved,
}: OrthodonticTreatmentFormProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [treatmentId, setTreatmentId] = useState<string | null>(null);
  const [defaults, setDefaults] = useState<Record<string, string>>({});

  React.useEffect(() => {
    let isActive = true;
    setIsLoading(true);
    fetch(`/api/orthodontic-treatments?patientId=${patientId}`)
      .then(async (response) => {
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error ?? "No se pudo cargar el tratamiento.");
        }
        return response.json();
      })
      .then((data) => {
        if (!isActive) return;
        if (data?.treatment?.id) {
          setTreatmentId(data.treatment.id);
          setDefaults({
            appliance_type: data.treatment.appliance_type ?? "",
            status: data.treatment.status ?? "",
            start_date: data.treatment.start_date ?? "",
            estimated_end_date: data.treatment.estimated_end_date ?? "",
            molar_class: data.treatment.molar_class ?? "",
            canine_class: data.treatment.canine_class ?? "",
            overjet:
              data.treatment.overjet !== null &&
              data.treatment.overjet !== undefined
                ? String(data.treatment.overjet)
                : "",
            overbite:
              data.treatment.overbite !== null &&
              data.treatment.overbite !== undefined
                ? String(data.treatment.overbite)
                : "",
            treatment_objectives: data.treatment.treatment_objectives ?? "",
            diagnosis_notes: data.treatment.diagnosis_notes ?? "",
            retainer_type: data.treatment.retainer_type ?? "",
            retainer_notes: data.treatment.retainer_notes ?? "",
            total_cost:
              data.treatment.total_cost !== null &&
              data.treatment.total_cost !== undefined
                ? String(data.treatment.total_cost)
                : "",
            monthly_fee:
              data.treatment.monthly_fee !== null &&
              data.treatment.monthly_fee !== undefined
                ? String(data.treatment.monthly_fee)
                : "",
          });
        } else {
          setTreatmentId(null);
          setDefaults({});
        }
      })
      .catch((err: Error) => {
        if (!isActive) return;
        setError(err.message);
      })
      .finally(() => {
        if (!isActive) return;
        setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [patientId]);

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload = {
      id: treatmentId ?? undefined,
      patient_id: patientId,
      appliance_type: formData.get("appliance_type") || null,
      status: formData.get("status") || null,
      start_date: formData.get("start_date") || null,
      estimated_end_date: formData.get("estimated_end_date") || null,
      molar_class: formData.get("molar_class") || null,
      canine_class: formData.get("canine_class") || null,
      overjet: formData.get("overjet") || null,
      overbite: formData.get("overbite") || null,
      treatment_objectives: formData.get("treatment_objectives") || null,
      diagnosis_notes: formData.get("diagnosis_notes") || null,
      retainer_type: formData.get("retainer_type") || null,
      retainer_notes: formData.get("retainer_notes") || null,
      total_cost: formData.get("total_cost") || null,
      monthly_fee: formData.get("monthly_fee") || null,
    };

    if (!payload.appliance_type || !payload.status || !payload.start_date) {
      setError("Completa los campos obligatorios marcados con *.");
      return;
    }

    setIsSaving(true);
    setError(null);
    setMessage(null);

    fetch("/api/orthodontic-treatments", {
      method: treatmentId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(async (response) => {
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error ?? "No se pudo guardar el tratamiento.");
        }
        setMessage(
          treatmentId
            ? "Tratamiento actualizado correctamente."
            : "Tratamiento creado correctamente."
        );
        if (!treatmentId) {
          event.currentTarget.reset();
        }
        onSaved?.();
      })
      .catch((err: Error) => {
        setError(err.message);
      })
      .finally(() => setIsSaving(false));
  };

  if (isLoading) {
    return (
      <div className="text-sm text-slate-600">
        Cargando tratamiento...
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input type="hidden" name="patient_id" value={patientId} />

      <p className="text-xs text-slate-500">
        Los campos con * son obligatorios.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Tipo de aparato <span className="text-red-600">*</span>
          </label>
          <select
            name="appliance_type"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            defaultValue={defaults.appliance_type ?? ""}
          >
            <option value="">Selecciona una opcion</option>
            <option value="metal_brackets">Brackets metalicos</option>
            <option value="aesthetic_brackets">Brackets esteticos</option>
            <option value="aligners">Alineadores</option>
            <option value="other">Otro</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Estado <span className="text-red-600">*</span>
          </label>
          <select
            name="status"
            defaultValue={defaults.status ?? "active"}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="active">Activo</option>
            <option value="paused">Pausado</option>
            <option value="finished">Finalizado</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Fecha inicio <span className="text-red-600">*</span>
          </label>
          <input
            type="date"
            name="start_date"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            defaultValue={defaults.start_date ?? ""}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Fin estimado
          </label>
          <input
            type="date"
            name="estimated_end_date"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            defaultValue={defaults.estimated_end_date ?? ""}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Clase molar
          </label>
          <select
            name="molar_class"
            defaultValue={defaults.molar_class ?? ""}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Selecciona una opcion</option>
            <option value="I">I</option>
            <option value="II">II</option>
            <option value="III">III</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Clase canina
          </label>
          <select
            name="canine_class"
            defaultValue={defaults.canine_class ?? ""}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Selecciona una opcion</option>
            <option value="I">I</option>
            <option value="II">II</option>
            <option value="III">III</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Overjet (mm)
          </label>
          <input
            type="number"
            step="0.1"
            name="overjet"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            defaultValue={defaults.overjet ?? ""}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Overbite (mm)
          </label>
          <input
            type="number"
            step="0.1"
            name="overbite"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            defaultValue={defaults.overbite ?? ""}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">
          Plan de tratamiento y objetivos
        </label>
        <textarea
          name="treatment_objectives"
          rows={3}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          placeholder="Objetivos clinicos, extracciones planificadas, etc."
          defaultValue={defaults.treatment_objectives ?? ""}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">
          Notas de diagnostico
        </label>
        <textarea
          name="diagnosis_notes"
          rows={3}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          defaultValue={defaults.diagnosis_notes ?? ""}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Tipo de retenedor
          </label>
          <input
            name="retainer_type"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            defaultValue={defaults.retainer_type ?? ""}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Notas del retenedor
          </label>
          <input
            name="retainer_notes"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            defaultValue={defaults.retainer_notes ?? ""}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Costo total
          </label>
          <input
            type="number"
            step="0.01"
            name="total_cost"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            defaultValue={defaults.total_cost ?? ""}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Cuota mensual
          </label>
          <input
            type="number"
            step="0.01"
            name="monthly_fee"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            defaultValue={defaults.monthly_fee ?? ""}
          />
        </div>
      </div>

      {message ? <p className="text-sm text-slate-600">{message}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          {isSaving ? "Guardando..." : "Guardar tratamiento"}
        </button>
        <button
          type="reset"
          className="rounded-md border border-slate-300 px-4 py-2 text-sm"
          onClick={() => {
            setMessage(null);
            setError(null);
          }}
        >
          Limpiar
        </button>
      </div>
    </form>
  );
}

