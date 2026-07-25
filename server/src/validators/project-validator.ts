import { z } from 'zod';

export const createProjectSchema = z.object({
  name:        z.string().min(2),
  code:        z.string().min(2).max(20),
  pm:          z.string().min(2),
  status:      z.string().optional(),
  statusTone:  z.string().optional(),
  progress:    z.number().min(0).max(100).optional(),
  budget:      z.number().min(0).optional(),
  due:         z.string().min(1),
  risk:        z.enum(['Low', 'Medium', 'High']).optional(),
  location:    z.string().optional(),
  client:      z.string().optional(),
  workforce:   z.number().optional(),
  description: z.string().optional(),
});

export const updateProjectSchema = createProjectSchema.partial();

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;