function isAbsoluteUrl(value: string) {
  return value.startsWith("http://") || value.startsWith("https://");
}

function getSupabasePublicObjectUrl(bucket: string, path: string) {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!baseUrl) return null;
  return `${baseUrl}/storage/v1/object/public/${bucket}/${path}`;
}

export function getExecutivePhotoUrl(photoPath: string | null) {
  if (!photoPath) return null;
  if (isAbsoluteUrl(photoPath)) return photoPath;
  return getSupabasePublicObjectUrl("executive-photos", photoPath);
}

export function getCompanyLogoUrl(logoPath: string | null) {
  if (!logoPath) return null;
  if (isAbsoluteUrl(logoPath)) return logoPath;
  return getSupabasePublicObjectUrl("company-logos", logoPath);
}

const DEFAULT_EXECUTIVE_PHOTOS = [
  "/images/ejecutivaf.png",
  "/images/ejecutivasf.png",
];

function hashString(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getDefaultExecutivePhoto(seed: string) {
  if (!seed) return DEFAULT_EXECUTIVE_PHOTOS[0];
  const index = hashString(seed) % DEFAULT_EXECUTIVE_PHOTOS.length;
  return DEFAULT_EXECUTIVE_PHOTOS[index];
}
