// server/src/uploads/routes.ts — NEW
import { Router } from "express";
import * as controller from "./controller.js";
import { validate } from "../middleware/validate.js";
import { authenticate } from "../middleware/auth.js";
import { uploadSchema } from "../validators/upload-validators.js";

const router = Router();

router.use(authenticate);
router.post("/", validate(uploadSchema), controller.upload);

export default router;