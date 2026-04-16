import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LoginForm from "./login-form";

export default async function LoginPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/");
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white shadow-sm border border-slate-200 rounded-xl p-6">
        <div className="mb-6 flex flex-col items-center">
          <img
            src="/logo.png"
            alt="ArDental"
            className="h-16 w-16 object-contain rounded-md bg-slate-100 p-1"
          />
          <h1 className="mt-4 text-xl font-semibold text-slate-900">
            ArDental
          </h1>
          <p className="text-sm text-slate-500">
            Inicia sesión para continuar
          </p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
