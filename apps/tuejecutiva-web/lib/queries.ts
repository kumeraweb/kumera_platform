import { supabase } from "./supabaseClient";

export interface ExecutiveCategoryJoin {
  categories: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

export interface ExecutiveRegionJoin {
  regions: {
    id: string;
    code: string;
    name: string;
  } | null;
}

export interface ExecutiveRecord {
  id: string;
  name: string;
  slug: string;
  phone: string | null;
  company: string | null;
  company_website_url: string | null;
  experience_years: number | null;
  specialty: string | null;
  description: string | null;
  whatsapp_message: string | null;
  photo_url: string | null;
  company_logo_url: string | null;
  faq: unknown;
  coverage_all: boolean;
  plan: "bronce" | "plata" | "oro" | null;
  verified: boolean;
  verified_date: string | null;
  executive_categories?: ExecutiveCategoryJoin[];
  executive_regions?: ExecutiveRegionJoin[];
}

export interface ExecutivePlanRecord {
  id: string;
  executive_id: string;
  name: string;
  price_from: string | null;
  target: string | null;
  description: string | null;
  features: unknown;
  active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Campos devueltos por la tabla `categories`.
 * - id, slug, name: identificadores y etiquetas visibles.
 * - description, icon: metadatos opcionales para UI.
 */
export async function getCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select("id, slug, name, description, icon")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`getCategories failed: ${error.message}`);
  }

  return data ?? [];
}

export async function getCategoriesWithExecutives() {
  const [categories, categoryLinks] = await Promise.all([
    getCategories(),
    supabase.from("executive_categories").select("category_id"),
  ]);

  const { data: links, error } = categoryLinks;
  if (error) {
    throw new Error(`getCategoriesWithExecutives failed: ${error.message}`);
  }

  const categoryIds = new Set((links ?? []).map((row) => row.category_id));
  return categories.filter((category) => categoryIds.has(category.id));
}

/**
 * Campos devueltos por la tabla `regions`.
 * - id, code, name: identificadores y etiquetas visibles.
 */
export async function getRegions() {
  const { data, error } = await supabase
    .from("regions")
    .select("id, code, name")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`getRegions failed: ${error.message}`);
  }

  return data ?? [];
}

/**
 * Categoria individual por slug.
 */
export async function getCategoryBySlug(slug: string) {
  const normalizedSlug = slug.trim().toLowerCase();
  const { data, error } = await supabase
    .from("categories")
    .select("id, slug, name, description, icon")
    .eq("slug", normalizedSlug)
    .maybeSingle();

  if (error) {
    throw new Error(`getCategoryBySlug failed: ${error.message}`);
  }

  if (data) return data;

  // Fallback: find in full list to avoid false 404 if slug mismatch/casing
  const categories = await getCategories();
  return categories.find(
    (category) => category.slug.toLowerCase() === normalizedSlug
  );
}

/**
 * Campos devueltos por `executives` y relaciones N:N.
 * - experience_years, plan, coverage_all: reglas de negocio clave.
 * - executive_categories: categorias asociadas (vía join table).
 * - executive_regions: regiones asociadas (vía join table).
 */
export async function getExecutives(): Promise<ExecutiveRecord[]> {
  const executivesSelect = [
    "id",
    "name",
    "slug",
    "phone",
    "company",
    "company_website_url",
    "experience_years",
    "specialty",
    "description",
    "whatsapp_message",
    "photo_url",
    "company_logo_url",
    "faq",
    "coverage_all",
    "plan",
    "verified",
    "verified_date",
    "executive_categories ( categories ( id, slug, name ) )",
    "executive_regions ( regions ( id, code, name ) )",
  ].join(",");

  const { data, error } = await supabase
    .from("executives")
    .select(executivesSelect)
    .eq("verified", true)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`getExecutives failed: ${error.message}`);
  }

  return (data ?? []) as unknown as ExecutiveRecord[];
}

/**
 * Ejecutivas filtradas por categoria (slug).
 * Respeta el esquema N:N mediante `executive_categories`.
 */
export async function getExecutivesByCategory(slug: string): Promise<ExecutiveRecord[]> {
  const category = await getCategoryBySlug(slug);
  if (!category) return [];

  const executivesSelect = [
    "id",
    "name",
    "slug",
    "phone",
    "company",
    "company_website_url",
    "experience_years",
    "specialty",
    "description",
    "whatsapp_message",
    "photo_url",
    "company_logo_url",
    "faq",
    "coverage_all",
    "plan",
    "verified",
    "verified_date",
    "executive_categories ( categories ( id, slug, name ) )",
    "executive_regions ( regions ( id, code, name ) )",
  ].join(",");

  const { data, error } = await supabase
    .from("executive_categories")
    .select(
      [
        `executives ( ${executivesSelect} )`,
        "categories ( id, slug, name )",
      ].join(",")
    )
    .eq("category_id", category.id);

  if (error) {
    throw new Error(`getExecutivesByCategory failed: ${error.message}`);
  }

  const executives = (data ?? [])
    .map((row) => (row as { executives?: ExecutiveRecord }).executives)
    .filter((exec) => Boolean(exec) && (exec as ExecutiveRecord).verified) as ExecutiveRecord[];

  const unique = new Map<string, ExecutiveRecord>();
  executives.forEach((executive) => {
    unique.set(executive.id, executive);
  });

  return Array.from(unique.values());
}

/**
 * Ejecutiva individual por slug.
 */
export async function getExecutiveBySlug(slug: string): Promise<ExecutiveRecord | null> {
  const normalizedSlug = slug.trim().toLowerCase();

  const executivesSelect = [
    "id",
    "name",
    "slug",
    "phone",
    "company",
    "company_website_url",
    "experience_years",
    "specialty",
    "description",
    "whatsapp_message",
    "photo_url",
    "company_logo_url",
    "faq",
    "coverage_all",
    "plan",
    "verified",
    "verified_date",
    "executive_categories ( categories ( id, slug, name ) )",
    "executive_regions ( regions ( id, code, name ) )",
  ].join(",");

  const { data, error } = await supabase
    .from("executives")
    .select(executivesSelect)
    .eq("slug", normalizedSlug)
    .eq("verified", true)
    .maybeSingle();

  if (error) {
    throw new Error(`getExecutiveBySlug failed: ${error.message}`);
  }

  return (data ?? null) as ExecutiveRecord | null;
}

/**
 * Planes activos de una ejecutiva ordenados por fecha de creacion.
 */
export async function getExecutivePlansByExecutiveId(
  executiveId: string
): Promise<ExecutivePlanRecord[]> {
  const { data, error } = await supabase
    .from("executive_plans")
    .select(
      [
        "id",
        "executive_id",
        "name",
        "price_from",
        "target",
        "description",
        "features",
        "active",
        "created_at",
        "updated_at",
      ].join(",")
    )
    .eq("executive_id", executiveId)
    .eq("active", true)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`getExecutivePlansByExecutiveId failed: ${error.message}`);
  }

  return (data ?? []) as unknown as ExecutivePlanRecord[];
}
