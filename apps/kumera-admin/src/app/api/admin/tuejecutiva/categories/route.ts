import { z } from "zod";
import { requireAdminApi, ROLE } from "@/lib/auth";
import { createTuejecutivaServiceClient } from "@/lib/db";
import { fail, ok } from "@/lib/http";

const createCategorySchema = z.object({
  name: z.string().min(1),
  slug: z.string().optional(),
  description: z.string().nullable().optional(),
});

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function normalizeText(value: string | null | undefined) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function POST(req: Request) {
  const auth = await requireAdminApi([ROLE.TUEJECUTIVA]);
  if (!auth.ok) return auth.response;

  const payload = await req.json().catch(() => null);
  const parsed = createCategorySchema.safeParse(payload);
  if (!parsed.success) return fail("Invalid payload", 400);

  const body = parsed.data;
  const name = body.name.trim();
  const slug = slugify((body.slug ?? "").trim() || name);
  if (!slug) return fail("Slug inválido", 400);

  const tuejecutiva = createTuejecutivaServiceClient();
  const { data, error } = await tuejecutiva
    .from("categories")
    .insert({
      name,
      slug,
      description: normalizeText(body.description),
    })
    .select("id, slug, name")
    .single();

  if (error || !data) return fail(error?.message ?? "Could not create category", 500);

  return ok({ category: data }, 201);
}
