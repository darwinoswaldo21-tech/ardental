"use client";

import { useMemo, useState } from "react";

type Patient = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  id_number?: string | null;
  phone?: string | null;
};

type Invoice = {
  id: string;
  patient_id: string;
  invoice_number?: string | null;
  total?: number | null;
  status?: string | null;
};

type Treatment = {
  id: string;
  patient_id: string;
  status?: string | null;
  appliance_type?: string | null;
  start_date?: string | null;
};

type PaymentRow = {
  id: string;
  patient_id: string;
  invoice_id?: string | null;
  treatment_id?: string | null;
  amount: number;
  payment_method: string;
  concept: string;
  payment_date?: string | null;
  reference?: string | null;
  notes?: string | null;
  created_at?: string | null;
  patients?: Patient | null;
  invoices?: { invoice_number?: string | null } | null;
};

type PaymentsClientProps = {
  patients: Patient[];
  invoices: Invoice[];
  treatments: Treatment[];
  payments: PaymentRow[];
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

export default function PaymentsClient({
  patients,
  invoices,
  treatments,
  payments,
}: PaymentsClientProps) {
  const [patientId, setPatientId] = useState("");
  const [invoiceId, setInvoiceId] = useState("");
  const [treatmentId, setTreatmentId] = useState("");
  const [amount, setAmount] = useState(0);
  const [method, setMethod] = useState(paymentMethods[0].value);
  const [concept, setConcept] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [list, setList] = useState<PaymentRow[]>(payments);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const filteredInvoices = useMemo(() => {
    if (!patientId) return invoices;
    return invoices.filter((invoice) => invoice.patient_id === patientId);
  }, [invoices, patientId]);

  const filteredTreatments = useMemo(() => {
    if (!patientId) return treatments;
    return treatments.filter((treatment) => treatment.patient_id === patientId);
  }, [treatments, patientId]);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (!patientId) {
      setError("Selecciona un paciente.");
      return;
    }
    if (!concept.trim()) {
      setError("Ingresa el concepto del pago.");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: patientId,
          invoice_id: invoiceId || null,
          treatment_id: treatmentId || null,
          amount,
          payment_method: method,
          concept,
          payment_date: paymentDate || null,
          reference: reference || null,
          notes: notes || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "No se pudo registrar el pago.");
      }

      const data = await response.json();
      const patient = patients.find((p) => p.id === patientId);
      const invoice = invoices.find((i) => i.id === invoiceId);

      setList((prev) => [
        {
          ...data.payment,
          patients: patient ?? null,
          invoices: invoice
            ? { invoice_number: invoice.invoice_number ?? "" }
            : null,
        },
        ...prev,
      ]);
      setMessage("Pago registrado correctamente.");
      setInvoiceId("");
      setTreatmentId("");
      setAmount(0);
      setMethod(paymentMethods[0].value);
      setConcept("");
      setPaymentDate("");
      setReference("");
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
        <h1 className="text-xl font-semibold text-slate-900">Pagos</h1>
        <p className="text-sm text-slate-600">
          Registra pagos rapidos y claros.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4"
      >
        <p className="text-xs text-slate-500">
          Los campos con * son obligatorios.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Paciente <span className="text-red-600">*</span>
            </label>
            <select
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={patientId}
              onChange={(event) => setPatientId(event.target.value)}
            >
              <option value="">Selecciona un paciente</option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.first_name} {patient.last_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Factura (opcional)
            </label>
            <select
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={invoiceId}
              onChange={(event) => setInvoiceId(event.target.value)}
            >
              <option value="">Selecciona una factura</option>
              {filteredInvoices.map((invoice) => (
                <option key={invoice.id} value={invoice.id}>
                  {invoice.invoice_number ?? invoice.id.slice(0, 8)} -{" "}
                  {currency.format(invoice.total ?? 0)}
                </option>
              ))}
            </select>
          </div>
        </div>

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
              {paymentMethods.map((methodOption) => (
                <option key={methodOption.value} value={methodOption.value}>
                  {methodOption.label}
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
            Concepto <span className="text-red-600">*</span>
          </label>
          <input
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={concept}
            onChange={(event) => setConcept(event.target.value)}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              ID de tratamiento (opcional)
            </label>
            <select
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={treatmentId}
              onChange={(event) => setTreatmentId(event.target.value)}
            >
              <option value="">Selecciona tratamiento (opcional)</option>
              {filteredTreatments.map((treatment) => (
                <option key={treatment.id} value={treatment.id}>
                  {treatment.appliance_type ?? "Tratamiento"} -{" "}
                  {treatment.start_date ?? "sin fecha"}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Referencia
            </label>
            <input
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={reference}
              onChange={(event) => setReference(event.target.value)}
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
          <div className="col-span-4">Paciente</div>
          <div className="col-span-2">Factura</div>
          <div className="col-span-2">Monto</div>
          <div className="col-span-2">Metodo</div>
          <div className="col-span-2">Fecha</div>
        </div>
        <div className="divide-y divide-slate-200">
          {list.length > 0 ? (
            list.map((payment) => {
              const patient = payment.patients;
              const name = patient
                ? `${patient.first_name ?? ""} ${patient.last_name ?? ""}`.trim()
                : "Paciente";
              return (
                <div
                  key={payment.id}
                  className="grid grid-cols-12 gap-2 px-4 py-3 text-sm text-slate-700"
                >
                  <div className="col-span-4">
                    <div className="font-medium">{name || "Paciente"}</div>
                    <div className="text-xs text-slate-500">
                      {patient?.id_number ?? "-"} {"\u00b7"}{" "}
                      {patient?.phone ?? "-"}
                    </div>
                  </div>
                  <div className="col-span-2">
                    {payment.invoices?.invoice_number ?? "-"}
                  </div>
                  <div className="col-span-2">
                    {currency.format(payment.amount ?? 0)}
                  </div>
                  <div className="col-span-2">
                    {paymentMethodLabels[payment.payment_method] ??
                      payment.payment_method}
                  </div>
                  <div className="col-span-2">
                    {payment.payment_date ??
                      (payment.created_at
                        ? new Date(payment.created_at).toLocaleDateString()
                        : "-")}
                  </div>
                </div>
              );
            })
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
