// server/src/tasks/controller.ts — NEW
import { NextFunction, Response } from "express";
import { HTTP } from "../constants/http-status.js";
import { MSG } from "../constants/messages.js";
import { formatSuccess } from "../utils/response.js";
import { logAudit } from "../utils/audit.js";
import * as service from "./service.js";
import type { AuthedRequest } from "../middleware/auth.js";
import type { TaskFilters } from "./types.js";
import { assertProjectVisible, scopeRowsToVisible, scopedProjectCodes } from "../projects/service.js";
import { parsePageRequest, sendPaged } from "../utils/pagination.js";
import { TASK_SORT_COLUMNS } from "./repository.js";

export const getAll = async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const filters: TaskFilters = {
      projectCode: req.query.projectCode as string,
      status: req.query.status as string,
      // Site Personnel implicitly scoped to their own tasks unless another
      // role is asking; the RBAC middleware already restricts route access.
      // (role string fixed to match the hyphenated convention used by
      // requireRole()/JWT everywhere else — was "site_personnel", never matched.)
      assignedToUserId:
        req.authUser?.role === "site-personnel"
          ? req.authUser.id
          : req.query.assignedToUserId
          ? Number(req.query.assignedToUserId)
          : undefined,
    };
    // Site personnel keep their stricter own-tasks filter (above); everyone else sees staffed/own projects only.
    const paging = parsePageRequest(req.query, { sortable: Object.keys(TASK_SORT_COLUMNS) });
    if (paging.requested) {
      // Visibility is a project-code filter inside the query, so the page and
      // its total only ever count rows the caller may see.
      const codes = await scopedProjectCodes(req.authUser, { skipRoles: ["site-personnel"] });
      const { items, meta } = await service.getPage({ ...filters, ...(codes ? { codes } : {}) }, paging);
      sendPaged(res, items, MSG.tasks.retrieved, meta);
      return;
    }
    const data = await scopeRowsToVisible(req.authUser, await service.getAll(filters), (t) => t.projectCode, { skipRoles: ["site-personnel"] });
    res.json(formatSuccess(data, MSG.tasks.retrieved));
  } catch (err) {
    next(err);
  }
};

export const getById = async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const data = await service.getById(Number(req.params.id));
    await assertProjectVisible(req.authUser, data.projectCode, "tasks");
    res.json(formatSuccess(data, MSG.tasks.single));
  } catch (err) {
    next(err);
  }
};

export const create = async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const data = await service.create(req.body);
    await logAudit({
      entityType: "task",
      entityId: String(data.id),
      action: "created",
      actor: req.authUser?.name ?? "unknown",
      summary: `Created task "${data.title}" for project ${data.projectCode}`,
      projectCode: data.projectCode,
    });
    res.status(HTTP.CREATED).json(formatSuccess(data, MSG.tasks.created));
  } catch (err) {
    next(err);
  }
};

export const updateStatus = async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const data = await service.updateStatus(
      Number(req.params.id),
      req.body.status,
      req.authUser!.id,
      {
        completionNote: req.body.completionNote,
        completionFileUrl: req.body.completionFileUrl,
      },
    );
    await logAudit({
      entityType: "task",
      entityId: String(req.params.id),
      action: "updated",
      actor: req.authUser?.name ?? "unknown",
      summary: `Task "${data.title}" status changed to ${req.body.status}`,
      projectCode: data.projectCode,
    });
    res.json(formatSuccess(data, MSG.tasks.updated));
  } catch (err) {
    next(err);
  }
};

export const update = async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const data = await service.update(Number(req.params.id), req.body);
    res.json(formatSuccess(data, MSG.tasks.updated));
  } catch (err) {
    next(err);
  }
};

export const remove = async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const data = await service.remove(Number(req.params.id));
    res.json(formatSuccess(data, MSG.tasks.deleted));
  } catch (err) {
    next(err);
  }
};