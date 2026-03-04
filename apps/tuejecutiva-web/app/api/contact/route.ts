import { NextResponse } from "next/server";
import { Resend } from "resend";

const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX = 5;
const AUTOREPLY_TIMEOUT_MS = 2500;
const rateStore = new Map<string, { count: number; resetAt: number }>();

function getString(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return "";
  return value.trim();
}
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
  if (isRateLimited(`contact:${ip}`)) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes. Intenta nuevamente en unos minutos." },
      { status: 429 }
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Missing RESEND_API_KEY." }, { status: 500 });
  }

  const formData = await request.formData();
  const nombre = getString(formData.get("nombre"));
  const telefono = getString(formData.get("telefono"));
  const email = getString(formData.get("email"));
  const nombreFinal = nombre || "No informado";
  const telefonoFinal = telefono || "No informado";
  const emailFinal = email || "No informado";

  if (!telefono && !email) {
    return NextResponse.json(
      { error: "Debes enviar teléfono o correo." },
      { status: 400 }
    );
  }

  if (email && !EMAIL_REGEX.test(email)) {
    return NextResponse.json({ error: "Email inválido." }, { status: 400 });
  }

  const resend = new Resend(apiKey);
  const contactFromEmail =
    process.env.CONTACT_FROM_EMAIL || "TuEjecutiva.cl <contacto@kumeraweb.com>";
  const autoreplyFromEmail =
    process.env.AUTOREPLY_FROM_EMAIL || "TuEjecutiva.cl <noreply@kumeraweb.com>";
  const toInternal = process.env.CONTACT_INBOX_EMAIL || "contacto@kumeraweb.com";
  const contactReplyToEmail =
    process.env.CONTACT_REPLY_TO_EMAIL || "contacto@kumeraweb.com";
  const siteBaseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.tuejecutiva.cl";
  const logoUrl = `${siteBaseUrl.replace(/\/$/, "")}/logo/logonbg.png`;

  try {
    let internalResult: Awaited<ReturnType<typeof resend.emails.send>>;
    try {
      internalResult = await resend.emails.send({
        from: contactFromEmail,
        to: toInternal,
        replyTo: email || undefined,
        subject: "Nueva postulación desde TuEjecutiva.cl",
        text: `Nombre: ${nombreFinal}\nTeléfono: ${telefonoFinal}\nEmail: ${emailFinal}`,
      });
    } catch {
      return NextResponse.json(
        { error: "No se pudo enviar la postulación. Intenta nuevamente." },
        { status: 502 }
      );
    }

    if (internalResult.error) {
      return NextResponse.json(
        { error: "No se pudo enviar el correo interno." },
        { status: 502 }
      );
    }

    if (email) {
      try {
        const autoReplyResult = await Promise.race([
          resend.emails.send({
            from: autoreplyFromEmail,
            to: email,
            replyTo: contactReplyToEmail,
            subject: "Recibimos tu postulación ✔️",
            html: `
              <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a; background-color: #f8fafc; padding: 24px;">
                <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px;">
                  <div style="display: inline-block; padding: 10px 12px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; margin-bottom: 16px;">
                    <img src="${logoUrl}" alt="TuEjecutiva.cl" style="height: 36px; display: block;" />
                  </div>
                  <h2 style="margin: 0 0 12px; font-size: 20px;">Gracias por postular a TuEjecutiva.cl</h2>
                  <p>Hola ${nombreFinal},</p>
                  <p>Recibimos tu postulación correctamente. Nuestro equipo la revisará y te contactará si necesitamos más información.</p>
                  <p style="margin-top: 16px;">TuEjecutiva.cl, una empresa de Kumera Servicios Digitales SpA.</p>
                  <p style="margin-top: 8px;">Equipo TuEjecutiva.cl</p>
                </div>
              </div>
            `,
          }),
          new Promise<"timeout">((resolve) =>
            setTimeout(() => resolve("timeout"), AUTOREPLY_TIMEOUT_MS)
          ),
        ]);

        // No bloquear conversión si falla o se demora la confirmación al usuario.
        if (autoReplyResult === "timeout") {
          console.error("Resend autoreply timeout (non-blocking)");
        } else if (autoReplyResult.error) {
          console.error("Resend autoreply error (non-blocking):", autoReplyResult.error);
        }
      } catch (error) {
        console.error("Resend autoreply exception (non-blocking):", error);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error inesperado.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
