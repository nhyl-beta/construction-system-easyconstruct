import { NextFunction, Request, Response } from "express";
import { HTTP } from "../constants/http-status.js";
import { MSG } from "../constants/messages.js";
import { formatSuccess } from "../utils/response.js";
import { logAudit } from "../utils/audit.js";
import type { AuthedRequest } from "../middleware/auth.js";
import * as service from "./service.js";
import * as employeeService from "../employees/service.js";
import type { AttendanceFilters } from "./types.js";
import * as sheetImport from "./import.js";
import { ValidationError } from "../utils/errors.js";

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters: AttendanceFilters = {
      employeeId: req.query.employeeId as string,
      projectCode: req.query.projectCode as string,
      status: req.query.status as string,
      dateFrom: req.query.dateFrom as string,
      dateTo: req.query.dateTo as string,
      search: req.query.search as string,
      verification: req.query.verification as string,
    };
    // Server-side pagination is opt-in (page/pageSize), same convention as
    // GET /projects; every other caller still gets the whole list.
    if (req.query.page !== undefined || req.query.pageSize !== undefined) {
      const { items, meta } = await service.getPage(filters, {
        page: Number(req.query.page) || 1,
        pageSize: Number(req.query.pageSize) || undefined,
      });
      res.json({ ...formatSuccess(items, MSG.attendance.retrieved), meta });
      return;
    }
    const data = await service.getAll(filters);
    res.json(formatSuccess(data, MSG.attendance.retrieved));
  } catch (err) {
    next(err);
  }
};

export const heatmap = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(formatSuccess(await service.getHeatmap(), "Attendance heatmap retrieved"));
  } catch (err) {
    next(err);
  }
};

export const bulkVerify = async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const verified = await service.bulkVerify({
      employeeId: req.body?.employeeId,
      projectCode: req.body?.projectCode,
      status: req.body?.status,
      dateFrom: req.body?.dateFrom,
      dateTo: req.body?.dateTo,
      search: req.body?.search,
    });
    await logAudit({
      entityType: "attendance",
      entityId: "bulk",
      action: "verified",
      actor: req.authUser?.name ?? "unknown",
      summary: `Bulk-verified ${verified} pending clock-in${verified === 1 ? "" : "s"}`,
    });
    res.json(formatSuccess({ verified }, `${verified} clock-in(s) verified`));
  } catch (err) {
    next(err);
  }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await service.getById(Number(req.params.id));
    res.json(formatSuccess(data, MSG.attendance.single));
  } catch (err) {
    next(err);
  }
};

export const create = async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const data = await service.create(
      req.body,
      req.authUser ? { role: req.authUser.role, userId: req.authUser.id } : undefined,
    );
    res.status(HTTP.CREATED).json(formatSuccess(data, MSG.attendance.created));
  } catch (err) {
    next(err);
  }
};

export const update = async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const existing = await service.getById(id);

    // Site Personnel reach this route to clock out; the check confines them
    // to their own open record and to the clockOut field.
    const actorEmployee =
      req.authUser?.role === "site-personnel"
        ? await employeeService.getMyEmployeeRecord(
            req.authUser.id,
            req.authUser.email,
          )
        : null;

    await service.assertCanUpdateAttendance(existing, req.body, {
      role: req.authUser?.role ?? "",
      employeeId: actorEmployee?.employeeId ?? null,
    });

    const data = await service.update(id, req.body);
    await logAudit({
      entityType: "attendance",
      entityId: String(req.params.id),
      action: "updated",
      actor: req.authUser?.name ?? "unknown",
      summary: `Updated attendance record for ${data.employeeId} (${data.logDate})`,
      projectCode: data.projectCode ?? undefined,
    });
    res.json(formatSuccess(data, MSG.attendance.updated));
  } catch (err) {
    next(err);
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await service.remove(Number(req.params.id));
    res.json(formatSuccess(data, MSG.attendance.deleted));
  } catch (err) {
    next(err);
  }
};

// ── Spreadsheet import (attendance/import.ts) ───────────────────────────

const sheetInput = (req: AuthedRequest) => {
  if (!req.file) throw new ValidationError("Choose an Excel (.xlsx) file to upload.");
  const projectCode = String(req.body.projectCode ?? "").trim();
  return {
    buffer: req.file.buffer,
    fileName: req.file.originalname,
    projectCode,
    actor: { role: req.authUser!.role, userId: req.authUser!.id, name: req.authUser!.name },
  };
};

export const importPreview = async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const { buffer, fileName, projectCode, actor } = sheetInput(req);
    const report = await sheetImport.previewSheet(buffer, fileName, projectCode, actor);
    res.json(formatSuccess(report, "Attendance sheet checked"));
  } catch (err) {
    next(err);
  }
};

export const importCommit = async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const { buffer, fileName, projectCode, actor } = sheetInput(req);
    const result = await sheetImport.commitSheet(buffer, fileName, projectCode, actor);
    res.status(HTTP.CREATED).json(formatSuccess(result, `Imported ${result.imported} attendance record(s)`));
  } catch (err) {
    next(err);
  }
};

export const importTemplate = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const buffer = await sheetImport.buildTemplate();
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", 'attachment; filename="attendance-template.xlsx"');
    res.send(buffer);
  } catch (err) {
    next(err);
  }
};
