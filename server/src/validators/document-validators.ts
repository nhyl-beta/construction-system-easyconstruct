// server/src/validators/document-validators.ts — NEW
import { z } from "zod";

export const createDocumentSchema = z.object({
  documentId: z.string().min(2).max(20),
  title: z.string().min(2).max(255),
  project: z.string().min(1).max(50),
  type: z.enum(["Field Report", "Site Photo", "Progress Evidence", "Supporting Document"]),
  version: z.string().max(10).optional(),
  size: z.string().max(20).optional(),
  fileUrl: z.string().max(500).optional(),
  uploadedBy: z.string().max(100).optional(),
});