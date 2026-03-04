export interface ContactLinks {
  normalizedPhone: string;
  telHref: string;
  waHref: string;
  hasContact: boolean;
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function normalizeChilePhone(rawPhone: string | null | undefined) {
  const digits = onlyDigits(String(rawPhone || ""));
  if (!digits) return "";

  // Already includes country code
  if (digits.startsWith("56") && digits.length >= 10) {
    return digits;
  }

  // Local Chile mobile/landline without country code
  if (digits.length === 8 || digits.length === 9) {
    return `56${digits}`;
  }

  // Fallback for unusual but still numeric values
  return digits;
}

export function getContactLinks(rawPhone: string | null | undefined, whatsappMessage?: string | null): ContactLinks {
  const normalizedPhone = normalizeChilePhone(rawPhone);
  if (!normalizedPhone) {
    return {
      normalizedPhone: "",
      telHref: "#",
      waHref: "#",
      hasContact: false,
    };
  }

  const message = (whatsappMessage || "").trim();
  const waQuery = message ? `?text=${encodeURIComponent(message)}` : "";

  return {
    normalizedPhone,
    telHref: `tel:+${normalizedPhone}`,
    waHref: `https://wa.me/${normalizedPhone}${waQuery}`,
    hasContact: true,
  };
}
