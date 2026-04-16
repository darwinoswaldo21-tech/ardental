"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Invoice = {
  id: string;
  invoice_number: string | null;
  total: number | null;
  status: string | null;
  created_at: string | null;
  patients?: {
    first_name?: string | null;
    last_name?: string | null;
    id_number?: string | null;
    phone?: string | null;
  } | null;
};

type DashboardResponse = {
  totalPatients: number;
  todayAppointments: number;
  monthlyIncome: number;
  totalColleaguePayments: number;
  recentInvoices: Invoice[];
};

const currencyFormatter = new Intl.NumberFormat("es-EC", {
  style: "currency",
  currency: "USD",
});

const dateFormatter = new Intl.DateTimeFormat("es-EC", {
  dateStyle: "medium",
});

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

function formatDate(value: string | null) {
  if (!value) {
    return "Sin fecha";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Sin fecha";
  }

  return dateFormatter.format(date);
}

function getPatientName(invoice: Invoice) {
  const firstName = invoice.patients?.first_name?.trim() ?? "";
  const lastName = invoice.patients?.last_name?.trim() ?? "";
  const fullName = `${firstName} ${lastName}`.trim();

  return fullName || "Paciente sin nombre";
}

function getStatusClasses(status: string | null) {
  switch (status) {
    case "paid":
      return "border-green-500/30 bg-green-500/15 text-green-200";
    case "cancelled":
      return "border-rose-500/30 bg-rose-500/15 text-rose-200";
    case "active":
      return "border-emerald-500/30 bg-emerald-500/15 text-emerald-200";
    default:
      return "border-white/10 bg-white/5 text-slate-300";
  }
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/dashboard", {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("No se pudo cargar el dashboard.");
        }

        const result = (await response.json()) as DashboardResponse;

        if (active) {
          setData(result);
        }
      } catch (err) {
        if (active) {
          setError("No se pudo cargar el dashboard.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, []);

  const stats = [
    {
      label: "Pacientes",
      value: data?.totalPatients ?? 0,
      accent: "from-emerald-400 via-green-400 to-lime-300",
      helper: "Registros totales",
    },
    {
      label: "Citas de hoy",
      value: data?.todayAppointments ?? 0,
      accent: "from-green-300 via-emerald-300 to-teal-200",
      helper: "Agenda del dia",
    },
    {
      label: "Ingresos del mes",
      value: formatCurrency(data?.monthlyIncome ?? 0),
      accent: "from-lime-300 via-green-300 to-emerald-200",
      helper: "Pagos registrados este mes",
    },
    {
      label: "Pagos a colegas",
      value: formatCurrency(data?.totalColleaguePayments ?? 0),
      accent: "from-emerald-300 via-teal-300 to-cyan-200",
      helper: "Acumulado total",
    },
  ];

  return (
    <section className="space-y-6">
      <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(74,222,128,0.18),_transparent_32%),linear-gradient(135deg,_rgba(15,23,42,0.96),_rgba(15,23,42,0.88))] p-6 text-white shadow-[0_24px_80px_rgba(2,6,23,0.28)] backdrop-blur-xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <span className="inline-flex w-fit items-center rounded-full border border-green-400/20 bg-green-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-green-200">
              Dashboard
            </span>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-white">
                Resumen general de ArDental
              </h1>
              <p className="max-w-2xl text-sm text-slate-300">
                Vista rapida de pacientes, citas, ingresos y facturacion reciente.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Link
              href="/appointments/new"
              className="inline-flex items-center justify-center rounded-xl bg-green-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-green-400"
            >
              Nueva cita
            </Link>
            <Link
              href="/finance/invoices"
              className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Ver facturas
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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

      <div className="rounded-[28px] border border-white/10 bg-slate-950/80 shadow-[0_24px_80px_rgba(15,23,42,0.18)] backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-white">Facturas recientes</h2>
            <p className="text-sm text-slate-400">
              Ultimas 5 facturas ordenadas por fecha de creacion.
            </p>
          </div>
          <Link
            href="/finance/invoices"
            className="text-sm font-medium text-green-300 transition hover:text-green-200"
          >
            Ver todas
          </Link>
        </div>

        {error ? (
          <div className="px-6 py-10 text-sm text-rose-300">{error}</div>
        ) : loading ? (
          <div className="grid gap-3 px-6 py-6">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="h-20 animate-pulse rounded-2xl border border-white/10 bg-white/5"
              />
            ))}
          </div>
        ) : data?.recentInvoices?.length ? (
          <div className="grid gap-3 p-4">
            {data.recentInvoices.map((invoice) => (
              <div
                key={invoice.id}
                className="grid gap-4 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 transition hover:border-green-400/20 hover:bg-white/[0.05] md:grid-cols-[1.4fr_1fr_auto_auto]"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">
                    {invoice.invoice_number || "Factura sin numero"}
                  </p>
                  <p className="truncate text-sm text-slate-300">
                    {getPatientName(invoice)}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    Fecha
                  </p>
                  <p className="mt-1 text-sm text-slate-200">
                    {formatDate(invoice.created_at)}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    Total
                  </p>
                  <p className="mt-1 text-sm font-semibold text-green-300">
                    {formatCurrency(Number(invoice.total ?? 0))}
                  </p>
                </div>

                <div className="flex items-center md:justify-end">
                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold capitalize ${getStatusClasses(
                      invoice.status
                    )}`}
                  >
                    {invoice.status || "sin estado"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-10 text-sm text-slate-400">
            No hay facturas recientes.
          </div>
        )}
      </div>
    </section>
  );
}
