import { Router } from "express";
import { validate } from "../middleware/validate.js";
import {
  createDesignSchema,
  updateDesignSchema,
} from "../validators/design-validators.js";
import * as controller from "./controller.js";

const router = Router();

router.get("/", controller.getAll);
router.post("/", validate(createDesignSchema), controller.create);
router.get("/:id", controller.getById);
router.patch("/:id", validate(updateDesignSchema), controller.update);
router.delete("/:id", controller.remove);

export default router;
