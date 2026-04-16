"use client";

import { useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import AppointmentDetailsModal from "@/components/appointments/AppointmentDetailsModal";

type Appointment = {
  id: string;
  scheduled_at: string;
  duration_minutes: number | null;
  type: string;
  status: string;
  notes?: string | null;
  patients?: { first_name?: string; last_name?: string } | null;
  patient?: { first_name?: string; last_name?: string } | null;
};

type DayCalendarProps = {
  initialDate: string;
};

const START_HOUR = 8;
const END_HOUR = 18;
const MINUTE_HEIGHT = 1.5; // px per minute

export default function DayCalendar({ initialDate }: DayCalendarProps) {
  const [date, setDate] = useState(initialDate);
  const [data, setData] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/appointments/day?date=${date}`);
        if (!response.ok) {
          throw new Error("No se pudieron cargar las citas.");
        }
        const json = await response.json();
        if (active) {
          const normalized = (json.data ?? []).map((item: Appointment) => ({
            id: item.id,
            scheduled_at: item.scheduled_at,
            duration_minutes: item.duration_minutes,
            type: item.type,
            status: item.status,
            notes: item.notes ?? null,
            patient: item.patient ?? item.patients ?? null,
            patients: item.patients ?? null,
          }));
          setData(normalized);
        }
      } catch {
        if (active) {
          setError("No se pudieron cargar las citas.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    run();
    return () => {
      active = false;
    };
  }, [date, refreshKey]);

  const hours = useMemo(() => {
    const list: string[] = [];
    for (let h = START_HOUR; h <= END_HOUR; h += 1) {
      list.push(`${h.toString().padStart(2, "0")}:00`);
    }
    return list;
  }, []);

  const dayStart = useMemo(() => {
    return new Date(`${date}T${START_HOUR.toString().padStart(2, "0")}:00:00`);
  }, [date]);

  const totalMinutes = (END_HOUR - START_HOUR) * 60;
  const containerHeight = totalMinutes * MINUTE_HEIGHT;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Agenda diaria</h2>
          <p className="text-sm text-slate-500">
            {format(parseISO(`${date}T00:00:00`), "dd/MM/yyyy")}
          </p>
        </div>
        <input
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
        />
      </div>

      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="flex">
          <div className="w-20 border-r border-slate-200">
            {hours.map((label) => (
              <div
                key={label}
                className="h-24 border-b border-slate-100 px-3 text-xs text-slate-500 flex items-start pt-2"
              >
                {label}
              </div>
            ))}
          </div>
          <div className="relative flex-1 overflow-y-auto" style={{ maxHeight: "70vh" }}>
            <div
              className="relative"
              style={{ height: `${containerHeight}px` }}
            >
              {hours.map((label, index) => (
                <div
                  key={label}
                  className="border-b border-slate-100"
                  style={{ height: `${60 * MINUTE_HEIGHT}px` }}
                >
                  {index === hours.length - 1 ? null : null}
                </div>
              ))}

              {data.map((appointment) => {
                const start = new Date(appointment.scheduled_at);
                const duration = appointment.duration_minutes ?? 30;
                const minutesFromStart =
                  (start.getHours() - START_HOUR) * 60 + start.getMinutes();
                const top = minutesFromStart * MINUTE_HEIGHT;
                const height = duration * MINUTE_HEIGHT;
                const patientInfo = appointment.patient ?? appointment.patients;
                const patientName = `${patientInfo?.first_name ?? ""} ${
                  patientInfo?.last_name ?? ""
                }`.trim();

                if (top + height < 0 || top > containerHeight) {
                  return null;
                }

                return (
                  <div
                    key={appointment.id}
                    className={`absolute left-4 right-4 rounded-lg border px-3 py-2 text-xs shadow transition ${
                      getStatusClasses(appointment.status)
                    }`}
                    style={{ top: `${top}px`, height: `${height}px` }}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      console.log("[DayCalendar] open appointment:", appointment);
                      setSelected(appointment);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        console.log("[DayCalendar] open appointment:", appointment);
                        setSelected(appointment);
                      }
                    }}
                  >
                    <p className="font-semibold truncate">
                      {patientName || "Paciente"}
                    </p>
                    <p className="text-slate-600 truncate">
                      {appointment.type}
                    </p>
                    <p className="text-slate-500">
                      {format(start, "HH:mm")}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {loading && (
          <div className="border-t border-slate-200 px-4 py-3 text-sm text-slate-500">
            Cargando citas...
          </div>
        )}
        {error && (
          <div className="border-t border-slate-200 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}
        {!loading && !error && data.length === 0 && (
          <div className="border-t border-slate-200 px-4 py-3 text-sm text-slate-500">
            No hay citas para este día.
          </div>
        )}
      </div>

      <AppointmentDetailsModal
        appointment={selected}
        onClose={() => setSelected(null)}
        onUpdated={() => setRefreshKey((value) => value + 1)}
      />
    </div>
  );
}
function getStatusClasses(status: string) {
  switch (status) {
    case "completed":
      return "border-green-200 bg-green-50 text-green-900 hover:bg-green-100";
    case "cancelled":
      return "border-red-200 bg-red-50 text-red-900 hover:bg-red-100";
    default:
      return "border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100";
  }
}
