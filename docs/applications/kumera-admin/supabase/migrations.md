# Kumera Admin Migration References

Reference location for this app:
- `docs/applications/kumera-admin/supabase/`

Current status:
- Kumera Admin does not own a dedicated schema.
- It consumes/operates over `core`, `billing`, `tuejecutiva`, `leados` references.

Rule:
- Any schema change reference needed for admin must be stored under the actual owning app/domain.
