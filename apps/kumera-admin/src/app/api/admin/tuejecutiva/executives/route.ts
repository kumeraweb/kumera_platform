import { z } from "zod";
import { requireAdminApi, ROLE } from "@/lib/auth";
import { createTuejecutivaServiceClient } from "@/lib/db";
import { fail, ok } from "@/lib/http";

const createExecutiveSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  phone: z.string().min(1),
  company: z.string().min(1),
  specialty: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  whatsapp_message: z.string().nullable().optional(),
  plan: z.enum(["bronce", "plata", "oro"]).default("bronce"),
  experience_years: z.number().int().min(0).max(80).nullable().optional(),
  company_website_url: z.string().url().nullable().optional(),
  coverage_all: z.boolean().default(false),
  category_ids: z.array(z.string().uuid()).min(1),
  region_ids: z.array(z.string().uuid()).default([]),
});

function normalizeText(value: string | null | undefined) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function uniqueIds(values: string[]) {
  return Array.from(new Set(values));
}

export async function POST(req: Request) {
  const auth = await requireAdminApi([ROLE.TUEJECUTIVA]);
  if (!auth.ok) return auth.response;

  const payload = await req.json().catch(() => null);
  const parsed = createExecutiveSchema.safeParse(payload);
  if (!parsed.success) return fail("Invalid payload", 400);

  const body = parsed.data;
  const tuejecutiva = createTuejecutivaServiceClient();

  const categoryIds = uniqueIds(body.category_ids);
  const regionIds = uniqueIds(body.region_ids);

  const today = new Date().toISOString().slice(0, 10);
  const { data: created, error: createError } = await tuejecutiva
    .from("executives")
    .insert({
      name: body.name.trim(),
      slug: body.slug.trim(),
      phone: body.phone.trim(),
      company: body.company.trim(),
      specialty: normalizeText(body.specialty),
      description: normalizeText(body.description),
      whatsapp_message: normalizeText(body.whatsapp_message),
      plan: body.plan,
      experience_years: body.experience_years ?? null,
      company_website_url: normalizeText(body.company_website_url),
      coverage_all: body.coverage_all,
      verified: true,
      verified_date: today,
      status: "active",
    })
    .select(
      "id, name, slug, phone, company, plan, status, verified, created_at, executive_categories(categories(id,name,slug)), executive_regions(regions(id,code,name))"
    )
    .single();

  if (createError || !created) return fail(createError?.message ?? "Could not create executive", 500);

  try {
    const { error: catError } = await tuejecutiva.from("executive_categories").insert(
      categoryIds.map((categoryId) => ({
        executive_id: created.id,
        category_id: categoryId,
      }))
    );

    if (catError) throw new Error(catError.message);

    if (!body.coverage_all && regionIds.length > 0) {
      const { error: regError } = await tuejecutiva.from("executive_regions").insert(
        regionIds.map((regionId) => ({
          executive_id: created.id,
          region_id: regionId,
        }))
      );
      if (regError) throw new Error(regError.message);
    }
  } catch (error) {
    await tuejecutiva.from("executives").delete().eq("id", created.id);
    return fail(error instanceof Error ? error.message : "Could not create relations", 500);
  }

  const { data: fresh, error: freshError } = await tuejecutiva
    .from("executives")
    .select(
      "id, name, slug, phone, company, plan, status, verified, created_at, executive_categories(categories(id,name,slug)), executive_regions(regions(id,code,name))"
    )
    .eq("id", created.id)
    .single();

  if (freshError || !fresh) return fail(freshError?.message ?? "Created but failed fetching executive", 500);

  return ok({ executive: fresh }, 201);
}
