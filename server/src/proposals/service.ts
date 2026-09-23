import { NotFoundError, ValidationError } from "../utils/errors.js";
import { db } from "../db/connection.js";
import { projects } from "../db/schema/projects.js";
import { eq } from "drizzle-orm";
import { validateProposal } from "./validation.js";
import { FEATURES } from "../config/features.js";

import {
  proposalRepository,
} from "./repository.js";

export const proposalService = {
  async getAll() {
    return proposalRepository.findAll();
  },

  async getById(id: number) {
    const proposal =
      await proposalRepository.findById(id);

    if (!proposal) {
      throw new NotFoundError(
        "Proposal not found",
      );
    }

    return proposal;
  },

  async create(data: any) {
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.code, data.projectCode));

    // Unknown project codes used to only surface as an "AI issue" buried in
    // aiValidation — with that surface hidden behind the flag, a bad code
    // would otherwise be silently accepted. Reject it directly instead.
    if (!project) {
      throw new ValidationError(
        `Project code "${data.projectCode}" does not match any existing project.`,
      );
    }

    const aiValidation = FEATURES.ai
      ? JSON.stringify(
          validateProposal(
            { title: data.title, content: data.content, amount: data.amount },
            true,
            data.projectCode,
          ),
        )
      : null;

    const proposal = await proposalRepository.create({
      ...data,
      aiValidation,
    });
    if (!proposal) {
      throw new Error("Failed to create proposal");
    }
    return proposal;
  },

  async update(
    id: number,
    data: any,
  ) {
    const proposal =
      await proposalRepository.update(
        id,
        data,
      );

    if (!proposal) {
      throw new NotFoundError(
        "Proposal not found",
      );
    }

    return proposal;
  },

  async review(
    id: number,
    data: {
      status:
        | "Approved"
        | "Revision Requested"
        | "Rejected";

      reviewerName: string;
      reviewComment: string;
    },
  ) {
    const proposal =
      await proposalRepository.review(
        id,
        data,
      );

    if (!proposal) {
      throw new NotFoundError(
        "Proposal not found",
      );
    }

    return proposal;
  },

  async remove(id: number) {
    const proposal =
      await proposalRepository.remove(id);

    if (!proposal) {
      throw new NotFoundError(
        "Proposal not found",
      );
    }

    return proposal;
  },
};