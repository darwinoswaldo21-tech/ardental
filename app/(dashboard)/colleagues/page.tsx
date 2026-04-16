import { createClient } from "@/lib/supabase/server";
import ColleaguesClient from "@/components/colleagues/ColleaguesClient";

export default async function ColleaguesPage() {
  const supabase = await createClient();

  const { data: colleagues } = await supabase
    .from("colleagues")
    .select(
      "id, full_name, specialty_id, phone, email, notes, is_active, created_at, specialties(id, name)"
    )
    .order("created_at", { ascending: false });

  const { data: specialties } = await supabase
    .from("specialties")
    .select("id, name")
    .order("name", { ascending: true });

  return (
    <ColleaguesClient
      colleagues={colleagues ?? []}
      specialties={specialties ?? []}
    />
  );
}
