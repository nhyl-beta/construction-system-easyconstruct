import { NextFunction, Request, Response } from "express";
import { MSG } from "../constants/messages.js";
import { formatSuccess } from "../utils/response.js";
import * as service from "./service.js";

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await service.getAll({
      entityType: req.query.entityType as string,
      entityId: req.query.entityId as string,
    });
    res.json(formatSuccess(data, MSG.auditLogs.retrieved));
  } catch (err) { next(err); }
};