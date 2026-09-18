import { NextFunction, Response } from "express";
import { unlink } from "node:fs/promises";

import { HTTP } from "../constants/http-status.js";
import { MSG } from "../constants/messages.js";
import { formatSuccess } from "../utils/response.js";

import * as service from "./service.js";

import type { AuthedRequest } from "../middleware/auth.js";

export const getAll = async (
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const projectCodes =
      req.authUser?.role === "project-manager"
        ? await service.findProjectCodesForPm(req.authUser.name)
        : undefined;

    const data = await service.getAll({
      project: req.query.project as string,
      type: req.query.type as string,
      projectCodes,
    });

    return res.json(
      formatSuccess(
        data,
        MSG.documents.retrieved,
      ),
    );
  } catch (err) {
    return next(err);
  }
};

export const create = async (
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.create({
      ...req.body,
      uploadedBy:
        req.body.uploadedBy ??
        req.authUser!.email,
    });

    return res
      .status(HTTP.CREATED)
      .json(
        formatSuccess(
          data,
          MSG.documents.created,
        ),
      );
  } catch (err) {
    return next(err);
  }
};

export const upload = async (
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please select a file to upload.",
        code: "FILE_REQUIRED",
      });
    }

    const project = String(
      req.body.project ?? "",
    ).trim();

    const type = String(
      req.body.type ?? "",
    ).trim();

    const version = String(
      req.body.version ?? "v1",
    ).trim() || "v1";

    const title =
      String(
        req.body.title ?? "",
      ).trim() ||
      req.file.originalname;

    if (!project) {
      await unlink(req.file.path).catch(() => undefined);
      return res.status(400).json({
        success: false,
        message: "Project is required.",
        code: "PROJECT_REQUIRED",
      });
    }

    if (!type) {
      await unlink(req.file.path).catch(() => undefined);
      return res.status(400).json({
        success: false,
        message: "Document type is required.",
        code: "TYPE_REQUIRED",
      });
    }

    const data = await service.upload({
      file: req.file,
      title,
      project,
      type,
      version,
      uploadedBy: req.authUser!.email,
    });

    return res
      .status(HTTP.CREATED)
      .json(
        formatSuccess(
          data,
          MSG.documents.created,
        ),
      );
  } catch (err) {
    return next(err);
  }
};