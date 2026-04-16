"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function Topbar() {
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
  };

  return (
    <header className="h-16 flex items-center justify-between border-b border-slate-200 bg-white px-4 md:px-6">
      <div className="md:hidden font-semibold text-slate-900">ArDental</div>
      <button
        type="button"
        onClick={handleSignOut}
        className="text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        Cerrar sesión
      </button>
    </header>
  );
}
