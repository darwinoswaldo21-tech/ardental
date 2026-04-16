"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { patientMedicalSchema } from "@/lib/validations/patient-medical";

type ClinicalHistorySectionProps = {
  patientId: string;
  defaultValues: {
    allergies?: string[] | null;
    current_medications?: string[] | null;
    systemic_diseases?: string[] | null;
    takes_anticoagulants?: boolean | null;
    blood_type?: string | null;
  };
};

type FormValues = z.infer<typeof patientMedicalSchema>;

export default function ClinicalHistorySection({
  patientId,
  defaultValues,
}: ClinicalHistorySectionProps) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const toComma = (value?: string[] | null) =>
    Array.isArray(value) ? value.join(", ") : "";

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(patientMedicalSchema),
    defaultValues: {
      allergies: toComma(defaultValues.allergies),
      current_medications: toComma(defaultValues.current_medications),
      systemic_diseases: toComma(defaultValues.systemic_diseases),
      takes_anticoagulants: defaultValues.takes_anticoagulants ?? false,
      blood_type: defaultValues.blood_type ?? "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    setError(null);
    setSuccess(null);
    if (!patientId) {
      console.error("[Historia clínica] patientId undefined");
      setError("No se pudo identificar al paciente.");
      return;
    }
    const response = await fetch(`/api/patients/${patientId}/medical`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      const json = await response.json().catch(() => null);
      setError(json?.error ?? "No se pudo actualizar la historia clínica.");
      return;
    }

    setSuccess("Historia clínica actualizada.");
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">
          Historia clínica
        </h3>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Alergias (separar por comas)
            </label>
            <textarea
              rows={2}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              {...register("allergies")}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Medicamentos actuales (separar por comas)
            </label>
            <textarea
              rows={2}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              {...register("current_medications")}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Enfermedades sistémicas (separar por comas)
            </label>
            <textarea
              rows={2}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              {...register("systemic_diseases")}
            />
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Tipo de sangre
              </label>
              <input
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                {...register("blood_type")}
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300"
                {...register("takes_anticoagulants")}
              />
              Usa anticoagulantes
            </label>
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-emerald-600">{success}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          Guardar historia clínica
        </button>
      </form>
    </section>
  );
}
