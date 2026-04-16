import { z } from "zod";

export const clinicalNoteSchema = z.object({
  patient_id: z.string().uuid("Paciente requerido"),
  date: z.string().min(1, "Fecha requerida"),
  content: z.string().min(1, "Contenido requerido"),
});

export type ClinicalNoteInput = z.infer<typeof clinicalNoteSchema>;
