import { NextFunction, Request, Response } from "express";
import { HTTP } from "../constants/http-status.js";
import { MSG } from "../constants/messages.js";
import { formatSuccess } from "../utils/response.js";
import * as service from "./service.js";

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await service.getAll({
      recipientRole: req.query.role as string,
      unreadOnly: req.query.unreadOnly === "true",
    });
    res.json(formatSuccess(data, MSG.notifications.retrieved));
  } catch (err) { next(err); }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await service.create(req.body);
    res.status(HTTP.CREATED).json(formatSuccess(data, MSG.notifications.created));
  } catch (err) { next(err); }
};

export const markRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await service.markRead(Number(req.params.id));
    res.json(formatSuccess(data, MSG.notifications.updated));
  } catch (err) { next(err); }
};