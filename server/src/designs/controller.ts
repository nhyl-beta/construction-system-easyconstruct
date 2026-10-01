import { NextFunction, Request, Response } from "express";
import { HTTP } from "../constants/http-status.js";
import { MSG }  from "../constants/messages.js";
import { formatSuccess } from "../utils/response.js";
import * as service from "./service.js";
import type { DesignFilters } from "./types.js";
import type { AuthedRequest } from "../middleware/auth.js";
import { assertAssignedToProject, scopeRowsToAssigned } from "../projects/scope.js";

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  const auth = (req as AuthedRequest).authUser;
  try {
    const filters: DesignFilters = {
      status: req.query.status as string,
      discipline: req.query.discipline as string,
      projectCode: req.query.projectCode as string,
      search: req.query.search as string,
    };
    const data = await scopeRowsToAssigned(auth, await service.getAll(filters), (d) => d.projectCode);
    res.json(formatSuccess(data, MSG.designs.retrieved));
  } catch (err) { next(err); }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await service.getById(Number(req.params.id));
    await assertAssignedToProject((req as AuthedRequest).authUser, data.projectCode, "designs");
    res.json(formatSuccess(data, MSG.designs.single));
  } catch (err) { next(err); }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await assertAssignedToProject((req as AuthedRequest).authUser, req.body.projectCode, "designs");
    const data = await service.create(req.body);
    res.status(HTTP.CREATED).json(formatSuccess(data, MSG.designs.created));
  } catch (err) { next(err); }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth = (req as AuthedRequest).authUser;
    const existing = await service.getById(Number(req.params.id));
    await assertAssignedToProject(auth, existing.projectCode, "designs");
    if (req.body.projectCode) await assertAssignedToProject(auth, req.body.projectCode, "designs");
    const data = await service.update(Number(req.params.id), req.body);
    res.json(formatSuccess(data, MSG.designs.updated));
  } catch (err) { next(err); }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const existing = await service.getById(Number(req.params.id));
    await assertAssignedToProject((req as AuthedRequest).authUser, existing.projectCode, "designs");
    const data = await service.remove(Number(req.params.id));
    res.json(formatSuccess(data, MSG.designs.deleted));
  } catch (err) { next(err); }
};