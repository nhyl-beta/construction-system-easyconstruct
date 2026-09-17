import { Router } from "express";

import * as controller from "./controller.js";

import {
  authenticate,
  requireRole,
} from "../middleware/auth.js";

import { validate } from "../middleware/validate.js";

import {
  createDocumentSchema,
} from "../validators/document-validators.js";

import {
  advisoryDocumentUpload,
} from "./upload.js";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  controller.getAll,
);

router.post(
  "/",
  validate(createDocumentSchema),
  controller.create,
);

// Despite the middleware's name (originally built for Consultant advisory
// docs), this endpoint is the shared document-upload path for every role
// with a documents page: PM/Admin (pm-documents.tsx, reused by
// admin-documents.tsx) and Site Personnel (sp-documents.tsx) both call it
// via the same useFieldDocuments hook.
router.post(
  "/upload",
  requireRole("project-manager", "admin", "super-admin", "site-personnel", "consultant"),
  advisoryDocumentUpload.single("file"),
  controller.upload,
);

export default router;