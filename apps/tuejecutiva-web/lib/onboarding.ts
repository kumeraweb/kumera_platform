import "server-only";
import { supabaseAdmin } from "./supabaseAdmin";

export type OnboardingStatus = "pending" | "reviewed" | "approved" | "rejected";

export interface OnboardingToken {
  id: string;
  email: string | null;
  token: string;
  expires_at: string;
  used_at: string | null;
}

export interface OnboardingSubmission {
  id: string;
  token_id: string | null;
  full_name: string;
  email: string;
  phone: string;
  company: string;
  experience_years: number | null;
  specialty: string | null;
  description: string | null;
  whatsapp_message: string | null;
  photo_url: string | null;
  company_logo_url: string | null;
  faq: unknown;
  coverage_all: boolean;
  custom_category: string | null;
  accepted_terms: boolean;
  accepted_data_use: boolean;
  status: OnboardingStatus;
  created_at: string;
}

export interface OnboardingSubmissionCategory {
  categories: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

export interface OnboardingSubmissionRegion {
  regions: {
    id: string;
    code: string;
    name: string;
  } | null;
}

export interface OnboardingSubmissionFile {
  id: string;
  file_type: "contract" | "identity" | "other";
  file_path: string;
  file_name: string;
  mime_type: string;
  created_at: string;
}

export interface OnboardingSubmissionPhoto {
  id: string;
  submission_id: string;
  photo_path: string;
  mime_type: string;
  created_at: string;
}

export async function getTokenByValue(token: string) {
  const { data, error } = await supabaseAdmin
    .from("onboarding_tokens")
    .select("id, email, token, expires_at, used_at")
    .eq("token", token)
    .maybeSingle();

  if (error) {
    throw new Error(`getTokenByValue failed: ${error.message}`);
  }

  return data as OnboardingToken | null;
}

export async function getLatestActiveToken(email?: string | null) {
  const nowIso = new Date().toISOString();
  let query = supabaseAdmin
    .from("onboarding_tokens")
    .select("id, email, token, expires_at, used_at")
    .is("used_at", null)
    .gt("expires_at", nowIso)
    .order("created_at", { ascending: false })
    .limit(1);

  if (typeof email === "string" && email.trim().length > 0) {
    query = query.eq("email", email.trim());
  } else if (email === null) {
    query = query.is("email", null);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw new Error(`getLatestActiveToken failed: ${error.message}`);
  }

  return data as OnboardingToken | null;
}

export async function createOnboardingToken(params: {
  email?: string | null;
  expiresInDays?: number;
}) {
  const rawEmail = params.email?.trim() || null;
  const expiresInDays =
    typeof params.expiresInDays === "number" && params.expiresInDays > 0
      ? params.expiresInDays
      : 7;

  const existing = await getLatestActiveToken(rawEmail);
  if (existing) {
    return { token: existing, reused: true };
  }

  const tokenValue = crypto.randomUUID();
  const expiresAt = new Date(
    Date.now() + expiresInDays * 24 * 60 * 60 * 1000
  ).toISOString();

  const { data, error } = await supabaseAdmin
    .from("onboarding_tokens")
    .insert({
      email: rawEmail,
      token: tokenValue,
      expires_at: expiresAt,
    })
    .select("id, email, token, expires_at, used_at")
    .single();

  if (error) {
    throw new Error(`createOnboardingToken failed: ${error.message}`);
  }

  return { token: data as OnboardingToken, reused: false };
}

export async function getOrCreateDevToken() {
  const nowIso = new Date().toISOString();
  const { data: existing, error: existingError } = await supabaseAdmin
    .from("onboarding_tokens")
    .select("id, email, token, expires_at, used_at")
    .eq("email", "dev@tuejecutiva.cl")
    .is("used_at", null)
    .gt("expires_at", nowIso)
    .order("created_at", { ascending: false })
    .maybeSingle();

  if (existingError) {
    throw new Error(`getOrCreateDevToken failed: ${existingError.message}`);
  }

  if (existing) return existing as OnboardingToken;

  const tokenValue = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: created, error: createError } = await supabaseAdmin
    .from("onboarding_tokens")
    .insert({
      email: "dev@tuejecutiva.cl",
      token: tokenValue,
      expires_at: expiresAt,
    })
    .select("id, email, token, expires_at, used_at")
    .single();

  if (createError) {
    throw new Error(`getOrCreateDevToken create failed: ${createError.message}`);
  }

  return created as OnboardingToken;
}

export function isTokenValid(token: OnboardingToken | null) {
  if (!token) return false;
  if (token.used_at) return false;
  const expiresAt = new Date(token.expires_at).getTime();
  return Number.isFinite(expiresAt) && expiresAt > Date.now();
}

export async function listSubmissions() {
  const { data, error } = await supabaseAdmin
    .from("onboarding_submissions")
    .select("id, full_name, company, phone, status, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`listSubmissions failed: ${error.message}`);
  }

  return data ?? [];
}

export async function getSubmissionDetail(id: string) {
  const { data, error } = await supabaseAdmin
    .from("onboarding_submissions")
    .select(
      [
        "id",
        "token_id",
        "full_name",
        "email",
        "phone",
        "company",
        "experience_years",
        "specialty",
        "description",
        "whatsapp_message",
        "photo_url",
        "company_logo_url",
        "faq",
        "coverage_all",
        "custom_category",
        "accepted_terms",
        "accepted_data_use",
        "status",
        "created_at",
        "onboarding_submission_categories ( categories ( id, name, slug ) )",
        "onboarding_submission_regions ( regions ( id, code, name ) )",
        "onboarding_submission_files ( id, file_type, file_path, file_name, mime_type, created_at )",
        "onboarding_submission_photos ( id, submission_id, photo_path, mime_type, created_at )",
      ].join(",")
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`getSubmissionDetail failed: ${error.message}`);
  }

  return data as (OnboardingSubmission & {
    onboarding_submission_categories: OnboardingSubmissionCategory[];
    onboarding_submission_regions: OnboardingSubmissionRegion[];
    onboarding_submission_files: OnboardingSubmissionFile[];
    onboarding_submission_photos: OnboardingSubmissionPhoto[];
  }) | null;
}

export async function updateSubmissionStatus(id: string, status: OnboardingStatus) {
  const { error } = await supabaseAdmin
    .from("onboarding_submissions")
    .update({ status })
    .eq("id", id);

  if (error) {
    throw new Error(`updateSubmissionStatus failed: ${error.message}`);
  }
}

export async function createSubmission(payload: {
  token_id: string | null;
  full_name: string;
  email: string;
  phone: string;
  company: string;
  coverage_all: boolean;
  custom_category?: string | null;
  accepted_terms: boolean;
  accepted_data_use: boolean;
  status: OnboardingStatus;
  category_id?: string | null;
  region_ids: string[];
}) {
  const { category_id, region_ids, ...submissionData } = payload;

  const { data: submission, error } = await supabaseAdmin
    .from("onboarding_submissions")
    .insert(submissionData)
    .select("id")
    .single();

  if (error) {
    throw new Error(`createSubmission failed: ${error.message}`);
  }

  const submissionId = submission.id as string;

  if (category_id) {
    const { error: categoriesError } = await supabaseAdmin
      .from("onboarding_submission_categories")
      .insert({
        submission_id: submissionId,
        category_id: category_id,
      });

    if (categoriesError) {
      throw new Error(`createSubmission categories failed: ${categoriesError.message}`);
    }
  }

  if (region_ids.length > 0) {
    const { error: regionsError } = await supabaseAdmin
      .from("onboarding_submission_regions")
      .insert(
        region_ids.map((regionId) => ({
          submission_id: submissionId,
          region_id: regionId,
        }))
      );

    if (regionsError) {
      throw new Error(`createSubmission regions failed: ${regionsError.message}`);
    }
  }

  return submissionId;
}

export async function markTokenUsed(tokenId: string) {
  const { error } = await supabaseAdmin
    .from("onboarding_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("id", tokenId);

  if (error) {
    throw new Error(`markTokenUsed failed: ${error.message}`);
  }
}

export async function createSignedFileUrl(path: string) {
  const { data, error } = await supabaseAdmin.storage
    .from("onboarding-documents")
    .createSignedUrl(path, 60 * 60);

  if (error) {
    throw new Error(`createSignedFileUrl failed: ${error.message}`);
  }

  return data.signedUrl;
}

export async function createSignedPhotoUrl(path: string) {
  const { data, error } = await supabaseAdmin.storage
    .from("executive-photos")
    .createSignedUrl(path, 60 * 60);

  if (error) {
    throw new Error(`createSignedPhotoUrl failed: ${error.message}`);
  }

  return data.signedUrl;
}

function safeFileExtension(fileName: string, mimeType: string) {
  const fromName = fileName.split(".").pop()?.trim().toLowerCase();
  if (fromName && /^[a-z0-9]+$/.test(fromName)) return fromName;
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  if (mimeType === "image/gif") return "gif";
  return "jpg";
}

export async function uploadAdminExecutivePhoto(params: {
  file: File;
  slug: string;
}) {
  const ext = safeFileExtension(params.file.name, params.file.type);
  const now = Date.now();
  const filePath = `admin/${params.slug}/${now}-${crypto.randomUUID()}.${ext}`;
  const arrayBuffer = await params.file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error } = await supabaseAdmin.storage
    .from("executive-photos")
    .upload(filePath, buffer, {
      contentType: params.file.type || "application/octet-stream",
      upsert: false,
    });

  if (error) {
    throw new Error(`uploadAdminExecutivePhoto failed: ${error.message}`);
  }

  return filePath;
}

export async function uploadAdminCompanyLogo(params: {
  file: File;
  slug: string;
}) {
  const ext = safeFileExtension(params.file.name, params.file.type);
  const now = Date.now();
  const filePath = `admin/${params.slug}/${now}-${crypto.randomUUID()}.${ext}`;
  const arrayBuffer = await params.file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error } = await supabaseAdmin.storage
    .from("company-logos")
    .upload(filePath, buffer, {
      contentType: params.file.type || "application/octet-stream",
      upsert: false,
    });

  if (error) {
    throw new Error(`uploadAdminCompanyLogo failed: ${error.message}`);
  }

  return filePath;
}

export async function getCategoriesForOnboarding() {
  const { data, error } = await supabaseAdmin
    .from("categories")
    .select("id, slug, name")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`getCategoriesForOnboarding failed: ${error.message}`);
  }

  return data ?? [];
}

export async function getRegionsForOnboarding() {
  const { data, error } = await supabaseAdmin
    .from("regions")
    .select("id, code, name")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`getRegionsForOnboarding failed: ${error.message}`);
  }

  return data ?? [];
}

export type ExecutivePlan = "bronce" | "plata" | "oro";
export type ExecutiveStatus = "draft" | "pending" | "active" | "inactive";

export interface CreateExecutivePayload {
  name: string;
  slug: string;
  phone: string;
  company: string;
  experience_years: number | null;
  specialty: string | null;
  description: string | null;
  whatsapp_message: string | null;
  photo_url: string | null;
  company_logo_url: string | null;
  company_website_url: string | null;
  faq: unknown | null;
  coverage_all: boolean;
  plan: ExecutivePlan;
  verified: boolean;
  verified_date: string | null;
  status: ExecutiveStatus;
  category_ids: string[];
  region_ids: string[];
  plans: Array<{
    name: string;
    price_from: string | null;
    target: string | null;
    description: string | null;
    features: unknown;
    active: boolean;
  }>;
}

function normalizeText(value: string | null | undefined) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function uniqueNonEmpty(values: string[]) {
  return Array.from(
    new Set(
      values
        .map((value) => value.trim())
        .filter((value) => value.length > 0)
    )
  );
}

export async function createExecutiveFromAdmin(payload: CreateExecutivePayload) {
  const categoryIds = uniqueNonEmpty(payload.category_ids);
  const regionIds = uniqueNonEmpty(payload.region_ids);

  const insertPayload = {
    name: payload.name.trim(),
    slug: payload.slug.trim(),
    phone: payload.phone.trim(),
    company: payload.company.trim(),
    experience_years: payload.experience_years,
    specialty: normalizeText(payload.specialty),
    description: normalizeText(payload.description),
    whatsapp_message: normalizeText(payload.whatsapp_message),
    photo_url: normalizeText(payload.photo_url),
    company_logo_url: normalizeText(payload.company_logo_url),
    company_website_url: normalizeText(payload.company_website_url),
    faq: payload.faq,
    coverage_all: payload.coverage_all,
    plan: payload.plan,
    verified: payload.verified,
    verified_date: payload.verified_date,
    status: payload.status,
  };

  const { data: created, error: createError } = await supabaseAdmin
    .from("executives")
    .insert(insertPayload)
    .select("id")
    .single();

  if (createError) {
    throw new Error(`createExecutiveFromAdmin failed: ${createError.message}`);
  }

  const executiveId = created.id as string;

  try {
    if (categoryIds.length > 0) {
      const { error: categoriesError } = await supabaseAdmin
        .from("executive_categories")
        .insert(
          categoryIds.map((categoryId) => ({
            executive_id: executiveId,
            category_id: categoryId,
          }))
        );

      if (categoriesError) {
        throw new Error(
          `createExecutiveFromAdmin categories failed: ${categoriesError.message}`
        );
      }
    }

    if (!payload.coverage_all && regionIds.length > 0) {
      const { error: regionsError } = await supabaseAdmin
        .from("executive_regions")
        .insert(
          regionIds.map((regionId) => ({
            executive_id: executiveId,
            region_id: regionId,
          }))
        );

      if (regionsError) {
        throw new Error(
          `createExecutiveFromAdmin regions failed: ${regionsError.message}`
        );
      }
    }

    const plans = payload.plans.filter(
      (plan) => typeof plan.name === "string" && plan.name.trim().length > 0
    );

    if (plans.length > 0) {
      const { error: plansError } = await supabaseAdmin
        .from("executive_plans")
        .insert(
          plans.map((plan) => ({
            executive_id: executiveId,
            name: plan.name.trim(),
            price_from: normalizeText(plan.price_from),
            target: normalizeText(plan.target),
            description: normalizeText(plan.description),
            features: plan.features,
            active: plan.active,
          }))
        );

      if (plansError) {
        throw new Error(
          `createExecutiveFromAdmin plans failed: ${plansError.message}`
        );
      }
    }
  } catch (error) {
    await supabaseAdmin.from("executives").delete().eq("id", executiveId);
    throw error;
  }

  return executiveId;
}

export interface CreateCategoryPayload {
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
}

export async function createCategoryFromAdmin(payload: CreateCategoryPayload) {
  const { data, error } = await supabaseAdmin
    .from("categories")
    .insert({
      slug: payload.slug.trim(),
      name: payload.name.trim(),
      description: normalizeText(payload.description),
      icon: normalizeText(payload.icon),
    })
    .select("id, slug, name")
    .single();

  if (error) {
    throw new Error(`createCategoryFromAdmin failed: ${error.message}`);
  }

  return data as { id: string; slug: string; name: string };
}
