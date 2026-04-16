"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { clinicalNoteSchema } from "@/lib/validations/clinical-notes";

type ClinicalNote = {
  id: string;
  date: string;
  content: string;
};

type ClinicalNotesSectionProps = {
  patientId: string;
};

type FormValues = z.infer<typeof clinicalNoteSchema>;

export default function ClinicalNotesSection({
  patientId,
}: ClinicalNotesSectionProps) {
  const [notes, setNotes] = useState<ClinicalNote[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(clinicalNoteSchema),
    defaultValues: {
      patient_id: patientId,
      date: "",
      content: "",
    },
  });

  const loadNotes = async () => {
    setLoading(true);
    setError(null);
    const response = await fetch(`/api/clinical-notes?patient_id=${patientId}`);
    if (!response.ok) {
      setError("No se pudieron cargar las notas clínicas.");
      setLoading(false);
      return;
    }
    const json = await response.json();
    setNotes(json.data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    loadNotes();
  }, [patientId]);

  const formatDate = (value: string) => {
    if (!value) return "";
    const [year, month, day] = value.split("-");
    if (!year || !month || !day) return value;
    return `${day}/${month}/${year}`;
  };

  const onSubmit = async (values: FormValues) => {
    setError(null);
    const response = await fetch("/api/clinical-notes", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      const json = await response.json().catch(() => null);
      setError(json?.error ?? "No se pudo guardar la nota clínica.");
      return;
    }

    reset({
      patient_id: patientId,
      date: "",
      content: "",
    });
    loadNotes();
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">Notas clínicas</h3>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <input type="hidden" {...register("patient_id")} />
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Fecha
          </label>
          <input
            type="date"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            {...register("date")}
          />
          {errors.date && (
            <p className="mt-1 text-xs text-red-600">{errors.date.message}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Nota clinica
          </label>
          <textarea
            rows={3}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            {...register("content")}
          />
          {errors.content && (
            <p className="mt-1 text-xs text-red-600">
              {errors.content.message}
            </p>
          )}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          Guardar nota
        </button>
      </form>

      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-4 py-2 text-xs font-semibold uppercase text-slate-500">
          Historial
        </div>
        <div className="space-y-3 p-4">
          {loading ? (
            <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
              Cargando notas...
            </div>
          ) : notes.length === 0 ? (
            <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
              No hay notas clínicas aún.
            </div>
          ) : (
            notes.map((note) => (
              <div
                key={note.id}
                className="rounded-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
              >
                <div className="text-xs font-semibold text-slate-500">
                  {formatDate(note.date)}
                </div>
                <div className="mt-1 font-medium">Nota: {note.content}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
