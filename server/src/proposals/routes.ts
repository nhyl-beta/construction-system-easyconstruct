import { Router } from "express";
import { validate } from "../middleware/validate.js";
import {
  createProposalSchema,
  updateProposalSchema,
} from "../validators/proposal-validators.js";
import * as controller from "./controller.js";

const router = Router();

router.get("/", controller.getAll);
router.post("/", validate(createProposalSchema), controller.create);
router.get("/:id", controller.getById);
router.patch("/:id", validate(updateProposalSchema), controller.update);
router.delete("/:id", controller.remove);

export default router;
