import type { APIRoute } from "astro";
import { Resend } from "resend";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CONTACT_RATE_LIMIT_MAX = Number(import.meta.env.CONTACT_RATE_LIMIT_MAX || 6);
const CONTACT_RATE_LIMIT_WINDOW_SEC = Number(
  import.meta.env.CONTACT_RATE_LIMIT_WINDOW_SEC || 600
);
const CONTACT_INBOX_EMAIL =
  import.meta.env.CONTACT_INBOX_EMAIL || "contacto@kumeraweb.com";
const CONTACT_FROM_EMAIL =
  import.meta.env.CONTACT_FROM_EMAIL || "Kumera Web <contacto@kumeraweb.com>";
const AUTOREPLY_FROM_EMAIL =
  import.meta.env.AUTOREPLY_FROM_EMAIL || "Kumera Web <noreply@kumeraweb.com>";
const CONTACT_REPLY_TO_EMAIL =
  import.meta.env.CONTACT_REPLY_TO_EMAIL || "contacto@kumeraweb.com";

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const normalizeOrigin = (value: string) => {
  try {
    return new URL(value).origin.toLowerCase();
  } catch {
    return null;
  }
};

const getClientIp = (request: Request) => {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip") || "unknown";
};

const consumeRateLimit = (key: string, max: number, windowMs: number) => {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || now > existing.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  existing.count += 1;
  buckets.set(key, existing);

  if (existing.count > max) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  return { allowed: true, retryAfterSeconds: 0 };
};

const parseAllowedOriginsFromEnv = () =>
  (import.meta.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((origin: string) => normalizeOrigin(origin.trim()))
    .filter((origin: string | null): origin is string => Boolean(origin));

const isTrustedOriginRequest = (request: Request) => {
  const trusted = new Set<string>(parseAllowedOriginsFromEnv());

  if (import.meta.env.VERCEL_URL) {
    const vercelOrigin = normalizeOrigin(`https://${import.meta.env.VERCEL_URL}`);
    if (vercelOrigin) trusted.add(vercelOrigin);
  }

  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const proto =
    request.headers.get("x-forwarded-proto") ||
    new URL(request.url).protocol.replace(":", "");
  if (host && proto) {
    const hostOnly = host.split(":")[0].toLowerCase();
    const origin = normalizeOrigin(`${proto}://${hostOnly}`);
    if (origin) trusted.add(origin);
    const alternateHost = hostOnly.startsWith("www.")
      ? hostOnly.slice(4)
      : `www.${hostOnly}`;
    const alternateOrigin = normalizeOrigin(`${proto}://${alternateHost}`);
    if (alternateOrigin) trusted.add(alternateOrigin);
  }

  const originHeader = request.headers.get("origin");
  const origin = originHeader ? normalizeOrigin(originHeader) : null;
  if (origin && trusted.has(origin)) return true;

  const refererHeader = request.headers.get("referer");
  const referer = refererHeader ? normalizeOrigin(refererHeader) : null;
  if (referer && trusted.has(referer)) return true;

  return false;
};

export const POST: APIRoute = async ({ request }) => {
  try {
    if (!isTrustedOriginRequest(request)) {
      return new Response(JSON.stringify({ error: "Origen no permitido." }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const apiKey = import.meta.env.RESEND_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Missing RESEND_API_KEY." }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const formData = await request.formData();
    const nombre = formData.get("nombre")?.toString().trim() || "";
    const email = formData.get("email")?.toString().trim().toLowerCase() || "";
    const mensaje = formData.get("mensaje")?.toString().trim() || "";

    if (!nombre || !email || !mensaje) {
      return new Response(JSON.stringify({ error: "Nombre, correo y mensaje son requeridos." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (!EMAIL_REGEX.test(email)) {
      return new Response(JSON.stringify({ error: "Correo inválido." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const rateKey = `contact:${getClientIp(request)}:${email}`;
    const limit = consumeRateLimit(
      rateKey,
      CONTACT_RATE_LIMIT_MAX,
      CONTACT_RATE_LIMIT_WINDOW_SEC * 1000
    );
    if (!limit.allowed) {
      return new Response(JSON.stringify({ error: "Demasiados intentos. Intenta más tarde." }), {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(limit.retryAfterSeconds),
        },
      });
    }

    const safeNombre = escapeHtml(nombre.slice(0, 120));
    const safeEmail = escapeHtml(email.slice(0, 160));
    const safeMensaje = escapeHtml(mensaje.slice(0, 4000));

    const resend = new Resend(apiKey);

    const internalResult = await resend.emails.send({
      from: CONTACT_FROM_EMAIL,
      to: CONTACT_INBOX_EMAIL,
      replyTo: email,
      subject: `Nuevo contacto web Kumera — ${nombre}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 560px; padding: 24px;">
          <h2 style="margin: 0 0 12px;">Nuevo contacto desde kumeraweb.com</h2>
          <p><strong>Nombre:</strong> ${safeNombre}</p>
          <p><strong>Correo:</strong> ${safeEmail}</p>
          <p><strong>Mensaje:</strong><br/>${safeMensaje}</p>
        </div>
      `,
    });

    if (internalResult.error) {
      console.error("Resend internal error:", internalResult.error);
      return new Response(JSON.stringify({ error: "No se pudo enviar el correo interno." }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }

    const autoReplyResult = await resend.emails.send({
      from: AUTOREPLY_FROM_EMAIL,
      to: email,
      replyTo: CONTACT_REPLY_TO_EMAIL,
      subject: "Recibimos tu mensaje - Kumera",
      text: `Hola ${nombre},

Gracias por contactar a Kumera.
Recibimos tu mensaje y lo estamos evaluando.
Te responderemos a la brevedad.

Kumera Servicios Digitales SpA`,
    });

    if (autoReplyResult.error) {
      console.error("Resend autoreply error (non-blocking):", autoReplyResult.error);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error en contacto Kumera:", error);
    return new Response(JSON.stringify({ error: "Error al enviar." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
