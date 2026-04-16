export type Appointment = {
  id: string;
  patient_id: string;
  scheduled_at: string;
  duration_minutes: number | null;
  type: string;
  status: "pending" | "confirmed" | "completed" | "cancelled" | "no_show";
  notes: string | null;
};
