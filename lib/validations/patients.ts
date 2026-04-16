import { z } from "zod";

const toStringArray = (value: unknown) => {
  if (Array.isArray(value)) {
    return value.filter(Boolean).map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

export const patientSchema = z.object({
  first_name: z.string().min(1, "Nombre requerido"),
  last_name: z.string().min(1, "Apellido requerido"),
  id_number: z.string().min(1, "Cédula requerida"),
  phone: z.string().min(1, "Teléfono requerido"),
  email: z.string().min(1, "Email requerido"),
  address: z.string().optional().nullable(),
  birth_date: z.string().optional().nullable(),
  gender: z
    .enum(["M", "F", "other"])
    .optional()
    .nullable()
    .or(z.literal("")),
  emergency_contact_name: z.string().optional().nullable(),
  emergency_contact_phone: z.string().optional().nullable(),
  allergies: z.preprocess(toStringArray, z.array(z.string())),
  current_medications: z.preprocess(toStringArray, z.array(z.string())),
  systemic_diseases: z.preprocess(toStringArray, z.array(z.string())),
  takes_anticoagulants: z.coerce.boolean().default(false),
  blood_type: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  status: z.enum(["active", "inactive"], { message: "Estado requerido" }),
});

export type PatientInput = z.infer<typeof patientSchema>;
