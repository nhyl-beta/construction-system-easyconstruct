// server/src/documents/routes.ts — NEW
import { Router } from "express";
import * as controller from "./controller.js";
import { validate } from "../middleware/validate.js";
import { authenticate } from "../middleware/auth.js";
import { createDocumentSchema } from "../validators/document-validators.js";

const router = Router();

router.use(authenticate);
router.get("/", controller.getAll);
router.post("/", validate(createDocumentSchema), controller.create);

export default router;