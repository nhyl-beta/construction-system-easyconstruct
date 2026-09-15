# Fixes applied

- Standardized project risk values to the lowercase enum used by the shared project model (`low`, `medium`, `high`).
- Updated the project creation form to use the lowercase risk values and keep the Select values consistent with the model.
- Fixed the project detail page so it saves the risk value without converting it to an incompatible casing.
- Added the missing optional `assignedEngineer` field to the project type and normalized data mapping to match backend/mock data.
- Ensured repository-created project objects include the required `id` field, preventing missing-property TypeScript errors.
- Verified the client app builds successfully with `npm --prefix client run build`.
