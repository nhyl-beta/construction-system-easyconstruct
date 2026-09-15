// server/src/issues/controller.ts — NEW
import { NextFunction, Response } from "express";
import { HTTP } from "../constants/http-status.js";
import { MSG } from "../constants/messages.js";
import { formatSuccess } from "../utils/response.js";
import * as service from "./service.js";
import type { AuthedRequest } from "../middleware/auth.js";
import type { IssueFilters } from "./types.js";

export const getAll = async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const filters: IssueFilters = {
      projectCode: req.query.projectCode as string,
      status: req.query.status as string,
      reportedByUserId:
        req.authUser?.role === "site_personnel" ? req.authUser.id : undefined,
    };
    const data = await service.getAll(filters);
    res.json(formatSuccess(data, MSG.issues.retrieved));
  } catch (err) {
    next(err);
  }
};

export const getById = async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const data = await service.getById(Number(req.params.id));
    res.json(formatSuccess(data, MSG.issues.single));
  } catch (err) {
    next(err);
  }
};

export const create = async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const data = await service.create({
      ...req.body,
      reportedByUserId: req.authUser!.id,
      reportedByName: req.body.reportedByName ?? req.authUser!.email,
      reportedByRole: req.authUser!.role,
    });
    res.status(HTTP.CREATED).json(formatSuccess(data, MSG.issues.created));
  } catch (err) {
    next(err);
  }
};

export const updateStatus = async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const data = await service.updateStatus(
      Number(req.params.id),
      req.body.status,
      req.body.resolutionNotes,
      req.authUser!.role,
    );
    res.json(formatSuccess(data, MSG.issues.updated));
  } catch (err) {
    next(err);
  }
};