import { NextResponse } from 'next/server';
import { env } from '@/lib/env';

const configuredWindowSeconds = Number(process.env.CONTACT_RATE_LIMIT_WINDOW_SECONDS ?? 600);
const configuredMaxRequests = Number(process.env.CONTACT_RATE_LIMIT_MAX_REQUESTS ?? 5);
const RATE_WINDOW_MS =
  Number.isFinite(configuredWindowSeconds) && configuredWindowSeconds > 0
    ? configuredWindowSeconds * 1000
    : 10 * 60 * 1000;
const RATE_MAX =
  Number.isFinite(configuredMaxRequests) && configuredMaxRequests > 0
    ? configuredMaxRequests
    : 5;
const rateStore = new Map<string, { count: number; resetAt: number }>();
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type ContactPayload = {
  nombre?: string;
  negocio?: string;
  telefono?: string;
  email?: string;
  mensaje?: string;
};

function getClientIp(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() || 'unknown';
  return request.headers.get('x-real-ip') || 'unknown';
}

function isRateLimited(key: string) {
  if (rateStore.size > 1000) {
    const now = Date.now();
    for (const [entryKey, entry] of rateStore.entries()) {
      if (entry.resetAt <= now) {
        rateStore.delete(entryKey);
      }
    }
  }

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

function sanitize(value?: string) {
  if (typeof value !== 'string') return '';
  return value.trim();
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (isRateLimited(`kumeramessaging_contact:${ip}`)) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes. Intenta nuevamente en unos minutos.' },
      { status: 429 }
    );
  }

  if (!env.resendApiKey) {
    return NextResponse.json({ error: 'Missing RESEND_API_KEY.' }, { status: 500 });
  }

  let payload: ContactPayload;
  try {
    payload = (await request.json()) as ContactPayload;
  } catch {
    return NextResponse.json({ error: 'Payload inválido.' }, { status: 400 });
  }

  const nombre = sanitize(payload.nombre);
  const negocio = sanitize(payload.negocio);
  const telefono = sanitize(payload.telefono);
  const email = sanitize(payload.email);
  const mensaje = sanitize(payload.mensaje);

  const identity = (email || telefono || 'anonymous').toLowerCase();
  if (isRateLimited(`kumeramessaging_contact_identity:${identity}`)) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes para este contacto. Intenta nuevamente en unos minutos.' },
      { status: 429 }
    );
  }

  if (!telefono && !email) {
    return NextResponse.json({ error: 'Debes enviar teléfono o correo.' }, { status: 400 });
  }
  if (email && !EMAIL_REGEX.test(email)) {
    return NextResponse.json({ error: 'Email inválido.' }, { status: 400 });
  }

  const internalTo = process.env.CONTACT_INBOX_EMAIL || 'contacto@kumeraweb.com';
  const fromEmail = process.env.CONTACT_FROM_EMAIL || 'Kumera Messaging <contacto@kumeraweb.com>';

  const subject = `Nueva solicitud comercial — Kumera Messaging (${negocio || 'Sin rubro'})`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height:1.55; color:#111827;">
      <h2 style="margin:0 0 12px;">Nueva solicitud desde kumeramessaging.cl</h2>
      <p><strong>Nombre:</strong> ${nombre || 'No informado'}</p>
      <p><strong>Negocio/Rubro:</strong> ${negocio || 'No informado'}</p>
      <p><strong>Teléfono:</strong> ${telefono || 'No informado'}</p>
      <p><strong>Email:</strong> ${email || 'No informado'}</p>
      <p><strong>Mensaje:</strong><br/>${mensaje || 'No informado'}</p>
    </div>
  `;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.resendApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [internalTo],
      reply_to: email || undefined,
      subject,
      html
    })
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    console.error('contact_form_resend_error', { status: response.status, detail });
    return NextResponse.json({ error: 'No se pudo enviar tu solicitud.' }, { status: 502 });
  }

  return NextResponse.json({ success: true });
}
