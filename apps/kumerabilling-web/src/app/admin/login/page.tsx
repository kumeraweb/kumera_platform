import { AdminLoginForm } from "@/components/admin-login-form";

export default function AdminLoginPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-6 py-16">
      <section className="w-full space-y-4">
        <h1 className="font-[var(--font-display)] text-3xl font-bold text-slate-900">Ingreso admin</h1>
        <p className="text-sm text-slate-700">Acceso interno con Supabase Magic Link.</p>
        <AdminLoginForm />
      </section>
    </main>
  );
}
