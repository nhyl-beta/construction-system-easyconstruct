import { z } from "zod";

export const createDesignSchema = z.object({
  code: z.string().min(2).max(50),
  name: z.string().min(2).max(255),
  projectCode: z.string().min(1).max(50),
  discipline: z.string().min(2).max(50),
  category: z.string().min(2).max(50),
  phase: z.string().max(50).optional(),
  version: z.string().max(20).optional(),
  revision: z.number().int().nonnegative().optional(),
  status: z.string().max(50).optional(),
  leadArchitect: z.string().min(2).max(100),
  client: z.string().max(255).optional(),
  building: z.string().max(100).optional(),
  floor: z.string().max(50).optional(),
  zone: z.string().max(50).optional(),
  description: z.string().optional(),
  fileCount: z.number().int().nonnegative().optional(),
  aiCompleteness: z.number().int().min(0).max(100).optional(),
  aiConfidence: z.number().int().min(0).max(100).optional(),
});

export const updateDesignSchema = createDesignSchema.partial();

export type CreateDesignInput = z.infer<typeof createDesignSchema>;
export type UpdateDesignInput = z.infer<typeof updateDesignSchema>;