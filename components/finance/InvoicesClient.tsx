"use client";

import { useMemo, useState } from "react";

type Patient = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  id_number?: string | null;
  phone?: string | null;
};

type Service = {
  id: string;
  name: string;
  description?: string | null;
  base_price?: number | null;
};

type BudgetRow = {
  id: string;
  patient_id: string;
  items: any[];
  subtotal?: number | null;
  discount?: number | null;
  total?: number | null;
};

type InvoiceRow = {
  id: string;
  patient_id: string;
  budget_id?: string | null;
  invoice_number?: string | null;
  items: any[];
  subtotal?: number | null;
  discount?: number | null;
  total?: number | null;
  status?: string | null;
  created_at?: string | null;
  patients?: Patient | null;
};

type ItemRow = {
  kind: "service" | "manual";
  service_id: string;
  description: string;
  quantity: number;
  unit_price: number;
};

type InvoicesClientProps = {
  patients: Patient[];
  services: Service[];
  budgets: BudgetRow[];
  invoices: InvoiceRow[];
};

const statusOptions = [
  { value: "active", label: "Activa" },
  { value: "cancelled", label: "Anulada" },
];

const currency = new Intl.NumberFormat("es-EC", {
  style: "currency",
  currency: "USD",
});

export default function InvoicesClient({
  patients,
  services,
  budgets,
  invoices,
}: InvoicesClientProps) {
  const [mode, setMode] = useState<"direct" | "budget">("direct");
  const [patientId, setPatientId] = useState("");
  const [budgetId, setBudgetId] = useState("");
  const [items, setItems] = useState<ItemRow[]>([
    {
      kind: "service",
      service_id: "",
      description: "",
      quantity: 1,
      unit_price: 0,
    },
  ]);
  const [discount, setDiscount] = useState<string>("");
  const [status, setStatus] = useState("active");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [list, setList] = useState<InvoiceRow[]>(invoices);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [itemErrors, setItemErrors] = useState<
    {
      service?: string | null;
      description?: string | null;
      quantity?: string | null;
      unit_price?: string | null;
    }[]
  >([]);
  const [discountError, setDiscountError] = useState<string | null>(null);

  const computeSubtotal = (list: ItemRow[]) =>
    list.reduce((acc, item) => acc + item.quantity * item.unit_price, 0);

  const totals = useMemo(() => {
    const subtotal = computeSubtotal(items);
    const discountValue = discount.trim() === "" ? 0 : Number(discount);
    const total = subtotal - discountValue;
    return { subtotal, total };
  }, [items, discount]);

  const onChangeItem = (index: number, patch: Partial<ItemRow>) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item))
    );
    setItemErrors((prev) =>
      (prev.length === items.length
        ? prev
        : items.map(() => ({
            service: null,
            description: null,
            quantity: null,
            unit_price: null,
          }))).map((err, i) => {
        if (i !== index) return err;
        const nextKind = patch.kind ?? items[index]?.kind;
        const next = { ...(err ?? {}) };
        if (patch.kind !== undefined) {
          if (patch.kind === "manual") {
            next.service = null;
            next.description =
              (patch.description ?? items[index]?.description ?? "").trim() ===
              ""
                ? "Descripcion requerida"
                : null;
          } else {
            next.description = null;
            const currentService =
              patch.service_id ?? items[index]?.service_id ?? "";
            next.service =
              currentService === "" ? "Selecciona un servicio" : null;
          }
        }
        if (patch.service_id !== undefined) {
          next.service =
            nextKind === "service" && !patch.service_id
              ? "Selecciona un servicio"
              : null;
        }
        if (patch.description !== undefined) {
          next.description =
            nextKind === "manual" && patch.description.trim() === ""
              ? "Descripcion requerida"
              : null;
        }
        if (patch.quantity !== undefined) {
          next.quantity = patch.quantity < 1 ? "Minimo 1" : null;
        }
        if (patch.unit_price !== undefined) {
          next.unit_price = patch.unit_price <= 0 ? "Mayor a 0" : null;
        }
        return next;
      })
    );
  };

  const onAddItem = (kind: "service" | "manual") => {
    setItems((prev) => [
      ...prev,
      {
        kind,
        service_id: "",
        description: "",
        quantity: 1,
        unit_price: 0,
      },
    ]);
    setItemErrors((prev) => [
      ...prev,
      { service: null, description: null, quantity: null, unit_price: null },
    ]);
  };

  const onRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
    setItemErrors((prev) => prev.filter((_, i) => i !== index));
  };

  const onSelectService = (index: number, serviceId: string) => {
    const service = services.find((s) => s.id === serviceId);
    onChangeItem(index, {
      kind: "service",
      service_id: serviceId,
      description: service?.name ?? "",
      unit_price: service?.base_price ?? 0,
    });
  };

  const onSelectBudget = (value: string) => {
    setBudgetId(value);
    if (!value) {
      setItems([
        {
          kind: "service",
          service_id: "",
          description: "",
          quantity: 1,
          unit_price: 0,
        },
      ]);
      setDiscount("");
      return;
    }
    const budget = budgets.find((b) => b.id === value);
    if (!budget) return;
    setPatientId(budget.patient_id);
    setDiscount(
      budget.discount === null || budget.discount === undefined
        ? ""
        : String(budget.discount)
    );
    const parsedItems =
      (budget.items as any[])?.map((item) => ({
        kind: item.service_id ? "service" : "manual",
        service_id: item.service_id ?? "",
        description: item.description ?? "",
        quantity: Number(item.quantity ?? 1),
        unit_price: Number(item.unit_price ?? 0),
      })) ?? [];
    setItems(
      parsedItems.length > 0
        ? parsedItems
        : [
            {
              kind: "service",
              service_id: "",
              description: "",
              quantity: 1,
              unit_price: 0,
            },
          ]
    );
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setDiscountError(null);

    if (!patientId) {
      setError("Selecciona un paciente.");
      return;
    }

    const validationErrors = items.map((item) => {
      const serviceError =
        item.kind === "service" && !item.service_id
          ? "Selecciona un servicio"
          : null;
      const descriptionError =
        item.kind === "manual" && item.description.trim() === ""
          ? "Descripcion requerida"
          : null;
      const quantityError = item.quantity < 1 ? "Minimo 1" : null;
      const priceError = item.unit_price <= 0 ? "Mayor a 0" : null;
      return {
        service: serviceError,
        description: descriptionError,
        quantity: quantityError,
        unit_price: priceError,
      };
    });
    setItemErrors(validationErrors);

    const cleanedItems = items
      .filter((item) =>
        item.kind === "service"
          ? item.service_id !== ""
          : item.description.trim() !== ""
      )
      .map((item) => ({
        service_id: item.kind === "service" ? item.service_id || null : null,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.quantity * item.unit_price,
      }));

    if (cleanedItems.length === 0) {
      setError("Agrega al menos un item.");
      return;
    }

    const invalidService = items.some(
      (item) =>
        (item.kind === "service" && !item.service_id) ||
        (item.kind === "manual" && item.description.trim() === "")
    );
    if (invalidService) {
      setError("Selecciona un servicio o escribe una descripcion.");
      return;
    }

    const invalidQty = cleanedItems.some((item) => item.quantity < 1);
    if (invalidQty) {
      setError("Revisa los campos marcados.");
      return;
    }

    const invalidPrice = cleanedItems.some((item) => item.unit_price <= 0);
    if (invalidPrice) {
      setError("Revisa los campos marcados.");
      return;
    }

    const discountValue = discount.trim() === "" ? 0 : Number(discount);
    const currentSubtotal = computeSubtotal(items);
    if (discountValue > currentSubtotal) {
      setDiscountError("No puede superar el subtotal.");
      setError("El descuento no puede superar el subtotal.");
      return;
    }

    if (totals.total <= 0) {
      setError("El total debe ser mayor a 0.");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: patientId,
          budget_id: mode === "budget" ? budgetId || null : null,
          invoice_number: invoiceNumber || null,
          items: cleanedItems,
          discount: discountValue,
          status,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "No se pudo crear la factura.");
      }

      const data = await response.json();
      const patient = patients.find((p) => p.id === patientId);

      setList((prev) => [
        {
          ...data.invoice,
          patients: patient ?? null,
        },
        ...prev,
      ]);
      setMessage("Factura creada correctamente.");
      setPatientId("");
      setBudgetId("");
      setItems([
        {
          kind: "service",
          service_id: "",
          description: "",
          quantity: 1,
          unit_price: 0,
        },
      ]);
      setDiscount("");
      setStatus("active");
      setInvoiceNumber("");
    } catch (err: any) {
      setError(err.message ?? "No se pudo crear la factura.");
    } finally {
      setIsSaving(false);
    }
  };

  const getPatientName = (id: string) => {
    const patient = patients.find((p) => p.id === id);
    if (!patient) return "Paciente";
    return `${patient.first_name ?? ""} ${patient.last_name ?? ""}`.trim();
  };

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Facturas</h1>
        <p className="text-sm text-slate-600">
          Emite facturas rapidas y registra pagos despues.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4"
      >
        <p className="text-xs text-slate-500">
          Los campos con * son obligatorios.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setMode("direct")}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              mode === "direct"
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            Factura directa
          </button>
          <button
            type="button"
            onClick={() => setMode("budget")}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              mode === "budget"
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            Desde presupuesto
          </button>
        </div>

        {mode === "budget" ? (
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Presupuesto
            </label>
            <select
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={budgetId}
              onChange={(event) => onSelectBudget(event.target.value)}
            >
              <option value="">Selecciona un presupuesto</option>
              {budgets.map((budget) => (
                <option key={budget.id} value={budget.id}>
                  {budget.id.slice(0, 8)} · {getPatientName(budget.patient_id)} · {currency.format(budget.total ?? 0)}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500">
              El codigo es el ID corto del presupuesto.
            </p>
          </div>
        ) : null}

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
              Numero de factura (opcional)
            </label>
            <input
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              placeholder="Se genera automatico si se deja vacio"
              value={invoiceNumber}
              onChange={(event) => setInvoiceNumber(event.target.value)}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">
              Items <span className="text-red-600">*</span>
            </h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onAddItem("service")}
                className="text-sm text-blue-600"
              >
                Agregar servicio
              </button>
              <button
                type="button"
                onClick={() => onAddItem("manual")}
                className="text-sm text-blue-600"
              >
                Item manual
              </button>
            </div>
          </div>
          <div className="mt-3 space-y-3">
            {items.map((item, index) => (
              <div
                key={`item-${index}`}
                className="grid gap-3 md:grid-cols-4"
              >
                <div className="md:col-span-2">
                  {item.kind === "service" ? (
                    <>
                      <label className="block text-xs text-slate-500">
                        Servicio <span className="text-red-600">*</span>
                      </label>
                      <select
                        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                        value={item.service_id}
                        onChange={(event) =>
                          onSelectService(index, event.target.value)
                        }
                      >
                        <option value="">Selecciona un servicio</option>
                        {services.map((service) => (
                          <option key={service.id} value={service.id}>
                            {service.name}
                          </option>
                        ))}
                      </select>
                      {itemErrors[index]?.service ? (
                        <p className="mt-1 text-xs text-red-600">
                          {itemErrors[index]?.service}
                        </p>
                      ) : null}
                    </>
                  ) : (
                    <>
                      <label className="block text-xs text-slate-500">
                        Descripcion manual <span className="text-red-600">*</span>
                      </label>
                      <input
                        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                        placeholder="Descripcion"
                        value={item.description}
                        onChange={(event) =>
                          onChangeItem(index, {
                            description: event.target.value,
                          })
                        }
                      />
                      {itemErrors[index]?.description ? (
                        <p className="mt-1 text-xs text-red-600">
                          {itemErrors[index]?.description}
                        </p>
                      ) : null}
                    </>
                  )}
                </div>
                <div>
                  <label className="block text-xs text-slate-500">
                    Cantidad <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    value={item.quantity}
                    onChange={(event) =>
                      onChangeItem(index, {
                        quantity: Number(event.target.value),
                      })
                    }
                  />
                  {itemErrors[index]?.quantity ? (
                    <p className="mt-1 text-xs text-red-600">
                      {itemErrors[index]?.quantity}
                    </p>
                  ) : null}
                </div>
                <div className="flex gap-2">
                  <div className="w-full">
                    <label className="block text-xs text-slate-500">
                      Precio ($) <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                      value={item.unit_price}
                      placeholder="ej: 500"
                      onChange={(event) =>
                        onChangeItem(index, {
                          unit_price: Number(event.target.value),
                        })
                      }
                      onBlur={(event) => {
                        if (event.target.value.trim() === "") return;
                        const normalized = String(Number(event.target.value));
                        if (normalized !== event.target.value) {
                          onChangeItem(index, {
                            unit_price: Number(normalized),
                          });
                        }
                      }}
                    />
                    {itemErrors[index]?.unit_price ? (
                      <p className="mt-1 text-xs text-red-600">
                        {itemErrors[index]?.unit_price}
                      </p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveItem(index)}
                    className="rounded-md border border-slate-300 px-2 text-xs text-slate-500"
                  >
                    Quitar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Descuento
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={discount}
              onChange={(event) => {
                setDiscount(event.target.value);
                const nextValue =
                  event.target.value.trim() === ""
                    ? 0
                    : Number(event.target.value);
                const currentSubtotal = computeSubtotal(items);
                setDiscountError(
                  nextValue > currentSubtotal
                    ? "No puede superar el subtotal."
                    : null
                );
              }}
              onBlur={(event) => {
                if (event.target.value.trim() === "") return;
                const normalized = String(Number(event.target.value));
                if (normalized !== event.target.value) {
                  setDiscount(normalized);
                }
              }}
            />
            {discountError ? (
              <p className="mt-1 text-xs text-red-600">{discountError}</p>
            ) : null}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Estado <span className="text-red-600">*</span>
            </label>
            <select
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Total
            </label>
            <div className="mt-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
              {currency.format(totals.total)}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Subtotal: {currency.format(totals.subtotal)}
            </p>
          </div>
        </div>

        {message && <p className="text-sm text-slate-600">{message}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {isSaving ? "Guardando..." : "Guardar factura"}
          </button>
        </div>
      </form>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="grid grid-cols-12 gap-2 border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase text-slate-500">
            <div className="col-span-4">Paciente</div>
            <div className="col-span-2">Factura</div>
            <div className="col-span-2">Total</div>
            <div className="col-span-2">Estado</div>
            <div className="col-span-2">Creada</div>
          </div>
          <div className="divide-y divide-slate-200">
            {list.length > 0 ? (
              list.map((invoice) => {
                const patient = invoice.patients;
                const name = patient
                  ? `${patient.first_name ?? ""} ${patient.last_name ?? ""}`.trim()
                  : "Paciente";
                const sourceLabel = invoice.budget_id ? "Presupuesto" : "Directa";
                return (
                  <div
                    key={invoice.id}
                    className="grid grid-cols-12 gap-2 px-4 py-3 text-sm text-slate-700"
                  >
                    <div className="col-span-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="font-medium">{name || "Paciente"}</div>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                            invoice.budget_id
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {sourceLabel}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500">
                        {patient?.id_number ?? "-"} {"\u00b7"} {patient?.phone ?? "-"}
                      </div>
                    </div>
                    <div className="col-span-2">
                      {invoice.invoice_number ?? "-"}
                    </div>
                    <div className="col-span-2">
                      {currency.format(invoice.total ?? 0)}
                    </div>
                    <div className="col-span-2">
                      {invoice.status ?? "-"}
                    </div>
                    <div className="col-span-2">
                      {invoice.created_at
                        ? new Date(invoice.created_at).toLocaleDateString()
                        : "-"}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="px-4 py-6 text-sm text-slate-500">
                No hay facturas registradas.
              </div>
            )}
          </div>
        </div>
    </section>
  );
}




