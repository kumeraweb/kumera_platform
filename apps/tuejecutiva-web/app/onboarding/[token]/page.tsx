import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import OnboardingFormClient from "@/app/components/onboarding/OnboardingFormClient";
import {
  getCategoriesForOnboarding,
  getRegionsForOnboarding,
  getTokenByValue,
  isTokenValid,
} from "@/lib/onboarding";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function OnboardingTokenPage({ params }: PageProps) {
  noStore();

  const { token } = await params;
  const safeToken = decodeURIComponent(token).trim();

  const tokenRecord = await getTokenByValue(safeToken);
  if (!tokenRecord || tokenRecord.used_at !== null || !isTokenValid(tokenRecord)) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-xl rounded-2xl bg-white p-8 text-center shadow-xl ring-1 ring-slate-900/5 sm:p-10">
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Esta invitación ya no es válida
          </h1>
          <p className="mt-4 text-sm text-slate-600 sm:text-base">
            El enlace de onboarding ya fue utilizado o ha caducado.
            Si necesitas continuar con tu postulación, solicita una nueva invitación.
          </p>
          <Link
            href="/"
            className="mt-8 inline-flex items-center justify-center rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Volver al inicio
          </Link>
        </div>
      </main>
    );
  }

  const [categories, regions] = await Promise.all([
    getCategoriesForOnboarding(),
    getRegionsForOnboarding(),
  ]);

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-2xl">
        <OnboardingFormClient
          categories={categories}
          regions={regions}
          token={safeToken}
          mode="token"
        />
      </div>
    </main>
  );
}
