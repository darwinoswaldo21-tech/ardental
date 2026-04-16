import { z } from "zod";

const optionalText = z.string().optional().nullable().or(z.literal(""));

export const prescriptionItemSchema = z.object({
  name: z.string().min(1, "Medicamento requerido"),
  dosage: optionalText,
  instructions: optionalText,
  duration: optionalText,
});

export const prescriptionSchema = z.object({
  patient_id: z.string().min(1, "Paciente requerido"),
  appointment_id: optionalText,
  items: z.array(prescriptionItemSchema).min(1, "Agrega al menos un medicamento"),
  general_notes: optionalText,
});

export type PrescriptionInput = z.infer<typeof prescriptionSchema>;
