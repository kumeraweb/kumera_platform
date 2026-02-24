import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import {
  createExecutiveFromAdmin,
  getSubmissionDetail,
  uploadAdminCompanyLogo,
  uploadAdminExecutivePhoto,
  updateSubmissionStatus,
  type ExecutivePlan,
  type ExecutiveStatus,
} from "@/lib/onboarding";

function asText(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function asOptionalText(value: FormDataEntryValue | null) {
  const text = asText(value);
  return text.length > 0 ? text : null;
}

function asNumberOrNull(value: FormDataEntryValue | null) {
  const text = asText(value);
  if (!text) return null;
  const num = Number(text);
  return Number.isFinite(num) ? num : null;
}

function hasChecked(formData: FormData, fieldName: string) {
  return formData.get(fieldName) === "on";
}

function toUniqueList(values: FormDataEntryValue[]) {
  return Array.from(
    new Set(
      values
        .filter((value): value is string => typeof value === "string")
        .map((value) => value.trim())
        .filter((value) => value.length > 0)
    )
  );
}

function parseJsonOrNull(value: string, fieldName: string) {
  if (!value.trim()) return null;
  try {
    return JSON.parse(value);
  } catch {
    throw new Error(`JSON inválido en ${fieldName}`);
  }
}

function parsePlansJson(value: string) {
  if (!value.trim()) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error("JSON inválido en planes");
  }

  if (!Array.isArray(parsed)) {
    throw new Error("El campo planes debe ser un arreglo JSON");
  }

  return parsed.map((item) => {
    if (!item || typeof item !== "object") {
      throw new Error("Cada plan debe ser un objeto JSON");
    }
    const row = item as Record<string, unknown>;
    const name = typeof row.name === "string" ? row.name : "";
    const active = typeof row.active === "boolean" ? row.active : true;
    const features = Array.isArray(row.features) ? row.features : [];

    return {
      name,
      price_from: typeof row.price_from === "string" ? row.price_from : null,
      target: typeof row.target === "string" ? row.target : null,
      description: typeof row.description === "string" ? row.description : null,
      features,
      active,
    };
  });
}

function getFileOrNull(value: FormDataEntryValue | null) {
  if (!value || !(value instanceof File)) return null;
  if (value.size <= 0) return null;
  return value;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const url = new URL(`/admin/submissions/${id}/publish`, request.url);

  try {
    const formData = await request.formData();
    const submission = await getSubmissionDetail(id);

    if (!submission) {
      url.searchParams.set("error", "Submission no encontrada");
      return NextResponse.redirect(url, { status: 303 });
    }

    const categoryIds = toUniqueList(formData.getAll("category_ids"));
    if (categoryIds.length === 0) {
      url.searchParams.set("error", "Debes seleccionar al menos una categoría");
      return NextResponse.redirect(url, { status: 303 });
    }

    const slug = asText(formData.get("slug"));
    let photoUrl = asOptionalText(formData.get("photo_url")) ?? submission.photo_url;
    let companyLogoUrl =
      asOptionalText(formData.get("company_logo_url")) ?? submission.company_logo_url;

    const photoFile = getFileOrNull(formData.get("photo_file"));
    if (photoFile) {
      photoUrl = await uploadAdminExecutivePhoto({ file: photoFile, slug });
    }

    const logoFile = getFileOrNull(formData.get("company_logo_file"));
    if (logoFile) {
      companyLogoUrl = await uploadAdminCompanyLogo({ file: logoFile, slug });
    }

    const executiveId = await createExecutiveFromAdmin({
      name: asText(formData.get("name")),
      slug,
      phone: asText(formData.get("phone")),
      company: asText(formData.get("company")),
      experience_years: asNumberOrNull(formData.get("experience_years")),
      specialty: asOptionalText(formData.get("specialty")),
      description: asOptionalText(formData.get("description")),
      whatsapp_message: asOptionalText(formData.get("whatsapp_message")),
      photo_url: photoUrl,
      company_logo_url: companyLogoUrl,
      company_website_url: asOptionalText(formData.get("company_website_url")),
      faq: parseJsonOrNull(asText(formData.get("faq_json")), "FAQ") ?? submission.faq,
      coverage_all: hasChecked(formData, "coverage_all"),
      plan: (asText(formData.get("plan")) || "bronce") as ExecutivePlan,
      verified: hasChecked(formData, "verified"),
      verified_date: asOptionalText(formData.get("verified_date")),
      status: (asText(formData.get("status")) || "active") as ExecutiveStatus,
      category_ids: categoryIds,
      region_ids: toUniqueList(formData.getAll("region_ids")),
      plans: parsePlansJson(asText(formData.get("plans_json"))),
    });

    if (hasChecked(formData, "mark_approved")) {
      await updateSubmissionStatus(id, "approved");
    }

    revalidatePath("/admin");
    revalidatePath(`/admin/submissions/${id}`);
    revalidatePath(`/admin/submissions/${id}/publish`);

    url.searchParams.set("ok", "1");
    url.searchParams.set("executive_id", executiveId);
    return NextResponse.redirect(url, { status: 303 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo crear la ejecutiva";
    url.searchParams.set("error", message);
    return NextResponse.redirect(url, { status: 303 });
  }
}
