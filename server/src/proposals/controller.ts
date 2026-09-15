import { Request, Response } from "express";

import {
  proposalService,
} from "./service.js";

export const proposalController = {
  async getAll(
    _req: Request,
    res: Response,
  ) {
    const data =
      await proposalService.getAll();

    return res.json({
      success: true,
      data,
    });
  },

  async getById(
    req: Request,
    res: Response,
  ) {
    const id = Number(req.params.id);

    const data =
      await proposalService.getById(id);

    return res.json({
      success: true,
      data,
    });
  },

  async create(
    req: Request,
    res: Response,
  ) {
    const data =
      await proposalService.create(
        req.body,
      );

    return res.status(201).json({
      success: true,
      data,
    });
  },

  async update(
    req: Request,
    res: Response,
  ) {
    const id = Number(req.params.id);

    const data =
      await proposalService.update(
        id,
        req.body,
      );

    return res.json({
      success: true,
      data,
    });
  },

  async review(
    req: Request,
    res: Response,
  ) {
    const id = Number(req.params.id);

    const data =
      await proposalService.review(
        id,
        req.body,
      );

    return res.json({
      success: true,
      data,
    });
  },

  async remove(
    req: Request,
    res: Response,
  ) {
    const id = Number(req.params.id);

    const data =
      await proposalService.remove(id);

    return res.json({
      success: true,
      data,
    });
  },
};