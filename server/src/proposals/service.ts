import { NotFoundError } from "../utils/errors.js";

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
    return proposalRepository.create(data);
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