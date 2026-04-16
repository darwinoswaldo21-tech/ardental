"use client";

import { useEffect, useState } from "react";

type Adjustment = {
  id: string;
  adjustment_date: string;
  upper_arch?: string | null;
  lower_arch?: string | null;
  elastics?: string | null;
  observations?: string | null;
  next_appointment_notes?: string | null;
  appointment_id?: string | null;
};

type OrthodonticAdjustmentsSectionProps = {
  patientId: string;
};

export default function OrthodonticAdjustmentsSection({
  patientId,
}: OrthodonticAdjustmentsSectionProps) {
  const [treatmentId, setTreatmentId] = useState<string | null>(null);
  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [detectedAppointment, setDetectedAppointment] = useState<{
    id: string;
    scheduled_at: string;
  } | null>(null);

  const [form, setForm] = useState({
    adjustment_date: "",
    upper_arch: "",
    lower_arch: "",
    elastics: "",
    observations: "",
    next_appointment_notes: "",
    appointment_id: "",
  });

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      setSuccess(null);
      const treatmentResponse = await fetch(
        `/api/orthodontic-treatments?patientId=${patientId}`
      );
      if (!treatmentResponse.ok) {
        const data = await treatmentResponse.json().catch(() => ({}));
        if (!active) return;
        setError(data.error ?? "No se pudo cargar el tratamiento.");
        setLoading(false);
        return;
      }
      const treatmentJson = await treatmentResponse.json();
      const treatment = treatmentJson?.treatment;
      if (!active) return;
      if (!treatment?.id) {
        setTreatmentId(null);
        setAdjustments([]);
        setLoading(false);
        return;
      }

      setTreatmentId(treatment.id);
      const appointmentResponse = await fetch(
        `/api/orthodontic-appointments?patientId=${patientId}`
      );
      if (appointmentResponse.ok) {
        const data = await appointmentResponse.json();
        const appointment = data?.appointment;
        if (appointment?.id) {
          setDetectedAppointment(appointment);
          setForm((prev) => ({
            ...prev,
            appointment_id: prev.appointment_id || appointment.id,
            adjustment_date:
              prev.adjustment_date ||
              new Date(appointment.scheduled_at).toISOString().slice(0, 10),
          }));
        }
      }

      const response = await fetch(
        `/api/orthodontic-adjustments?treatmentId=${treatment.id}`
      );
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        if (!active) return;
        setError(data.error ?? "No se pudieron cargar los ajustes.");
        setLoading(false);
        return;
      }
      const json = await response.json();
      setAdjustments(json.adjustments ?? []);
      setLoading(false);
    };
    load();
    return () => {
      active = false;
    };
  }, [patientId]);

  const onChange = (
    field:
      | "adjustment_date"
      | "upper_arch"
      | "lower_arch"
      | "elastics"
      | "observations"
      | "next_appointment_notes"
      | "appointment_id",
    value: string
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!treatmentId) {
      setError("Primero crea un tratamiento para registrar ajustes.");
      return;
    }
    if (!form.adjustment_date) {
      setError("La fecha del ajuste es obligatoria.");
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(null);
    const payload = {
      treatment_id: treatmentId,
      appointment_id: form.appointment_id || null,
      adjustment_date: form.adjustment_date,
      upper_arch: form.upper_arch || null,
      lower_arch: form.lower_arch || null,
      elastics: form.elastics || null,
      observations: form.observations || null,
      next_appointment_notes: form.next_appointment_notes || null,
    };

    const response = await fetch("/api/orthodontic-adjustments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error ?? "No se pudo guardar el ajuste.");
      setSaving(false);
      return;
    }

    setSuccess("Ajuste guardado correctamente.");
    setForm({
      adjustment_date: "",
      upper_arch: "",
      lower_arch: "",
      elastics: "",
      observations: "",
      next_appointment_notes: "",
      appointment_id: "",
    });

    const listResponse = await fetch(
      `/api/orthodontic-adjustments?treatmentId=${treatmentId}`
    );
    if (listResponse.ok) {
      const data = await listResponse.json();
      setAdjustments(data.adjustments ?? []);
    }
    setSaving(false);
  };

  if (loading) {
    return <p className="text-sm text-slate-500">Cargando ajustes...</p>;
  }

  if (!treatmentId) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
        Crea un tratamiento para registrar ajustes.
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            Controles y ajustes
          </h3>
          <p className="text-xs text-slate-500">
            Registra cada visita de ortodoncia.
          </p>
          <p className="text-xs text-slate-500">
            Los campos con * son obligatorios.
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
        {detectedAppointment ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Cita detectada: {detectedAppointment.id.slice(0, 8)}… (
            {new Date(detectedAppointment.scheduled_at).toLocaleDateString()})
          </div>
        ) : null}
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500">
              Fecha del ajuste *
            </label>
            <input
              type="date"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={form.adjustment_date}
              onChange={(event) => onChange("adjustment_date", event.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500">
              ID de cita (opcional)
            </label>
            <input
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={form.appointment_id}
              onChange={(event) => onChange("appointment_id", event.target.value)}
              placeholder="Pegalo si quieres ligar con la cita"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500">
              Arco superior
            </label>
            <input
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={form.upper_arch}
              onChange={(event) => onChange("upper_arch", event.target.value)}
              placeholder="Ej: 0.016 NiTi"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500">
              Arco inferior
            </label>
            <input
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={form.lower_arch}
              onChange={(event) => onChange("lower_arch", event.target.value)}
              placeholder="Ej: 0.014 NiTi"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500">
              ElÃ¡sticos
            </label>
            <input
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={form.elastics}
              onChange={(event) => onChange("elastics", event.target.value)}
              placeholder="Tipo, fuerza, uso"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500">
              Observaciones
            </label>
            <input
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={form.observations}
              onChange={(event) => onChange("observations", event.target.value)}
              placeholder="EvoluciÃ³n, hallazgos"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-slate-500">
            Notas para prÃ³xima cita
          </label>
          <textarea
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            rows={2}
            value={form.next_appointment_notes}
            onChange={(event) =>
              onChange("next_appointment_notes", event.target.value)
            }
          />
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? "Guardando..." : "Guardar ajuste"}
          </button>
        </div>
      </form>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="text-xs font-semibold uppercase text-slate-500">
          Historial de ajustes
        </div>
        {adjustments.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">
            No hay ajustes registrados.
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {adjustments.map((item) => (
              <div
                key={item.id}
                className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">
                    {item.adjustment_date}
                  </span>
                  {item.appointment_id ? (
                    <span className="text-xs text-slate-500">
                      Cita: {item.appointment_id.slice(0, 8)}...
                    </span>
                  ) : null}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {item.observations ?? "Sin observaciones"}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-600">{success}</p> : null}
    </section>
  );
}
