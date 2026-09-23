import { z } from 'zod';

export const createProjectSchema = z.object({
  name:        z.string().min(2),
  code:        z.string().min(2).max(20),
  pm:          z.string().min(2),
  assignedEngineer: z.string().optional(),
  // `status`/`statusTone`/`progress` are accepted here only because create
  // forces them anyway (projects/service.ts create) — whatever the client
  // sends is overwritten with Proposal/neutral/0, never trusted.
  status:      z.string().optional(),
  statusTone:  z.string().optional(),
  progress:    z.number().min(0).max(100).optional(),
  budget:      z.number().min(0).optional(),
  contractValue: z.union([z.number().nonnegative(), z.string()]).optional().nullable(),
  due:         z.string().min(1),
  risk:        z.enum(['Low', 'Medium', 'High']).optional(),
  location:    z.string().optional(),
  client:      z.string().optional(),
  // ISO 4217. Kept to a closed list rather than free text so the
  // stored code always matches one the formatters can render.
  currency:    z.enum(['PHP', 'USD', 'EUR', 'AUD', 'SGD', 'JPY', 'AED']).optional(),
  workforce:   z.number().optional(),
  description: z.string().optional(),
  // Geofencing has always been evaluated against these three columns
  // (attendance/service.ts), but nothing could ever set them: they were
  // absent from this schema, so validate() stripped them from every request
  // and every project kept siteLatitude/siteLongitude NULL. With no fence to
  // measure against, every site clock-in fell through to the "Outside"
  // default and HR was handed a flag it had no way to check.
  siteLatitude:    z.union([z.number().min(-90).max(90), z.literal(""), z.null()]).optional(),
  siteLongitude:   z.union([z.number().min(-180).max(180), z.literal(""), z.null()]).optional(),
  geofenceRadiusM: z.union([z.number().int().min(10).max(20000), z.null()]).optional(),
});

// status/progress are lifecycle-owned from here on (see
// lifecycle/service.ts refreshProjectProgress, the only writer of
// `progress`, and lifecycle/routes.ts advance/hold/resume/cancel/archive,
// the only writers of `status`). A plain project PATCH can no longer touch
// either — projects/service.update throws if either key is present, as a
// second guard for anything that reaches the service without going through
// this schema.
export const updateProjectSchema = createProjectSchema
  .omit({ status: true, statusTone: true, progress: true })
  .partial();

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;