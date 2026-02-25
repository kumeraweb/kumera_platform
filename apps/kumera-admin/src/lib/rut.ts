export function normalizeRut(raw: string) {
  return raw.replace(/[^0-9kK]/g, "").toUpperCase();
}

export function formatChileanRut(raw: string) {
  const normalized = normalizeRut(raw);
  if (normalized.length < 2) return normalized;
  const body = normalized.slice(0, -1);
  const dv = normalized.slice(-1);
  return `${Number(body).toLocaleString("es-CL").replace(/\./g, "")}-${dv}`;
}

export function isValidChileanRut(raw: string) {
  const normalized = normalizeRut(raw);
  if (!/^\d{7,8}[0-9K]$/.test(normalized)) return false;

  const body = normalized.slice(0, -1);
  const expectedDv = normalized.slice(-1);
  let sum = 0;
  let multiplier = 2;

  for (let i = body.length - 1; i >= 0; i -= 1) {
    sum += Number(body[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const remainder = 11 - (sum % 11);
  const computedDv = remainder === 11 ? "0" : remainder === 10 ? "K" : String(remainder);
  return computedDv === expectedDv;
}
