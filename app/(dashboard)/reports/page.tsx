"use client";

import { useEffect, useState } from "react";

type ReportsResponse = {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
};

const currencyFormatter = new Intl.NumberFormat("es-EC", {
  style: "currency",
  currency: "USD",
});

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadReports() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/reports", {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("No se pudo cargar el reporte.");
        }

        const result = (await response.json()) as ReportsResponse;

        if (active) {
          setData(result);
        }
      } catch (err) {
        if (active) {
          setError("No se pudo cargar el reporte.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadReports();

    return () => {
      active = false;
    };
  }, []);

  const stats = [
    {
      label: "Ingresos totales",
      value: formatCurrency(data?.totalIncome ?? 0),
      helper: "Pagos registrados",
      accent: "from-emerald-400 via-green-400 to-lime-300",
    },
    {
      label: "Egresos",
      value: formatCurrency(data?.totalExpenses ?? 0),
      helper: "Pagos a colegas",
      accent: "from-rose-300 via-orange-300 to-amber-200",
    },
    {
      label: "Balance",
      value: formatCurrency(data?.balance ?? 0),
      helper: "Ingresos menos egresos",
      accent: "from-green-300 via-emerald-300 to-cyan-200",
    },
  ];

  return (
    <section className="space-y-6">
      <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(74,222,128,0.18),_transparent_32%),linear-gradient(135deg,_rgba(15,23,42,0.96),_rgba(15,23,42,0.88))] p-6 text-white shadow-[0_24px_80px_rgba(2,6,23,0.28)] backdrop-blur-xl">
        <div className="space-y-3">
          <span className="inline-flex w-fit items-center rounded-full border border-green-400/20 bg-green-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-green-200">
            Reports
          </span>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-white">
              Resumen financiero
            </h1>
            <p className="max-w-2xl text-sm text-slate-300">
              Vista consolidada de ingresos, egresos y balance general.
            </p>
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-[24px] border border-rose-500/20 bg-rose-500/10 px-5 py-4 text-sm text-rose-200 backdrop-blur-xl">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {stats.map((item) => (
          <div
            key={item.label}
            className="group relative overflow-hidden rounded-[24px] border border-white/10 bg-slate-950/80 p-5 text-white shadow-[0_18px_60px_rgba(15,23,42,0.18)] backdrop-blur-xl"
          >
            <div
              className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${item.accent}`}
            />
            <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-green-400/10 blur-2xl transition group-hover:bg-green-300/15" />
            <div className="relative space-y-3">
              <p className="text-sm font-medium text-slate-300">{item.label}</p>
              <p className="text-3xl font-semibold tracking-tight text-white">
                {loading ? "..." : item.value}
              </p>
              <p className="text-xs text-slate-400">{item.helper}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
