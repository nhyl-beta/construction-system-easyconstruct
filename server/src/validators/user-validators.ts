import { z } from "zod";

// Matches the reset-password rule enforced on the client
// (client/src/hooks/use-auth-controllers.ts) so a freshly created account
// can't start out weaker than one that has been through recovery.
const passwordSchema = z.string().min(10, "Password must be at least 10 characters");

export const createUserSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email().max(255),
  password: passwordSchema,
  // Validated against the roles table in users/service.ts — `users.role` is a
  // plain varchar, so there is no enum to check against here.
  role: z.string().min(1).max(50),
});

export const updateUserSchema = z
  .object({
    name: z.string().min(1).max(255).optional(),
    email: z.string().email().max(255).optional(),
    role: z.string().min(1).max(50).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export const setUserStatusSchema = z.object({
  isActive: z.boolean(),
});
