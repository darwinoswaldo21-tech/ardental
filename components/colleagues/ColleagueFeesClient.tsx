"use client";

import { useState } from "react";

type Colleague = {
  id: string;
  full_name: string;
};

type FeeRow = {
  id: string;
  colleague_id: string;
  amount: number;
  payment_date?: string | null;
  payment_method: string;
  notes?: string | null;
  created_at?: string | null;
};

type ColleagueFeesClientProps = {
  colleague: Colleague;
  fees: FeeRow[];
};

const currency = new Intl.NumberFormat("es-EC", {
  style: "currency",
  currency: "USD",
});

const paymentMethods = [
  { value: "cash", label: "Efectivo" },
  { value: "transfer", label: "Transferencia" },
  { value: "card", label: "Tarjeta" },
  { value: "other", label: "Otro" },
];

const paymentMethodLabels: Record<string, string> = {
  cash: "Efectivo",
  transfer: "Transferencia",
  card: "Tarjeta",
  other: "Otro",
};

export default function ColleagueFeesClient({
  colleague,
  fees,
}: ColleagueFeesClientProps) {
  const [amount, setAmount] = useState(0);
  const [method, setMethod] = useState(paymentMethods[0].value);
  const [paymentDate, setPaymentDate] = useState("");
  const [notes, setNotes] = useState("");
  const [list, setList] = useState<FeeRow[]>(fees);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (!amount || amount <= 0) {
      setError("Ingresa un monto valido.");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/colleague-fees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          colleague_id: colleague.id,
          amount,
          payment_method: method,
          payment_date: paymentDate || null,
          notes: notes || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "No se pudo registrar el pago.");
      }

      const data = await response.json();
      setList((prev) => [data.fee, ...prev]);
      setMessage("Pago registrado correctamente.");
      setAmount(0);
      setMethod(paymentMethods[0].value);
      setPaymentDate("");
      setNotes("");
    } catch (err: any) {
      setError(err.message ?? "No se pudo registrar el pago.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">
          Honorarios de {colleague.full_name}
        </h2>
        <p className="text-sm text-slate-600">
          Registra pagos realizados a este colega.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4"
      >
        <p className="text-xs text-slate-500">
          Los campos con * son obligatorios.
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Monto <span className="text-red-600">*</span>
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={amount}
              onChange={(event) => setAmount(Number(event.target.value))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Metodo <span className="text-red-600">*</span>
            </label>
            <select
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={method}
              onChange={(event) => setMethod(event.target.value)}
            >
              {paymentMethods.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Fecha
            </label>
            <input
              type="date"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={paymentDate}
              onChange={(event) => setPaymentDate(event.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            Notas
          </label>
          <textarea
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            rows={3}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </div>

        {message && <p className="text-sm text-slate-600">{message}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {isSaving ? "Guardando..." : "Registrar pago"}
          </button>
        </div>
      </form>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="grid grid-cols-12 gap-2 border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase text-slate-500">
          <div className="col-span-3">Fecha</div>
          <div className="col-span-3">Metodo</div>
          <div className="col-span-3">Monto</div>
          <div className="col-span-3">Notas</div>
        </div>
        <div className="divide-y divide-slate-200">
          {list.length > 0 ? (
            list.map((fee) => (
              <div
                key={fee.id}
                className="grid grid-cols-12 gap-2 px-4 py-3 text-sm text-slate-700"
              >
                <div className="col-span-3">
                  {fee.payment_date ??
                    (fee.created_at
                      ? new Date(fee.created_at).toLocaleDateString()
                      : "-")}
                </div>
                <div className="col-span-3">
                  {paymentMethodLabels[fee.payment_method] ?? fee.payment_method}
                </div>
                <div className="col-span-3">
                  {currency.format(fee.amount ?? 0)}
                </div>
                <div className="col-span-3">{fee.notes ?? "-"}</div>
              </div>
            ))
          ) : (
            <div className="px-4 py-6 text-sm text-slate-500">
              No hay pagos registrados.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
