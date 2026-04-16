"use client";

import React from "react";
import Link from "next/link";
import { format } from "date-fns";
import DayCalendar from "@/components/appointments/DayCalendar";
import WeeklyCalendar from "@/components/appointments/WeeklyCalendar";

export default function AppointmentsPage() {
  const today = format(new Date(), "yyyy-MM-dd");

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Citas</h1>
          <p className="text-sm text-slate-600">Agenda básica</p>
        </div>
        <Link
          href="/appointments/new"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Nueva cita
        </Link>
      </div>

      <AppointmentsToggle initialDate={today} />
    </section>
  );
}

function AppointmentsToggle({ initialDate }: { initialDate: string }) {
  const [view, setView] = React.useState<"day" | "week">("day");

  return (
    <div className="space-y-4">
      <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
        <button
          type="button"
          onClick={() => setView("day")}
          className={`px-4 py-2 text-sm font-medium rounded-md ${
            view === "day"
              ? "bg-blue-600 text-white"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Diario
        </button>
        <button
          type="button"
          onClick={() => setView("week")}
          className={`px-4 py-2 text-sm font-medium rounded-md ${
            view === "week"
              ? "bg-blue-600 text-white"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Semanal
        </button>
      </div>

      {view === "day" ? (
        <DayCalendar initialDate={initialDate} />
      ) : (
        <WeeklyCalendar initialDate={initialDate} />
      )}
    </div>
  );
}
