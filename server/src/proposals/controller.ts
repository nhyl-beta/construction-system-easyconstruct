import { Request, Response } from "express";
import type { AuthedRequest } from "../middleware/auth.js";
import { logAudit } from "../utils/audit.js";
import { assertAssignedToProject, assignedCodesFor, isAssignedScoped, scopeRowsToAssigned } from "../projects/scope.js";
import { parsePageRequest } from "../utils/pagination.js";
import { PROPOSAL_SORT_COLUMNS } from "./repository.js";

import {
  proposalService,
} from "./service.js";

export const proposalController = {
  async getAll(
    req: Request,
    res: Response,
  ) {
    const paging = parsePageRequest(req.query, { sortable: Object.keys(PROPOSAL_SORT_COLUMNS) });
    if (paging.requested) {
      const auth = (req as AuthedRequest).authUser;
      const text = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : undefined);
      const { items, meta } = await proposalService.getPage(
        {
          ...(isAssignedScoped(auth) ? { codes: [...(await assignedCodesFor(auth))] } : {}),
          projectCode: text(req.query.projectCode),
          status: text(req.query.status),
          search: text(req.query.search),
        },
        paging,
      );
      return res.json({ success: true, data: items, meta });
    }

    const data = await scopeRowsToAssigned(
      (req as AuthedRequest).authUser,
      await proposalService.getAll(),
      (p) => p.projectCode,
    );

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
    await assertAssignedToProject((req as AuthedRequest).authUser, data.projectCode, "proposals");

    return res.json({
      success: true,
      data,
    });
  },

  async files(
    req: Request,
    res: Response,
  ) {
    const { proposal, files } = await proposalService.getFiles(Number(req.params.id));
    await assertAssignedToProject((req as AuthedRequest).authUser, proposal.projectCode, "proposals");

    return res.json({
      success: true,
      data: files,
    });
  },

  async validate(
    req: Request,
    res: Response,
  ) {
    const data = await proposalService.validate(Number(req.params.id));

    return res.json({
      success: true,
      data,
    });
  },

  async create(
    req: AuthedRequest,
    res: Response,
  ) {
    await assertAssignedToProject(req.authUser, req.body.projectCode, "proposals");
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
      projectCode: data.projectCode,
    });

    return res.status(201).json({
      success: true,
      data,
    });
  },

  async submit(
    req: AuthedRequest,
    res: Response,
  ) {
    await assertAssignedToProject(req.authUser, req.body.projectCode, "proposals");
    const data = await proposalService.submit(
      req.body,
      req.authUser?.name ?? req.body.submittedBy ?? "unknown",
      req.authUser?.role ?? "",
      req.authUser?.id,
    );

    await logAudit({
      entityType: "proposal",
      entityId: String(data.proposal.id),
      action: "created",
      actor: req.authUser?.name ?? data.proposal.submittedBy ?? "unknown",
      summary: `Submitted proposal "${data.proposal.title}" for project ${data.proposal.projectCode} — workflow ${data.workflow.code} started`,
      projectCode: data.proposal.projectCode,
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
    const auth = (req as AuthedRequest).authUser;
    await assertAssignedToProject(auth, (await proposalService.getById(id)).projectCode, "proposals");
    if (req.body.projectCode) await assertAssignedToProject(auth, req.body.projectCode, "proposals");

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
        req.authUser?.role ?? "",
      );

    await logAudit({
      entityType: "proposal",
      entityId: String(id),
      action: data.status === "Approved" ? "approved" : data.status === "Rejected" ? "rejected" : "revision-requested",
      actor: req.authUser?.name ?? req.body.reviewerName ?? "unknown",
      summary: `Reviewed proposal "${data.title}": ${data.status}`,
      projectCode: data.projectCode,
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
    await assertAssignedToProject(
      (req as AuthedRequest).authUser,
      (await proposalService.getById(id)).projectCode,
      "proposals",
    );

    const data =
      await proposalService.remove(id);

    return res.json({
      success: true,
      data,
    });
  },
};