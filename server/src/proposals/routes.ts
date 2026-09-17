import { Router } from "express";

import { proposalController } from "./controller.js";

import {
  createProposalSchema,
  updateProposalSchema,
  reviewProposalSchema,
} from "../validators/proposal-validators.js";

import { validate } from "../middleware/validate.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  proposalController.getAll,
);

router.post(
  "/",
  validate(createProposalSchema),
  proposalController.create,
);

router.get(
  "/:id",
  proposalController.getById,
);

router.patch(
  "/:id",
  validate(updateProposalSchema),
  proposalController.update,
);

router.patch(
  "/:id/review",
  validate(reviewProposalSchema),
  proposalController.review,
);

router.delete(
  "/:id",
  proposalController.remove,
);

export default router;