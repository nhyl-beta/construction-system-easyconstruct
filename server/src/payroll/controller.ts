import { NextFunction, Request, Response } from "express";
import { HTTP } from "../constants/http-status.js";
import { MSG } from "../constants/messages.js";
import { formatSuccess } from "../utils/response.js";
import * as service from "./service.js";
import type { PayrollFilters } from "./types.js";

// ── Tracksheet (per-employee lines) ─────────────────────────────────────────

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters: PayrollFilters = {
      period: req.query.period as string,
      status: req.query.status as string,
      empId: req.query.empId as string,
    };
    const data = await service.getAll(filters);
    res.json(formatSuccess(data, MSG.payroll.retrieved));
  } catch (err) {
    next(err);
  }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await service.getById(Number(req.params.id));
    res.json(formatSuccess(data, MSG.payroll.single));
  } catch (err) {
    next(err);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await service.update(Number(req.params.id), req.body);
    res.json(formatSuccess(data, MSG.payroll.updated));
  } catch (err) {
    next(err);
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await service.remove(Number(req.params.id));
    res.json(formatSuccess(data, MSG.payroll.deleted));
  } catch (err) {
    next(err);
  }
};

// ── Generate (Tracksheet → Gross Labor → Gross Tracking) ────────────────────

export const generate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await service.generate(req.body);
    res
      .status(HTTP.CREATED)
      .json(formatSuccess(data, "Payroll generated"));
  } catch (err) {
    next(err);
  }
};

// ── Gross Tracking (batch rollups) ──────────────────────────────────────────

export const listBatches = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await service.listBatches();
    res.json(formatSuccess(data, MSG.payrollBatches.retrieved));
  } catch (err) {
    next(err);
  }
};
