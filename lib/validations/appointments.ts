import { z } from "zod";

export const appointmentSchema = z.object({
  patient_id: z.string().uuid("Paciente requerido"),
  scheduled_at: z.string().min(1, "Fecha requerida"),
  duration_minutes: z.coerce.number().int().min(10).max(240),
  type: z.string().min(1, "Tipo requerido"),
  status: z.enum(["pending", "confirmed", "completed", "cancelled", "no_show"]),
  notes: z.string().optional().nullable(),
});

export type AppointmentInput = z.infer<typeof appointmentSchema>;

export const appointmentUpdateSchema = appointmentSchema.omit({
  patient_id: true,
});

export type AppointmentUpdateInput = z.infer<typeof appointmentUpdateSchema>;
