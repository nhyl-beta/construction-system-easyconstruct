import { z } from "zod";

export const createProjectEngineerSchema = z.object({
  projectCode: z.string().min(1).max(50),
  userId: z.number().int().positive(),
  userName: z.string().min(1).max(100),
});
