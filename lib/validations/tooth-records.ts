import { z } from "zod";

const conditionEnum = z.enum([
  "healthy",
  "caries",
  "filling",
  "crown",
  "bridge",
  "implant",
  "extracted",
  "absent",
  "fracture",
  "root_canal",
  "other",
]);

export const toothRecordSchema = z.object({
  patient_id: z.string().uuid("Paciente requerido"),
  records: z.array(
    z.object({
      tooth_number: z.number().int().min(11).max(48),
      condition: conditionEnum,
      affected_faces: z.array(z.string()).optional().nullable(),
      notes: z.string().optional().nullable(),
    })
  ),
});

export type ToothRecordsInput = z.infer<typeof toothRecordSchema>;
