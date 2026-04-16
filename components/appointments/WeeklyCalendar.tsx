"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addDays,
  format,
  parseISO,
  startOfWeek,
} from "date-fns";
import AppointmentDetailsModal from "@/components/appointments/AppointmentDetailsModal";

type Appointment = {
  id: string;
  scheduled_at: string;
  duration_minutes: number | null;
  type: string;
  status: string;
  notes?: string | null;
  patient?: { first_name?: string; last_name?: string } | null;
  patients?: { first_name?: string; last_name?: string } | null;
};

type WeeklyCalendarProps = {
  initialDate: string;
};

const START_HOUR = 8;
const END_HOUR = 18;
const MINUTE_HEIGHT = 1.5; // px per minute

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

export default function WeeklyCalendar({ initialDate }: WeeklyCalendarProps) {
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
        const response = await fetch(`/api/appointments/week?date=${date}`);
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

  const weekStart = useMemo(
    () => startOfWeek(parseISO(`${date}T00:00:00`), { weekStartsOn: 1 }),
    [date]
  );

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  const totalMinutes = (END_HOUR - START_HOUR) * 60;
  const containerHeight = totalMinutes * MINUTE_HEIGHT;

  const byDay = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    days.forEach((day) => {
      map.set(format(day, "yyyy-MM-dd"), []);
    });
    data.forEach((appointment) => {
      const key = format(new Date(appointment.scheduled_at), "yyyy-MM-dd");
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)?.push(appointment);
    });
    return map;
  }, [data, days]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Agenda semanal</h2>
          <p className="text-sm text-slate-500">
            Semana del {format(weekStart, "dd/MM/yyyy")}
          </p>
        </div>
        <input
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
        />
      </div>

      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
        <div className="grid grid-cols-[80px_repeat(7,1fr)] border-b border-slate-200 text-xs font-semibold uppercase text-slate-500">
          <div className="px-3 py-2">Hora</div>
          {days.map((day) => (
            <div key={day.toISOString()} className="px-3 py-2 border-l border-slate-200">
              <div className="text-slate-700 font-medium">
                {format(day, "EEE")}
              </div>
              <div>{format(day, "dd/MM")}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-[80px_repeat(7,1fr)]">
          <div className="border-r border-slate-200">
            {hours.map((label) => (
              <div
                key={label}
                className="h-24 border-b border-slate-100 px-3 text-xs text-slate-500 flex items-start pt-2"
              >
                {label}
              </div>
            ))}
          </div>
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const dayAppointments = byDay.get(key) ?? [];
            return (
              <div
                key={key}
                className="relative border-l border-slate-200"
                style={{ height: `${containerHeight}px` }}
              >
                {hours.map((label) => (
                  <div
                    key={`${key}-${label}`}
                    className="border-b border-slate-100"
                    style={{ height: `${60 * MINUTE_HEIGHT}px` }}
                  />
                ))}

                {dayAppointments.map((appointment) => {
                  const start = new Date(appointment.scheduled_at);
                  const duration = appointment.duration_minutes ?? 30;
                  const minutesFromStart =
                    (start.getHours() - START_HOUR) * 60 + start.getMinutes();
                  const top = minutesFromStart * MINUTE_HEIGHT;
                  const height = duration * MINUTE_HEIGHT;
                  const patientInfo =
                    appointment.patient ?? appointment.patients ?? null;
                  const patientName = `${patientInfo?.first_name ?? ""} ${
                    patientInfo?.last_name ?? ""
                  }`.trim();

                  if (top + height < 0 || top > containerHeight) {
                    return null;
                  }

                  return (
                    <div
                      key={appointment.id}
                      className={`absolute left-2 right-2 rounded-lg border px-2 py-1 text-[11px] shadow transition ${getStatusClasses(
                        appointment.status
                      )}`}
                      style={{ top: `${top}px`, height: `${height}px` }}
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        console.log("[WeeklyCalendar] open appointment:", appointment);
                        setSelected(appointment);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          console.log("[WeeklyCalendar] open appointment:", appointment);
                          setSelected(appointment);
                        }
                      }}
                    >
                      <p className="font-semibold text-slate-900 truncate">
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
            );
          })}
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
      </div>

      <AppointmentDetailsModal
        appointment={selected}
        onClose={() => setSelected(null)}
        onUpdated={() => setRefreshKey((value) => value + 1)}
      />
    </div>
  );
}
