-- LeadOS: client-level messaging/contact templates (DB-driven)
-- Idempotent migration

alter table if exists leados.clients
  add column if not exists priority_contact_email text,
  add column if not exists human_required_message_template text,
  add column if not exists close_client_no_response_template text,
  add column if not exists close_attended_other_line_template text;

-- Backfill with sensible defaults from existing client data (non-destructive)
update leados.clients
set priority_contact_email = coalesce(priority_contact_email, notification_email)
where priority_contact_email is null;
