import { NextResponse } from "next/server";
import {
  createSubmission,
  getTokenByValue,
  isTokenValid,
  markTokenUsed,
} from "@/lib/onboarding";
import { analyzeGuardrails } from "@/lib/contentGuardrails";

const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX = 3;
const rateStore = new Map<string, { count: number; resetAt: number }>();

function getString(value: FormDataEntryValue | null) {
  if (!value || typeof value !== "string") return "";
  return value.trim();
}

function getBoolean(value: FormDataEntryValue | null) {
  if (!value || typeof value !== "string") return false;
  return value === "true" || value === "on";
}

function getClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip") || "unknown";
}

function isRateLimited(key: string) {
  const now = Date.now();
  const entry = rateStore.get(key);
  if (!entry || entry.resetAt <= now) {
    rateStore.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  if (entry.count >= RATE_MAX) return true;
  entry.count += 1;
  return false;
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (isRateLimited(`onboarding:${ip}`)) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes. Intenta nuevamente en unos minutos." },
      { status: 429 }
    );
  }

  try {
    const formData = await request.formData();
    const tokenValue = getString(formData.get("token"));

    let tokenId: string | null = null;
    if (!tokenValue) {
      return NextResponse.json({ error: "Token requerido." }, { status: 400 });
    }
    const token = await getTokenByValue(tokenValue);
    if (!isTokenValid(token)) {
      return NextResponse.json({ error: "Token inválido o expirado." }, { status: 403 });
    }
    tokenId = token ? token.id : null;

    const fullName = getString(formData.get("full_name"));
    const email = getString(formData.get("email"));
    const phone = getString(formData.get("phone"));
    const company = getString(formData.get("company"));
    const categoryId = getString(formData.get("category_id"));
    const coverageAll = getBoolean(formData.get("coverage_all"));
    const customCategory = getString(formData.get("custom_category"));
    const acceptedTerms = getBoolean(formData.get("accepted_terms"));
    const acceptedDataUse = getBoolean(formData.get("accepted_data_use"));

    const regionIds = formData.getAll("region_ids").filter((value) => typeof value === "string") as string[];

    if (!fullName || !email || !phone || !company) {
      return NextResponse.json({ error: "Faltan campos obligatorios." }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Email inválido." }, { status: 400 });
    }

    if (!acceptedTerms || !acceptedDataUse) {
      return NextResponse.json({ error: "Debes aceptar términos y uso de datos." }, { status: 400 });
    }

    if (!categoryId && !customCategory) {
      return NextResponse.json({ error: "Debes seleccionar una categoría o escribir una categoría libre." }, { status: 400 });
    }

    if (!coverageAll && regionIds.length === 0) {
      return NextResponse.json({ error: "Debes seleccionar regiones si no es cobertura nacional." }, { status: 400 });
    }

    const guardrails = analyzeGuardrails([
      { field: "full_name", value: fullName },
      { field: "company", value: company },
      { field: "custom_category", value: customCategory },
    ]);

    if (guardrails.hardMatches.length > 0) {
      const first = guardrails.hardMatches[0];
      return NextResponse.json(
        {
          error: `Contenido bloqueado por compliance en ${first.field}: término no permitido "${first.term}".`,
        },
        { status: 400 }
      );
    }

    const submissionId = await createSubmission({
      token_id: tokenId,
      full_name: fullName,
      email,
      phone,
      company,
      coverage_all: coverageAll,
      custom_category: customCategory || null,
      accepted_terms: acceptedTerms,
      accepted_data_use: acceptedDataUse,
      status: "pending",
      category_id: categoryId || null,
      region_ids: coverageAll ? [] : regionIds,
    });

    if (tokenId) {
      await markTokenUsed(tokenId);
    }

    const warningTerms = Array.from(
      new Set(guardrails.softMatches.map((match) => match.term))
    );

    return NextResponse.json({ success: true, submissionId, warnings: warningTerms });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error inesperado";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
