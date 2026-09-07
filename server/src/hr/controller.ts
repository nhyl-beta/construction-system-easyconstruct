import type { NextFunction, Request, Response } from "express";
import { HTTP } from "../constants/http-status.js";
import { formatSuccess } from "../utils/response.js";
import { ValidationError } from "../utils/errors.js";
import * as service from "./service.js";
import {
  attendanceQuerySchema,
  payrollQuerySchema,
  workforceQuerySchema,
} from "./validators.js";

function parseQuery<T>(schema: { safeParse: (value: unknown) => { success: true; data: T } | { success: false; error: { issues: Array<{ message: string }> } } }, value: unknown) {
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues.map((issue) => issue.message).join(", "));
  }
  return parsed.data;
}

function parseId(value: string) {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) throw new ValidationError("ID must be a positive integer");
  return id;
}

export const listEmployees = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await service.listEmployees({
      search: req.query.search as string,
      department: req.query.department as string,
      status: req.query.status as string,
    });
    res.json(formatSuccess(data, "Employees retrieved"));
  } catch (error) { next(error); }
};

export const getEmployee = async (req: Request, res: Response, next: NextFunction) => {
  try { res.json(formatSuccess(await service.getEmployee(parseId(req.params.id)), "Employee retrieved")); }
  catch (error) { next(error); }
};

export const createEmployee = async (req: Request, res: Response, next: NextFunction) => {
  try { res.status(HTTP.CREATED).json(formatSuccess(await service.createEmployee(req.body), "Employee created")); }
  catch (error) { next(error); }
};

export const updateEmployee = async (req: Request, res: Response, next: NextFunction) => {
  try { res.json(formatSuccess(await service.updateEmployee(parseId(req.params.id), req.body), "Employee updated")); }
  catch (error) { next(error); }
};

export const deleteEmployee = async (req: Request, res: Response, next: NextFunction) => {
  try { res.json(formatSuccess(await service.removeEmployee(parseId(req.params.id)), "Employee deleted")); }
  catch (error) { next(error); }
};

export const listAttendance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(formatSuccess(
      await service.listAttendance(parseQuery(attendanceQuerySchema, req.query)),
      "Attendance retrieved",
    ));
  }
  catch (error) { next(error); }
};

export const attendanceSummary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const date = parseQuery(attendanceQuerySchema, { date: req.query.date }).date
      ?? new Date().toISOString().slice(0, 10);
    res.json(formatSuccess(await service.attendanceSummary(date), "Attendance summary retrieved"));
  } catch (error) { next(error); }
};

export const createAttendance = async (req: Request, res: Response, next: NextFunction) => {
  try { res.status(HTTP.CREATED).json(formatSuccess(await service.createAttendance(req.body), "Attendance recorded")); }
  catch (error) { next(error); }
};

export const updateAttendance = async (req: Request, res: Response, next: NextFunction) => {
  try { res.json(formatSuccess(await service.updateAttendance(parseId(req.params.id), req.body), "Attendance updated")); }
  catch (error) { next(error); }
};

export const deleteAttendance = async (req: Request, res: Response, next: NextFunction) => {
  try { res.json(formatSuccess(await service.removeAttendance(parseId(req.params.id)), "Attendance deleted")); }
  catch (error) { next(error); }
};

export const generatePayroll = async (req: Request, res: Response, next: NextFunction) => {
  try { res.status(HTTP.CREATED).json(formatSuccess(await service.generatePayroll(req.body), "Payroll generated")); }
  catch (error) { next(error); }
};

export const listPayroll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = parseQuery(payrollQuerySchema, req.query);
    res.json(formatSuccess(await service.getPayroll(query), "Payroll retrieved"));
  } catch (error) { next(error); }
};

export const tracksheet = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = parseQuery(payrollQuerySchema, req.query);
    res.json(formatSuccess(await service.getTracksheet(query), "Tracksheet retrieved"));
  } catch (error) { next(error); }
};

export const grossLabor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = parseQuery(payrollQuerySchema, req.query);
    res.json(formatSuccess(await service.getGrossLabor(query), "Gross labor retrieved"));
  } catch (error) { next(error); }
};

export const grossTracking = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = parseQuery(payrollQuerySchema, req.query);
    res.json(formatSuccess(await service.getGrossTracking(query), "Gross tracking retrieved"));
  } catch (error) { next(error); }
};

export const workforceReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = parseQuery(workforceQuerySchema, req.query);
    res.json(formatSuccess(
      await service.workforceReport(query.from, query.to),
      "Workforce report retrieved",
    ));
  } catch (error) { next(error); }
};
