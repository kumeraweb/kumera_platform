# Billing Schema Current State

Last updated: 2026-03-04

## Scope
This document reflects the current billing architecture used by:
- `apps/kumera-admin` (internal operations)
- `apps/kumerabilling-web` (client onboarding wizard at `clientes.kumeraweb.com`)

## Main Tables (`billing` schema)

### `companies`
Purpose: client legal record created before onboarding link generation.

Key fields:
- `id`
- `customer_type` (`company` | `person`)
- `legal_name`
- `rut`
- `address`
- `email`
- `phone`
- `tax_document_type` (`factura` | `boleta`)
- `legal_representative_name` (nullable)
- `legal_representative_rut` (nullable)

### `services`
Purpose: canonical Kumera services catalog.

Expected active slugs:
- `tractiva`
- `tuejecutiva`
- `leadosku`
- `sitiora`

### `plans`
Purpose: plan catalog per service.

- `service_id` -> `services.id`
- `name`
- `price_cents`
- `billing_cycle_days`

### `subscriptions`
Purpose: one subscription per company/service created by onboarding generation.

- `company_id`
- `service_id`
- `plan_id`
- `status` (`pending_activation`, `active`, `suspended`, `cancelled`)

### `contract_templates`
Purpose: reusable HTML templates selected in admin.

- `service_id`
- `name`
- `version`
- `status` (`draft`, `active`, `archived`)
- `target_customer_type` (`company`, `person`, `any`)
- `html_template`
- `variables_schema`

### `contracts`
Purpose: immutable rendered contract evidence per subscription.

- `subscription_id`
- `template_id`
- `template_version`
- `version`
- `html_rendered`
- `content_hash`
- `accepted`
- `accepted_at`
- `accepted_ip`
- `accepted_user_agent`
- `metadata`

### `payments`
Purpose: payment lifecycle.

- `subscription_id`
- `method` (`bank_transfer`)
- `status` (`pending`, `validated`, `rejected`, `expired`)
- `amount_cents`
- `due_date`
- `validated_at`
- `rejection_reason`

### `payment_transfer_proofs`
Purpose: proof files metadata linked to payments.

- `payment_id`
- `file_path`
- `mime_type`
- `size_bytes`

### `onboarding_tokens`
Purpose: secure onboarding links.

- `subscription_id`
- `token`
- `expires_at`
- `consumed_at`
- `revoked_at`

### `onboarding_events`
Purpose: event timeline for onboarding traceability.

Common events:
- `onboarding.created`
- `onboarding.opened`
- `contract.accepted`
- `payment.transfer_proof.uploaded`

### `audit_logs`
Purpose: operational audit events from admin and API actions.

## Storage Buckets

- `payment-proofs` (private): transfer proof files.
- `contract-assets` (private): reserved for contract assets (e.g. signatures/images).

## Current Wizard Flow (`clientes.kumeraweb.com`)

1. Validate onboarding token.
2. Show contract rendered from `contracts.html_rendered`.
3. Client accepts contract (captures acceptance evidence in contract + event payload).
4. Show official bank transfer info.
5. Client uploads transfer proof.
6. Token is consumed after proof upload.
7. Client can download the generated contract HTML from wizard.

## Admin Flow (`/admin/billing`)

1. Input customer data (person/company).
2. Select service + plan + template.
3. Preview rendered contract.
4. Generate onboarding link (creates company, subscription, token, contract, first payment).
5. Validate/reject payment.

## Migrations Applied for Billing Centralization

- `20260225_000002_billing_contract_templates.sql`
- `20260225_000003_billing_seed_default_templates.sql`
- `20260225_000004_billing_customer_types_and_templates.sql`
- `20260225_000005_billing_seed_services_and_plans.sql`
- `20260225_000006_billing_presigned_templates.sql`
- `20260304_000015_billing_sitiora_service_plans_template.sql`
