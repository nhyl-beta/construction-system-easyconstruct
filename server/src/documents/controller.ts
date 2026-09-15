// server/src/documents/controller.ts — NEW
import { NextFunction, Response } from "express";
import { HTTP } from "../constants/http-status.js";
import { MSG } from "../constants/messages.js";
import { formatSuccess } from "../utils/response.js";
import * as service from "./service.js";
import type { AuthedRequest } from "../middleware/auth.js";

export const getAll = async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const data = await service.getAll({
      project: req.query.project as string,
      type: req.query.type as string,
    });
    res.json(formatSuccess(data, MSG.documents.retrieved));
  } catch (err) {
    next(err);
  }
};

export const create = async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const data = await service.create({
      ...req.body,
      uploadedBy: req.body.uploadedBy ?? req.authUser!.email,
    });
    res.status(HTTP.CREATED).json(formatSuccess(data, MSG.documents.created));
  } catch (err) {
    next(err);
  }
};