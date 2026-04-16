import { z } from "zod";

const emptyToNull = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((value) => {
    if (value === "" || value === undefined) {
      return null;
    }
    return value;
  }, schema.nullable());

export const orthodonticTreatmentSchema = z.object({
  patient_id: z.string().uuid("Paciente requerido"),
  molar_class: emptyToNull(z.string()),
  canine_class: emptyToNull(z.string()),
  overjet: emptyToNull(z.coerce.number()),
  overbite: emptyToNull(z.coerce.number()),
  diagnosis_notes: emptyToNull(z.string()),
  appliance_type: emptyToNull(z.string()),
  planned_extractions: emptyToNull(z.array(z.string())),
  treatment_objectives: emptyToNull(z.string()),
  status: emptyToNull(z.string()),
  start_date: emptyToNull(z.string()),
  estimated_end_date: emptyToNull(z.string()),
  actual_end_date: emptyToNull(z.string()),
  retainer_type: emptyToNull(z.string()),
  retainer_notes: emptyToNull(z.string()),
  total_cost: emptyToNull(z.coerce.number()),
  monthly_fee: emptyToNull(z.coerce.number()),
});

export type OrthodonticTreatmentInput = z.infer<
  typeof orthodonticTreatmentSchema
>;

export const bracketRecordSchema = z.object({
  tooth_number: z.coerce.number().int(),
  bracket_brand: emptyToNull(z.string()),
  placement_date: emptyToNull(z.string()),
  notes: emptyToNull(z.string()),
});

export const bracketRecordsPayloadSchema = z.object({
  treatment_id: z.string().uuid("Tratamiento requerido"),
  records: z.array(bracketRecordSchema),
});

export type BracketRecordsPayload = z.infer<
  typeof bracketRecordsPayloadSchema
>;

export const orthodonticAdjustmentSchema = z.object({
  treatment_id: z.string().uuid("Tratamiento requerido"),
  appointment_id: emptyToNull(z.string()),
  adjustment_date: z.string().min(1, "Fecha requerida"),
  upper_arch: emptyToNull(z.string()),
  lower_arch: emptyToNull(z.string()),
  elastics: emptyToNull(z.string()),
  observations: emptyToNull(z.string()),
  next_appointment_notes: emptyToNull(z.string()),
});

export type OrthodonticAdjustmentInput = z.infer<
  typeof orthodonticAdjustmentSchema
>;
