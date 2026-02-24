import {
  getCategories,
  getExecutives,
  getExecutivesByCategory,
  getRegions,
} from "@/lib/queries";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DebugPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  let payload: unknown;
  try {
    const [categories, regions, executives] = await Promise.all([
      getCategories(),
      getRegions(),
      getExecutives(),
    ]);

    const executivesByCategoryEntries = await Promise.all(
      categories.map(async (category) => {
        const list = await getExecutivesByCategory(category.slug);
        return [category.slug, list] as const;
      })
    );

    const executivesByCategory = Object.fromEntries(
      executivesByCategoryEntries
    );

    payload = {
      categories,
      regions,
      executives,
      executivesByCategory,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    payload = { error: message };
  }

  return (
    <main style={{ padding: 24 }}>
      <h1>Debug Supabase</h1>
      <pre>{JSON.stringify(payload, null, 2)}</pre>
    </main>
  );
}
