export type Patient = {
  id: string;
  first_name: string;
  last_name: string;
  id_number: string | null;
  phone: string | null;
  email: string | null;
  status: "active" | "inactive" | null;
  created_at: string | null;
};
