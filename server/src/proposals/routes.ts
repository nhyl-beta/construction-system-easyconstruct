import { Router } from "express";

import { proposalController } from "./controller.js";

import {
  createProposalSchema,
  updateProposalSchema,
  reviewProposalSchema,
} from "../validators/proposal-validators.js";

import { validate } from "../middleware/validate.js";
import { authenticate, requireRole } from "../middleware/auth.js";

const router = Router();

router.use(authenticate);

// Reading the register is open to every authenticated role — Owner and IT
// Designer oversee it, Architect authors into it, Consultant decides on it.
// Writing was open too: every route below was authenticated only, so any
// signed-in account could create, edit, decide on or delete a proposal.
// Authoring belongs to Architect and deciding to Consultant; admin is kept
// on both as the break-glass role. IT Designer is deliberately absent — its
// screen is read-only oversight (pages/roles/it-designer/it-designer-proposals).
const canAuthor = requireRole("architect", "admin");
const canReview = requireRole("consultant", "admin");

router.get(
  "/",
  proposalController.getAll,
);

router.post(
  "/",
  canAuthor,
  validate(createProposalSchema),
  proposalController.create,
);

router.get(
  "/:id",
  proposalController.getById,
);

router.patch(
  "/:id",
  canAuthor,
  validate(updateProposalSchema),
  proposalController.update,
);

router.patch(
  "/:id/review",
  canReview,
  validate(reviewProposalSchema),
  proposalController.review,
);

router.delete(
  "/:id",
  canAuthor,
  proposalController.remove,
);

export default router;