// server/src/uploads/routes.ts — NEW
import { Router } from "express";
import * as controller from "./controller.js";
import { validate } from "../middleware/validate.js";
import { authenticate } from "../middleware/auth.js";
import { uploadSchema } from "../validators/upload-validators.js";
import { streamUpload } from "./stream.js";
import { formatLimit, maxUploadBytes } from "./limits.js";
import { ValidationError } from "../utils/errors.js";

const router = Router();

router.use(authenticate);
router.get("/file", controller.download);
router.get("/config", controller.config);
// Large files: multipart streamed to disk (no Blob store), or a Blob client token.
router.post(
  "/stream",
  (req, res, next) =>
    streamUpload()(req, res, (err: unknown) => {
      if (err && (err as { code?: string }).code === "LIMIT_FILE_SIZE") {
        return next(new ValidationError(`File exceeds the ${formatLimit(maxUploadBytes())} upload limit`));
      }
      next(err);
    }),
  controller.uploadStreamed,
);
router.post("/client-token", controller.clientToken);
router.post("/", validate(uploadSchema), controller.upload);

export default router;