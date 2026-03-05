import type { APIRoute } from "astro";
import { Resend } from "resend";
import { consumeRateLimit } from "../../lib/server/rate-limit";
import { getClientIp, rejectUntrustedOrigin } from "../../lib/server/security";

const CONTACT_FROM_EMAIL =
  import.meta.env.CONTACT_FROM_EMAIL || "Sitiora Kumera <contacto@kumeraweb.com>";
const AUTOREPLY_FROM_EMAIL =
  import.meta.env.AUTOREPLY_FROM_EMAIL || "Sitiora Kumera <noreply@kumeraweb.com>";
const INBOX_EMAIL = import.meta.env.CONTACT_INBOX_EMAIL || "contacto@kumeraweb.com";
const CONTACT_REPLY_TO_EMAIL =
  import.meta.env.CONTACT_REPLY_TO_EMAIL || "contacto@kumeraweb.com";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CONTACT_RATE_LIMIT_MAX = Number(import.meta.env.CONTACT_RATE_LIMIT_MAX || 6);
const CONTACT_RATE_LIMIT_WINDOW_SEC = Number(import.meta.env.CONTACT_RATE_LIMIT_WINDOW_SEC || 600);

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

export const POST: APIRoute = async (context) => {
  try {
    const originError = rejectUntrustedOrigin(context);
    if (originError) return originError;

    const apiKey = import.meta.env.RESEND_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Servicio de correo no configurado." }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store, max-age=0",
        },
      });
    }

    const resend = new Resend(apiKey);
    const formData = await context.request.formData();

    const nombre = formData.get("nombre")?.toString().trim() || "";
    const email = formData.get("email")?.toString().trim().toLowerCase() || "";
    const telefono = formData.get("telefono")?.toString().trim() || "";
    const servicio = formData.get("servicio")?.toString().trim() || "";
    const mensaje = formData.get("mensaje")?.toString().trim() || "";

    const rateKey = `contact:${getClientIp(context.request)}:${email || "unknown"}`;
    const limit = consumeRateLimit(rateKey, CONTACT_RATE_LIMIT_MAX, CONTACT_RATE_LIMIT_WINDOW_SEC * 1000);
    if (!limit.allowed) {
      return new Response(JSON.stringify({ error: "Demasiados intentos. Intenta mas tarde." }), {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store, max-age=0",
          "Retry-After": String(limit.retryAfterSeconds),
        },
      });
    }

    if (!nombre || !email || !EMAIL_REGEX.test(email) || !servicio || !mensaje) {
      return new Response(JSON.stringify({ error: "Nombre, email, servicio y mensaje son requeridos." }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store, max-age=0",
        },
      });
    }

    const safeNombre = escapeHtml(nombre.slice(0, 120));
    const safeEmail = escapeHtml(email.slice(0, 160));
    const safeTelefono = escapeHtml(telefono.slice(0, 40));
    const safeServicio = escapeHtml(servicio.slice(0, 80));
    const safeMensaje = escapeHtml(mensaje.slice(0, 4000));

    const internalEmailResult = await resend.emails.send({
      from: CONTACT_FROM_EMAIL,
      to: INBOX_EMAIL,
      replyTo: email,
      subject: `Nuevo lead Sitiora - ${nombre}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 24px; max-width: 580px; color: #0f172a;">
          <h2 style="font-size: 20px; margin: 0 0 16px;">Nuevo lead desde sitiora</h2>
          <table style="font-size: 15px; color: #334155; line-height: 1.6; border-collapse: collapse;">
            <tr><td style="padding: 6px 12px 6px 0; font-weight: 600;">Nombre</td><td>${safeNombre}</td></tr>
            <tr><td style="padding: 6px 12px 6px 0; font-weight: 600;">Email</td><td>${safeEmail}</td></tr>
            <tr><td style="padding: 6px 12px 6px 0; font-weight: 600;">Telefono</td><td>${safeTelefono || "-"}</td></tr>
            <tr><td style="padding: 6px 12px 6px 0; font-weight: 600;">Servicio</td><td>${safeServicio}</td></tr>
            <tr><td style="padding: 6px 12px 6px 0; font-weight: 600; vertical-align: top;">Mensaje</td><td>${safeMensaje}</td></tr>
          </table>
        </div>
      `,
    });

    if (internalEmailResult.error) {
      console.error("Resend internal error:", internalEmailResult.error);
      return new Response(JSON.stringify({ error: "No se pudo enviar el correo interno." }), {
        status: 502,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store, max-age=0",
        },
      });
    }

    const autoReplyResult = await resend.emails.send({
      from: AUTOREPLY_FROM_EMAIL,
      to: email,
      replyTo: CONTACT_REPLY_TO_EMAIL,
      subject: "Recibimos tu solicitud - Sitiora Kumera",
      text: `Hola ${nombre},\n\nGracias por escribirnos. Recibimos tu solicitud para ${servicio}.\nTe responderemos dentro de las proximas 24 horas habiles.\n\nSi prefieres, puedes escribir directamente por WhatsApp:\nhttps://wa.me/56994186218\n\nKumera Servicios Digitales SpA`,
      headers: {
        "Auto-Submitted": "auto-replied",
        "X-Auto-Response-Suppress": "All",
      },
    });

    if (autoReplyResult.error) {
      // Keep lead flow successful even if the auto-reply fails.
      console.error("Resend autoreply error (non-blocking):", autoReplyResult.error);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error("Error enviando lead sitiora:", error);
    return new Response(JSON.stringify({ error: "Error al enviar." }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, max-age=0",
      },
    });
  }
};
