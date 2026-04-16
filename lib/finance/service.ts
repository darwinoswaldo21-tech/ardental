import { createClient } from "@supabase/supabase-js";
import type {
  BudgetInput,
  BudgetUpdateInput,
  InvoiceInput,
  InvoiceUpdateInput,
  PaymentInput,
} from "@/lib/validations/finance";

type LineItem = {
  quantity?: number;
  unit_price?: number;
  total?: number;
};

function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("Supabase service role env vars missing");
  }
  return createClient(url, serviceKey);
}

function normalizeTotals(items: LineItem[], discount?: number | null) {
  const subtotal = items.reduce((acc, item) => {
    const computed =
      typeof item.total === "number"
        ? item.total
        : (item.quantity ?? 0) * (item.unit_price ?? 0);
    return acc + computed;
  }, 0);
  const safeDiscount = discount ?? 0;
  const total = subtotal - safeDiscount;
  return {
    subtotal,
    discount: safeDiscount,
    total,
  };
}

async function getInvoicePrefix() {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("clinic_settings")
    .select("invoice_prefix")
    .limit(1)
    .maybeSingle();
  return data?.invoice_prefix || "FAC";
}

export async function generateInvoiceNumber() {
  const prefix = await getInvoicePrefix();
  const now = new Date();
  const yyyy = now.getFullYear().toString();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${yyyy}${mm}${dd}-${random}`;
}

export async function listBudgets() {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("budgets")
    .select(
      "id, patient_id, items, subtotal, discount, total, status, valid_until, notes, created_at, patients(first_name,last_name,id_number,phone)"
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("No se pudieron cargar los presupuestos.");
  }

  return data ?? [];
}

export async function listInvoices() {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("invoices")
    .select(
      "id, patient_id, appointment_id, budget_id, invoice_number, items, subtotal, discount, total, status, created_at, patients(first_name,last_name,id_number,phone)"
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("No se pudieron cargar las facturas.");
  }

  return data ?? [];
}

export async function listPayments() {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("payments")
    .select(
      "id, patient_id, invoice_id, treatment_id, amount, payment_method, concept, payment_date, reference, notes, created_at, patients(first_name,last_name,id_number,phone), invoices(invoice_number)"
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("No se pudieron cargar los pagos.");
  }

  return data ?? [];
}

export async function createBudget(input: BudgetInput, createdBy?: string) {
  const supabase = createServiceClient();
  const totals = normalizeTotals(input.items, input.discount);

  const { data, error } = await supabase
    .from("budgets")
    .insert({
      patient_id: input.patient_id,
      items: input.items,
      subtotal: totals.subtotal,
      discount: totals.discount,
      total: totals.total,
      status: input.status ?? "pending",
      valid_until: input.valid_until ?? null,
      notes: input.notes ?? null,
      created_by: createdBy ?? null,
    })
    .select(
      "id, patient_id, items, subtotal, discount, total, status, valid_until, notes, created_at"
    )
    .single();

  if (error) {
    return {
      ok: false,
      message: error.message || "No se pudo crear el presupuesto.",
    };
  }

  return { ok: true, budget: data };
}

export async function updateBudget(input: BudgetUpdateInput) {
  const supabase = createServiceClient();
  const totals = normalizeTotals(input.items, input.discount);

  const { data, error } = await supabase
    .from("budgets")
    .update({
      items: input.items,
      subtotal: totals.subtotal,
      discount: totals.discount,
      total: totals.total,
      status: input.status ?? "pending",
      valid_until: input.valid_until ?? null,
      notes: input.notes ?? null,
    })
    .eq("id", input.id)
    .select(
      "id, patient_id, items, subtotal, discount, total, status, valid_until, notes, created_at"
    )
    .single();

  if (error) {
    return { ok: false, message: "No se pudo actualizar el presupuesto." };
  }

  return { ok: true, budget: data };
}

export async function createInvoice(
  input: InvoiceInput,
  createdBy?: string
) {
  const supabase = createServiceClient();
  const totals = normalizeTotals(input.items, input.discount);
  const invoiceNumber = input.invoice_number ?? (await generateInvoiceNumber());

  const { data, error } = await supabase
    .from("invoices")
    .insert({
      patient_id: input.patient_id,
      appointment_id: input.appointment_id ?? null,
      budget_id: input.budget_id ?? null,
      invoice_number: invoiceNumber,
      items: input.items,
      subtotal: totals.subtotal,
      discount: totals.discount,
      total: totals.total,
      status: input.status ?? "active",
      created_by: createdBy ?? null,
    })
    .select(
      "id, patient_id, appointment_id, budget_id, invoice_number, items, subtotal, discount, total, status, created_at"
    )
    .single();

  if (error) {
    return {
      ok: false,
      message: error.message || "No se pudo crear la factura.",
    };
  }

  return { ok: true, invoice: data };
}

export async function updateInvoice(input: InvoiceUpdateInput) {
  const supabase = createServiceClient();
  const totals = normalizeTotals(input.items, input.discount);

  const { data, error } = await supabase
    .from("invoices")
    .update({
      patient_id: input.patient_id,
      appointment_id: input.appointment_id ?? null,
      budget_id: input.budget_id ?? null,
      invoice_number: input.invoice_number ?? null,
      items: input.items,
      subtotal: totals.subtotal,
      discount: totals.discount,
      total: totals.total,
      status: input.status ?? "active",
    })
    .eq("id", input.id)
    .select(
      "id, patient_id, appointment_id, budget_id, invoice_number, items, subtotal, discount, total, status, created_at"
    )
    .single();

  if (error) {
    return { ok: false, message: "No se pudo actualizar la factura." };
  }

  return { ok: true, invoice: data };
}

export async function createPayment(input: PaymentInput, registeredBy?: string) {
  const supabase = createServiceClient();
  const paymentDate =
    input.payment_date ??
    new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("payments")
    .insert({
      patient_id: input.patient_id,
      invoice_id: input.invoice_id ?? null,
      treatment_id: input.treatment_id ?? null,
      amount: input.amount,
      payment_method: input.payment_method,
      concept: input.concept,
      payment_date: paymentDate,
      reference: input.reference ?? null,
      notes: input.notes ?? null,
      registered_by: registeredBy ?? null,
    })
    .select(
      "id, patient_id, invoice_id, treatment_id, amount, payment_method, concept, payment_date, reference, notes, created_at"
    )
    .single();

  if (error) {
    return {
      ok: false,
      message: error.message || "No se pudo registrar el pago.",
    };
  }

  return { ok: true, payment: data };
}

export async function getAccountStatement(patientId: string) {
  const supabase = createServiceClient();

  const { data: patient } = await supabase
    .from("patients")
    .select("id, first_name, last_name, id_number, phone")
    .eq("id", patientId)
    .maybeSingle();

  const { data: invoices, error: invoicesError } = await supabase
    .from("invoices")
    .select(
      "id, invoice_number, total, status, created_at, patient_id"
    )
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false });

  if (invoicesError) {
    throw new Error("No se pudieron cargar las facturas.");
  }

  const { data: payments, error: paymentsError } = await supabase
    .from("payments")
    .select(
      "id, amount, payment_method, concept, payment_date, reference, notes, invoice_id, patient_id"
    )
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false });

  if (paymentsError) {
    throw new Error("No se pudieron cargar los pagos.");
  }

  return {
    patient,
    invoices: invoices ?? [],
    payments: payments ?? [],
  };
}
