import { NextFunction, Response } from "express";
import { HTTP } from "../constants/http-status.js";
import { MSG } from "../constants/messages.js";
import { formatSuccess } from "../utils/response.js";
import type { AuthedRequest } from "../middleware/auth.js";
import * as service from "./service.js";
import type { ProjectFilters } from "./types.js";

const scopeOf = (req: AuthedRequest) =>
  req.authUser
    ? { role: req.authUser.role, userId: req.authUser.id, name: req.authUser.name }
    : undefined;

export const getAll = async (
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const filters: ProjectFilters = {
      status: req.query.status as string,
      risk: req.query.risk as string,
      projectType: req.query.projectType as string,
      deliveryType: req.query.deliveryType as string,
      excludeArchived: req.query.excludeArchived === "1",
      search: req.query.search as string,
    };
    // Consultant is scoped to the projects it advises on, with commercial
    // fields stripped — see projects/service.ts getAll.
    const scope = scopeOf(req);
    // Server-side pagination is opt-in (page/pageSize); every other caller
    // keeps receiving the plain array.
    if (req.query.page !== undefined || req.query.pageSize !== undefined) {
      const { items, meta } = await service.getPage(
        {
          ...filters,
          page: Number(req.query.page) || 1,
          pageSize: Number(req.query.pageSize) || 10,
        },
        scope,
      );
      res.json({ ...formatSuccess(items, MSG.projects.retrieved), meta });
      return;
    }
    const data = await service.getAll(filters, scope);
    res.json(formatSuccess(data, MSG.projects.retrieved));
  } catch (err) {
    next(err);
  }
};

export const getById = async (
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Same membership scope as the list — otherwise a staff member who
    // cannot see a project in the table can still open it by guessing its id.
    const data = await service.getById(Number(req.params.id), scopeOf(req));
    res.json(formatSuccess(data, MSG.projects.single));
  } catch (err) {
    next(err);
  }
};

export const create = async (
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    // A Project Manager cannot assign a different PM on their own project —
    // the creator's own name is authoritative here regardless of what the
    // client sends. Admin/IT Designer retain the ability to assign any PM
    // (e.g. creating a project on behalf of the org).
    const body =
      req.authUser?.role === "project-manager"
        ? { ...req.body, pm: req.authUser.name }
        : req.body;
    const data = await service.create(
      body,
      req.authUser?.role === "project-manager" ? req.authUser.id : undefined,
    );
    res.status(HTTP.CREATED).json(formatSuccess(data, MSG.projects.created));
  } catch (err) {
    next(err);
  }
};

export const update = async (
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = Number(req.params.id);
    const data = await service.update(id, req.body, scopeOf(req));
    res.json(formatSuccess(data, MSG.projects.updated));
  } catch (err) {
    next(err);
  }
};

export const remove = async (
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.remove(Number(req.params.id), scopeOf(req));
    res.json(formatSuccess(data, MSG.projects.deleted));
  } catch (err) {
    next(err);
  }
};
