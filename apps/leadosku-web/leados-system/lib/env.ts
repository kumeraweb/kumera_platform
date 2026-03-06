function getEnv(name: string): string | undefined {
  return process.env[name]
}

export function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`)
  }
  return value
}
//testing co
export const env = {
  supabaseUrl: getEnv('SUPABASE_URL'),
  supabaseAnonKey: getEnv('SUPABASE_ANON_KEY'),
  supabaseServiceRoleKey: getEnv('SUPABASE_SERVICE_ROLE_KEY'),
  leadosSecretsKey: process.env.LEADOS_SECRETS_KEY,
  backofficeAdminEmail: process.env.BACKOFFICE_ADMIN_EMAIL,
  notificationFromEmail:
    process.env.NOTIFICATION_FROM_EMAIL ??
    process.env.CONTACT_FROM_EMAIL ??
    process.env.EMAIL_FROM ??
    'Kumera Messaging <noreply@kumeraweb.com>',
  notificationEmailSubject: process.env.NOTIFICATION_EMAIL_SUBJECT ?? 'Lead Reportado',
  openAiApiKey: process.env.OPENAI_API_KEY,
  metaApiBaseUrl: process.env.META_API_BASE_URL ?? 'https://graph.facebook.com/v20.0',
  resendApiKey: process.env.RESEND_API_KEY,
  internalCronSecret: process.env.INTERNAL_CRON_SECRET,
  cronSecret: process.env.APP_CRON_SECRET ?? process.env.CRON_SECRET,
  reminderTimezone: process.env.REMINDER_TIMEZONE ?? 'America/Santiago',
  reminderAllowedStartHour: Number(process.env.REMINDER_ALLOWED_START_HOUR ?? 9),
  reminderAllowedEndHour: Number(process.env.REMINDER_ALLOWED_END_HOUR ?? 19)
}
