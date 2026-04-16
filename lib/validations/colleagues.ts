import { z } from "zod";

const emptyToNull = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((value) => {
    if (value === "" || value === undefined) {
      return null;
    }
    return value;
  }, schema.nullable());

export const colleagueSchema = z.object({
  full_name: z.string().min(1, "Nombre requerido"),
  specialty_id: z.string().uuid("Especialidad requerida"),
  phone: emptyToNull(z.string()),
  email: emptyToNull(z.string()),
  notes: emptyToNull(z.string()),
  is_active: z.coerce.boolean().default(true),
});

export type ColleagueInput = z.infer<typeof colleagueSchema>;

export const colleagueUpdateSchema = colleagueSchema.extend({
  id: z.string().uuid("Colega requerido"),
});

export type ColleagueUpdateInput = z.infer<typeof colleagueUpdateSchema>;

export const colleagueFeeSchema = z.object({
  colleague_id: z.string().uuid("Colega requerido"),
  amount: z.coerce.number().min(0.01, "Monto requerido"),
  payment_date: emptyToNull(z.string()),
  payment_method: z.string().min(1, "Metodo requerido"),
  notes: emptyToNull(z.string()),
});

export type ColleagueFeeInput = z.infer<typeof colleagueFeeSchema>;
