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
  status?: string | null;
  valid_until?: string | null;
  notes?: string | null;
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

type BudgetsClientProps = {
  patients: Patient[];
  services: Service[];
  budgets: BudgetRow[];
};

const statusOptions = [
  { value: "pending", label: "Borrador" },
  { value: "approved", label: "Aprobado" },
  { value: "rejected", label: "Rechazado" },
  { value: "expired", label: "Vencido" },
];

const statusLabels: Record<string, string> = {
  pending: "Borrador",
  approved: "Aprobado",
  rejected: "Rechazado",
  expired: "Vencido",
};

const currency = new Intl.NumberFormat("es-EC", {
  style: "currency",
  currency: "USD",
});

export default function BudgetsClient({
  patients,
  services,
  budgets,
}: BudgetsClientProps) {
  const [items, setItems] = useState<ItemRow[]>([
    {
      kind: "service",
      service_id: "",
      description: "",
      quantity: 1,
      unit_price: 0,
    },
  ]);
  const [patientId, setPatientId] = useState("");
  const [discount, setDiscount] = useState<string>("");
  const [status, setStatus] = useState("pending");
  const [validUntil, setValidUntil] = useState("");
  const [notes, setNotes] = useState("");
  const [list, setList] = useState<BudgetRow[]>(budgets);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [invoicingId, setInvoicingId] = useState<string | null>(null);
  const [addInvoiceNote, setAddInvoiceNote] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
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
          }))).map(
        (err, i) => {
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
            next.quantity = patch.quantity < 1 ? "MÃƒÂ­nimo 1" : null;
          }
          if (patch.unit_price !== undefined) {
            next.unit_price = patch.unit_price <= 0 ? "Mayor a 0" : null;
          }
          return next;
        }
      )
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
      const quantityError = item.quantity < 1 ? "MÃƒÂ­nimo 1" : null;
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

    const invalidQty = cleanedItems.some((item) => item.quantity < 1);
    const invalidService = items.some(
      (item) =>
        (item.kind === "service" && !item.service_id) ||
        (item.kind === "manual" && item.description.trim() === "")
    );

    if (invalidService) {
      setError("Selecciona un servicio o escribe una descripcion.");
      return;
    }

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
      const response = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: patientId,
          items: cleanedItems,
          discount: discountValue,
          status,
          valid_until: validUntil || null,
          notes: notes || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "No se pudo crear el presupuesto.");
      }

      const data = await response.json();
      const patient = patients.find((p) => p.id === patientId);

      setList((prev) => [
        {
          ...data.budget,
          patients: patient ?? null,
        },
        ...prev,
      ]);
      setMessage("Presupuesto creado correctamente.");
      setItems([
        {
          kind: "service",
          service_id: "",
          description: "",
          quantity: 1,
          unit_price: 0,
        },
      ]);
      setItemErrors([]);
      setPatientId("");
      setDiscount("");
      setStatus("pending");
      setValidUntil("");
      setNotes("");
    } catch (err: any) {
      setError(err.message ?? "No se pudo crear el presupuesto.");
    } finally {
      setIsSaving(false);
    }
  };

  const onInvoice = async (budget: BudgetRow) => {
    setError(null);
    setMessage(null);
    if (budget.status === "approved") {
      setError("Este presupuesto ya esta facturado.");
      return;
    }
    setInvoicingId(budget.id);
    try {
      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: budget.patient_id,
          budget_id: budget.id,
          items: budget.items,
          discount: budget.discount ?? 0,
          status: "issued",
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "No se pudo crear la factura.");
      }

      const stamp = new Date().toLocaleDateString("es-EC");
      const autoNote = `Facturado el ${stamp}.`;
      const mergedNotes = addInvoiceNote
        ? budget.notes
          ? `${budget.notes}\n${autoNote}`
          : autoNote
        : budget.notes ?? null;

      const updateResponse = await fetch("/api/budgets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: budget.id,
          patient_id: budget.patient_id,
          items: budget.items,
          discount: budget.discount ?? 0,
          status: "approved",
          valid_until: budget.valid_until ?? null,
          notes: mergedNotes,
        }),
      });

      if (!updateResponse.ok) {
        const data = await updateResponse.json().catch(() => ({}));
        throw new Error(data.error ?? "No se pudo actualizar el presupuesto.");
      }

      const updated = await updateResponse.json();
      setList((prev) =>
        prev.map((item) =>
          item.id === budget.id
            ? { ...item, status: updated.budget?.status ?? "approved" }
            : item
        )
      );

      setMessage("Factura creada desde el presupuesto.");
    } catch (err: any) {
      setError(err.message ?? "No se pudo crear la factura.");
    } finally {
      setInvoicingId(null);
    }
  };

  const updateBudgetStatus = async (budget: BudgetRow, nextStatus: string) => {
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/budgets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: budget.id,
          patient_id: budget.patient_id,
          items: budget.items,
          discount: budget.discount ?? 0,
          status: nextStatus,
          valid_until: budget.valid_until ?? null,
          notes: budget.notes ?? null,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "No se pudo actualizar el presupuesto.");
      }

      const updated = await response.json();
      setList((prev) =>
        prev.map((item) =>
          item.id === budget.id
            ? { ...item, status: updated.budget?.status ?? nextStatus }
            : item
        )
      );
      setMessage(
        nextStatus === "rejected"
          ? "Presupuesto anulado."
          : "Presupuesto reactivado."
      );
    } catch (err: any) {
      setError(err.message ?? "No se pudo actualizar el presupuesto.");
    }
  };

  const toggleDetails = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Presupuestos</h1>
        <p className="text-sm text-slate-600">
          Crea presupuestos rapidos para tus pacientes.
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
                <div className="md:col-span-4">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                      item.kind === "service"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {item.kind === "service" ? "Servicio" : "Manual"}
                  </span>
                </div>
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
              Valido hasta
            </label>
            <input
              type="date"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={validUntil}
              onChange={(event) => setValidUntil(event.target.value)}
            />
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

        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={addInvoiceNote}
            onChange={(event) => setAddInvoiceNote(event.target.checked)}
          />
          Agregar nota de facturacion (recomendado)
        </label>

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
            {isSaving ? "Guardando..." : "Guardar presupuesto"}
          </button>
        </div>
      </form>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="grid grid-cols-12 gap-2 border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase text-slate-500">
          <div className="col-span-4">Paciente</div>
          <div className="col-span-2">Total</div>
          <div className="col-span-2">Estado</div>
          <div className="col-span-2">Valido hasta</div>
          <div className="col-span-1">Creado</div>
          <div className="col-span-1 text-right">Accion</div>
        </div>
        <div className="divide-y divide-slate-200">
          {list.length > 0 ? (
            list.map((budget) => {
              const patient = budget.patients;
              const name = patient
                ? `${patient.first_name ?? ""} ${patient.last_name ?? ""}`.trim()
                : "Paciente";
              return (
                <div key={budget.id} className="px-4 py-3 text-sm text-slate-700">
                  <div className="grid grid-cols-12 gap-2 items-start">
                    <div className="col-span-4">
                      <div className="font-medium">{name || "Paciente"}</div>
                      <div className="text-xs text-slate-500">
                        {patient?.id_number ?? "-"} {"\u00b7"} {patient?.phone ?? "-"}
                      </div>
                    </div>
                    <div className="col-span-2">
                      {currency.format(budget.total ?? 0)}
                    </div>
                    <div className="col-span-2">
                      <div className="flex items-center gap-2">
                        <span>
                          {budget.status
                            ? statusLabels[budget.status] ?? budget.status
                            : "-"}
                        </span>
                        {budget.status === "approved" ? (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                            Facturado
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className="col-span-2">
                      {budget.valid_until ?? "-"}
                    </div>
                    <div className="col-span-1">
                      {budget.created_at
                        ? new Date(budget.created_at).toLocaleDateString()
                        : "-"}
                    </div>
                    <div className="col-span-1 text-right space-y-2">
                      <button
                        type="button"
                        onClick={() => toggleDetails(budget.id)}
                        className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
                      >
                        {expandedIds.has(budget.id) ? "Ocultar" : "Ver detalles"}
                      </button>
                      {budget.status === "rejected" ||
                      budget.status === "expired" ? (
                        <button
                          type="button"
                          onClick={() => updateBudgetStatus(budget, "pending")}
                          className="block w-full rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
                        >
                          Reactivar
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            if (
                              window.confirm(
                                "¿Seguro que deseas anular este presupuesto?"
                              )
                            ) {
                              updateBudgetStatus(budget, "rejected");
                            }
                          }}
                          className="block w-full rounded-md border border-slate-300 px-2 py-1 text-xs text-amber-700 hover:bg-amber-50"
                        >
                          Anular
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onInvoice(budget)}
                        disabled={
                          invoicingId === budget.id || budget.status === "approved"
                        }
                        className="block w-full rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                      >
                        {invoicingId === budget.id ? "..." : "Facturar"}
                      </button>
                    </div>
                  </div>

                  {expandedIds.has(budget.id) ? (
                    <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                      <div className="grid grid-cols-12 gap-2 font-semibold text-slate-500">
                        <div className="col-span-6">Item</div>
                        <div className="col-span-2">Cantidad</div>
                        <div className="col-span-2">Precio</div>
                        <div className="col-span-2 text-right">Total</div>
                      </div>
                      <div className="mt-2 space-y-1">
                        {(budget.items ?? []).length > 0 ? (
                          (budget.items ?? []).map((item: any, idx: number) => (
                            <div
                              key={`${budget.id}-item-${idx}`}
                              className="grid grid-cols-12 gap-2"
                            >
                              <div className="col-span-6">
                                {item.description ?? "Item"}
                              </div>
                              <div className="col-span-2">
                                {item.quantity ?? "-"}
                              </div>
                              <div className="col-span-2">
                                {currency.format(item.unit_price ?? 0)}
                              </div>
                              <div className="col-span-2 text-right">
                                {currency.format(item.total ?? 0)}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div>No hay items registrados.</div>
                        )}
                      </div>
                      <div className="mt-3 flex justify-end gap-4 text-xs text-slate-500">
                        <span>Subtotal: {currency.format(budget.subtotal ?? 0)}</span>
                        <span>Descuento: {currency.format(budget.discount ?? 0)}</span>
                        <span>Total: {currency.format(budget.total ?? 0)}</span>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })
          ) : (
            <div className="px-4 py-6 text-sm text-slate-500">
              No hay presupuestos registrados.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}





