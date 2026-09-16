// server/src/documents/routes.ts — NEW
import { Router } from "express";
import * as controller from "./controller.js";
import { validate } from "../middleware/validate.js";
import {
  authenticate,
  requireRole,
} from "../middleware/auth.js";
import { createDocumentSchema } from "../validators/document-validators.js";
import { advisoryDocumentUpload } from "./upload.js";

const router = Router();

router.use(authenticate);
router.get("/", controller.getAll);
router.post("/", validate(createDocumentSchema), controller.create);
router.post(
  "/upload",
  requireRole("consultant"),
  advisoryDocumentUpload.single("file"),
  controller.upload,
);

export default router;