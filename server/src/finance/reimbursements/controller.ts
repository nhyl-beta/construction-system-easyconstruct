import { handle, idParam } from "../purchasing/http.js";
import { reimbursementsService as service } from "./service.js";

export const reimbursementsController = {
  list: handle(async (actor, req) => ({
    data: await service.list(actor, typeof req.query.status === "string" ? req.query.status : undefined),
    message: "Reimbursement claims retrieved",
  })),
  mine: handle(async (actor) => ({ data: await service.mine(actor), message: "Your claims retrieved" })),
  get: handle(async (actor, req) => ({ data: await service.detail(actor, idParam(req)) })),
  create: handle(async (actor, req) => ({ data: await service.create(actor, req.body), status: 201, message: "Claim submitted" })),
  endorse: handle(async (actor, req) => ({ data: await service.endorse(actor, idParam(req)), message: "Claim endorsed" })),
  approve: handle(async (actor, req) => ({ data: await service.approve(actor, idParam(req), req.body?.note), message: "Claim approved" })),
  reject: handle(async (actor, req) => ({ data: await service.reject(actor, idParam(req), req.body?.note), message: "Claim rejected" })),
  pay: handle(async (actor, req) => ({ data: await service.pay(actor, idParam(req), req.body.paymentReference), message: "Claim paid" })),
  cancel: handle(async (actor, req) => ({ data: await service.cancel(actor, idParam(req)), message: "Claim cancelled" })),
};
