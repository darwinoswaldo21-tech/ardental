"use client";

import { format } from "date-fns";
import { useEffect, useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { appointmentUpdateSchema } from "@/lib/validations/appointments";

type AppointmentDetails = {
  id: string;
  scheduled_at: string;
  duration_minutes: number | null;
  type: string;
  status: string;
  notes?: string | null;
  patient?: { first_name?: string; last_name?: string } | null;
  patients?: { first_name?: string; last_name?: string } | null;
};

type AppointmentDetailsModalProps = {
  appointment: AppointmentDetails | null;
  onClose: () => void;
  onUpdated?: () => void;
};

export default function AppointmentDetailsModal({
  appointment,
  onClose,
  onUpdated,
}: AppointmentDetailsModalProps) {
  if (!appointment) return null;

  const patientInfo = appointment.patient ?? appointment.patients ?? null;
  const patientName = `${patientInfo?.first_name ?? ""} ${
    patientInfo?.last_name ?? ""
  }`.trim();

  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formSchema = appointmentUpdateSchema;

  type FormValues = z.infer<typeof formSchema>;

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting, errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      scheduled_at: format(new Date(appointment.scheduled_at), "yyyy-MM-dd'T'HH:mm"),
      duration_minutes: appointment.duration_minutes ?? 30,
      type: appointment.type,
      status: appointment.status as FormValues["status"],
      notes: appointment.notes ?? "",
    },
  });

  useEffect(() => {
    console.log("[AppointmentDetailsModal] received appointment:", appointment);
    reset({
      scheduled_at: format(new Date(appointment.scheduled_at), "yyyy-MM-dd'T'HH:mm"),
      duration_minutes: appointment.duration_minutes ?? 30,
      type: appointment.type,
      status: appointment.status as FormValues["status"],
      notes: appointment.notes ?? "",
    });
    setIsEditing(false);
    setError(null);
  }, [appointment, reset]);

  const onSubmit = async (values: FormValues) => {
    setError(null);
    console.log("ID enviado desde frontend:", appointment.id);
    const response = await fetch(`/api/appointments/${appointment.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      const json = await response.json().catch(() => null);
      setError(json?.error ?? "No se pudo actualizar la cita.");
      return;
    }

    setIsEditing(false);
    onUpdated?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-slate-900/30 backdrop-blur-[1px] transition-opacity"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-lg border border-slate-200 animate-[fadeIn_0.15s_ease-out]">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">
            Detalle de cita
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-slate-500 hover:text-slate-800"
          >
            Cerrar
          </button>
        </div>

        {!isEditing ? (
          <div className="mt-4 space-y-3 text-sm text-slate-700">
            <div>
              <p className="text-xs uppercase text-slate-400">Paciente</p>
              <p className="font-medium text-slate-900">
                {patientName || "Paciente"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase text-slate-400">Tipo</p>
              <p>{appointment.type}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-slate-400">Fecha y hora</p>
              <p>
                {format(new Date(appointment.scheduled_at), "dd/MM/yyyy HH:mm")}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase text-slate-400">DuraciÃ³n</p>
              <p>{appointment.duration_minutes ?? 30} min</p>
            </div>
            <div>
              <p className="text-xs uppercase text-slate-400">Estado</p>
              <p className="capitalize">{appointment.status}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-slate-400">Notas</p>
              <p className="text-slate-600">
                {appointment.notes ? appointment.notes : "Sin notas"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="mt-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Editar cita
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-3 text-sm text-slate-700">
            <div>
              <label className="text-xs uppercase text-slate-400 block">
                Fecha y hora
              </label>
              <input
                type="datetime-local"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                {...register("scheduled_at")}
              />
              {errors.scheduled_at && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.scheduled_at.message}
                </p>
              )}
            </div>
            <div>
              <label className="text-xs uppercase text-slate-400 block">
                DuraciÃ³n (min)
              </label>
              <input
                type="number"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                {...register("duration_minutes")}
              />
              {errors.duration_minutes && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.duration_minutes.message}
                </p>
              )}
            </div>
            <div>
              <label className="text-xs uppercase text-slate-400 block">
                Tipo
              </label>
              <select
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                {...register("type")}
              >
                <option value="consulta_inicial">Consulta inicial</option>
                <option value="limpieza">Limpieza</option>
                <option value="extraccion">ExtracciÃ³n</option>
                <option value="ajuste_ortodoncia">Ajuste ortodoncia</option>
                <option value="control">Control</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <div>
              <label className="text-xs uppercase text-slate-400 block">
                Estado
              </label>
              <select
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                {...register("status")}
              >
                <option value="pending">Pendiente</option>
                <option value="confirmed">Confirmada</option>
                <option value="completed">Completada</option>
                <option value="cancelled">Cancelada</option>
                <option value="no_show">No asistiÃ³</option>
              </select>
            </div>
            <div>
              <label className="text-xs uppercase text-slate-400 block">
                Notas
              </label>
              <textarea
                rows={3}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                {...register("notes")}
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
              >
                Guardar
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
