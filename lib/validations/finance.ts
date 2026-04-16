import { z } from "zod";

const emptyToNull = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((value) => {
    if (value === "" || value === undefined) {
      return null;
    }
    return value;
  }, schema.nullable());

const itemSchema = z
  .object({
    service_id: emptyToNull(z.string().uuid()),
    description: z.string().min(1, "DescripciÃ³n requerida"),
    quantity: z.coerce.number().min(0.01, "Cantidad requerida"),
    unit_price: z.coerce.number().min(0, "Precio requerido"),
    total: z.coerce.number().min(0, "Total requerido"),
  })
  .passthrough();

export const budgetSchema = z.object({
  patient_id: z.string().uuid("Paciente requerido"),
  items: z.array(itemSchema).min(1, "Agrega al menos un item"),
  discount: emptyToNull(z.coerce.number()),
  status: emptyToNull(z.string()),
  valid_until: emptyToNull(z.string()),
  notes: emptyToNull(z.string()),
});

export type BudgetInput = z.infer<typeof budgetSchema>;

export const budgetUpdateSchema = budgetSchema.extend({
  id: z.string().uuid("Presupuesto requerido"),
});

export type BudgetUpdateInput = z.infer<typeof budgetUpdateSchema>;

export const invoiceSchema = z.object({
  patient_id: z.string().uuid("Paciente requerido"),
  appointment_id: emptyToNull(z.string().uuid()),
  budget_id: emptyToNull(z.string().uuid()),
  invoice_number: emptyToNull(z.string()),
  items: z.array(itemSchema).min(1, "Agrega al menos un item"),
  discount: emptyToNull(z.coerce.number()),
  status: emptyToNull(z.string()),
});

export type InvoiceInput = z.infer<typeof invoiceSchema>;

export const invoiceUpdateSchema = invoiceSchema.extend({
  id: z.string().uuid("Factura requerida"),
});

export type InvoiceUpdateInput = z.infer<typeof invoiceUpdateSchema>;

export const paymentSchema = z.object({
  patient_id: z.string().uuid("Paciente requerido"),
  invoice_id: emptyToNull(z.string().uuid()),
  treatment_id: emptyToNull(z.string().uuid()),
  amount: z.coerce.number().min(0.01, "Monto requerido"),
  payment_method: z.string().min(1, "MÃ©todo requerido"),
  concept: z.string().min(1, "Concepto requerido"),
  payment_date: emptyToNull(z.string()),
  reference: emptyToNull(z.string()),
  notes: emptyToNull(z.string()),
});

export type PaymentInput = z.infer<typeof paymentSchema>;
