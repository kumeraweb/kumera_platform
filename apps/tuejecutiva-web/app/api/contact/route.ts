import { NextResponse } from "next/server";
import { Resend } from "resend";

const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX = 5;
const rateStore = new Map<string, { count: number; resetAt: number }>();

function getString(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return "";
  return value.trim();
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

  const resend = new Resend(apiKey);
  const from = "TuEjecutiva.cl <hola@tractiva.cl>";
  const toInternal = process.env.CONTACT_INBOX_EMAIL || "contacto@kumeraweb.com";

  try {
    await resend.emails.send({
      from,
      to: toInternal,
      subject: "Nueva postulación desde TuEjecutiva.cl",
      text: `Nombre: ${nombreFinal}\nTeléfono: ${telefonoFinal}\nEmail: ${emailFinal}`,
    });

    if (email) {
      await resend.emails.send({
        from,
        to: email,
        subject: "Recibimos tu postulación ✔️",
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a; background-color: #f8fafc; padding: 24px;">
            <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px;">
              <div style="display: inline-block; padding: 10px 12px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; margin-bottom: 16px;">
                <img src="https://tuejecutiva.cl/logo/logonbg.png" alt="TuEjecutiva.cl" style="height: 36px; display: block;" />
              </div>
              <h2 style="margin: 0 0 12px; font-size: 20px;">Gracias por postular a TuEjecutiva.cl</h2>
              <p>Hola ${nombreFinal},</p>
              <p>Recibimos tu postulación correctamente. Nuestro equipo la revisará y te contactará si necesitamos más información.</p>
              <p style="margin-top: 16px;">TuEjecutiva.cl, una empresa de Kumera Servicios Digitales SpA.</p>
              <p style="margin-top: 8px;">Equipo TuEjecutiva.cl</p>
            </div>
          </div>
        `,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error inesperado.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
