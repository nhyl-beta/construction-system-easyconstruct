// server/src/tasks/controller.ts — NEW
import { NextFunction, Response } from "express";
import { HTTP } from "../constants/http-status.js";
import { MSG } from "../constants/messages.js";
import { formatSuccess } from "../utils/response.js";
import * as service from "./service.js";
import type { AuthedRequest } from "../middleware/auth.js";
import type { TaskFilters } from "./types.js";

export const getAll = async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const filters: TaskFilters = {
      projectCode: req.query.projectCode as string,
      status: req.query.status as string,
      // Site Personnel implicitly scoped to their own tasks unless another
      // role is asking; the RBAC middleware already restricts route access.
      assignedToUserId:
        req.authUser?.role === "site_personnel"
          ? req.authUser.id
          : req.query.assignedToUserId
          ? Number(req.query.assignedToUserId)
          : undefined,
    };
    const data = await service.getAll(filters);
    res.json(formatSuccess(data, MSG.tasks.retrieved));
  } catch (err) {
    next(err);
  }
};

export const getById = async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const data = await service.getById(Number(req.params.id));
    res.json(formatSuccess(data, MSG.tasks.single));
  } catch (err) {
    next(err);
  }
};

export const create = async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const data = await service.create(req.body);
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
    );
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