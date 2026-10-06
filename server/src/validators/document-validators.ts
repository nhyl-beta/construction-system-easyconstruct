// server/src/validators/document-validators.ts — NEW
import { z } from "zod";

export const createDocumentSchema = z.object({
  documentId: z.string().min(2).max(20),
  title: z.string().min(2).max(255),
  project: z.string().min(1).max(50),
  type: z.enum([
    "Field Report",
    "Site Photo",
    "Progress Evidence",
    "Supporting Document",
    // Lifecycle gate documents (D5) — see upload-document-dialog.tsx for
    // which gate check reads each one.
    "Notice of Award",
    "Contract",
    "Notice to Proceed",
    "Certificate of Completion",
    "Turnover Document",
    "As-Built Drawing",
    // Design-delivery projects: the client signs off the turnover (gate T2).
    "Client Acceptance",
  ]),
  version: z.string().max(10).optional(),
  size: z.string().max(20).optional(),
  fileUrl: z.string().max(500).optional(),
  uploadedBy: z.string().max(100).optional(),
  // I: optional link to the proposal/design this document concerns.
  relatedType: z.enum(["proposal", "design"]).optional(),
  relatedId: z.number().int().positive().optional(),
});