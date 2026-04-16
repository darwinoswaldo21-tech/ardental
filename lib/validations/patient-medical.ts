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

export const patientMedicalSchema = z.object({
  allergies: z.preprocess(toStringArray, z.array(z.string())),
  current_medications: z.preprocess(toStringArray, z.array(z.string())),
  systemic_diseases: z.preprocess(toStringArray, z.array(z.string())),
  takes_anticoagulants: z.coerce.boolean().default(false),
  blood_type: z.string().optional().nullable(),
});

export type PatientMedicalInput = z.infer<typeof patientMedicalSchema>;
