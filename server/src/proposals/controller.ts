import { Request, Response } from "express";
import type { AuthedRequest } from "../middleware/auth.js";
import { logAudit } from "../utils/audit.js";

import {
  proposalService,
} from "./service.js";

export const proposalController = {
  async getAll(
    _req: Request,
    res: Response,
  ) {
    const data =
      await proposalService.getAll();

    return res.json({
      success: true,
      data,
    });
  },

  async getById(
    req: Request,
    res: Response,
  ) {
    const id = Number(req.params.id);

    const data =
      await proposalService.getById(id);

    return res.json({
      success: true,
      data,
    });
  },

  async create(
    req: AuthedRequest,
    res: Response,
  ) {
    const data =
      await proposalService.create(
        req.body,
      );

    await logAudit({
      entityType: "proposal",
      entityId: String(data.id),
      action: "created",
      actor: req.authUser?.name ?? data.submittedBy ?? "unknown",
      summary: `Submitted proposal "${data.title}" for project ${data.projectCode}`,
    });

    return res.status(201).json({
      success: true,
      data,
    });
  },

  async update(
    req: Request,
    res: Response,
  ) {
    const id = Number(req.params.id);

    const data =
      await proposalService.update(
        id,
        req.body,
      );

    return res.json({
      success: true,
      data,
    });
  },

  async review(
    req: AuthedRequest,
    res: Response,
  ) {
    const id = Number(req.params.id);

    const data =
      await proposalService.review(
        id,
        req.body,
      );

    await logAudit({
      entityType: "proposal",
      entityId: String(id),
      action: data.status === "Approved" ? "approved" : data.status === "Rejected" ? "rejected" : "revision-requested",
      actor: req.authUser?.name ?? req.body.reviewerName ?? "unknown",
      summary: `Reviewed proposal "${data.title}": ${data.status}`,
    });

    return res.json({
      success: true,
      data,
    });
  },

  async remove(
    req: Request,
    res: Response,
  ) {
    const id = Number(req.params.id);

    const data =
      await proposalService.remove(id);

    return res.json({
      success: true,
      data,
    });
  },
};