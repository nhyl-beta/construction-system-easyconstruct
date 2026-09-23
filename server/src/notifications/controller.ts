import { NextFunction, Request, Response } from "express";
import { HTTP } from "../constants/http-status.js";
import { MSG } from "../constants/messages.js";
import { formatSuccess } from "../utils/response.js";
import { UnauthorizedError } from "../utils/errors.js";
import type { AuthedRequest } from "../middleware/auth.js";
import * as service from "./service.js";

export const getAll = async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.authUser) throw new UnauthorizedError();
    // Always the caller's own inbox — ?role= is ignored on purpose (see
    // notifications/repository.ts findForRecipient).
    const data = await service.getForRecipient(
      { userId: req.authUser.id, role: req.authUser.role },
      { unreadOnly: req.query.unreadOnly === "true" },
    );
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