# Manual Auth Migration Checklist

## Scope
Manual migration for low-volume users into unified Supabase Auth.

## Checklist
- [ ] Export current admins/operators by service (billing, tuejecutiva, leados).
- [ ] Normalize canonical emails and map target global role.
- [ ] Create users in unified Auth.
- [ ] Assign `core.user_roles` entries.
- [ ] Validate login for each critical user.
- [ ] Validate module permissions by role.
- [ ] Disable legacy access paths/user records where applicable.
- [ ] Store migration evidence (date, actor, result, notes).

## Safety requirements
- No destructive automated migration scripts.
- Keep rollback notes for each migrated user.
- Migrate one service scope at a time.
