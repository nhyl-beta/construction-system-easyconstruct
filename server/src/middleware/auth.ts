// server/src/middleware/auth.ts

import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { env } from "../config/env.js";
import { UnauthorizedError, ForbiddenError } from "../utils/errors.js";

export interface AuthedRequest extends Request {
  authUser?: {
    id: number;
    email: string;
    name: string;
    role: string;
  };
}

export function authenticate(
  req: AuthedRequest,
  _res: Response,
  next: NextFunction,
) {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    return next(
      new UnauthorizedError(
        "Missing or malformed Authorization header",
      ),
    );
  }

  try {
    const token = header.slice(7);

    const verified = jwt.verify(token, env.JWT_SECRET);

    if (typeof verified === "string") {
      return next(
        new UnauthorizedError("Invalid token payload"),
      );
    }

    // Validate the fields expected from our JWT. `name` is read
    // defensively (not required) so tokens issued before it was added to
    // the payload don't suddenly fail auth — see auth/service.ts.
    // `sub` is accepted as either a string or a number: auth/service.ts
    // signs it as `user.id` (a number), so requiring `string` here
    // rejected every token the app itself issues.
    if (
      (typeof verified.sub !== "string" && typeof verified.sub !== "number") ||
      typeof verified.email !== "string" ||
      typeof verified.role !== "string"
    ) {
      return next(
        new UnauthorizedError("Invalid token payload"),
      );
    }

    const userId = Number(verified.sub);

    if (!Number.isInteger(userId)) {
      return next(
        new UnauthorizedError("Invalid user ID in token"),
      );
    }

    req.authUser = {
      id: userId,
      email: verified.email,
      name: typeof verified.name === "string" ? verified.name : verified.email,
      role: verified.role,
    };

    next();
  } catch {
    next(
      new UnauthorizedError("Invalid or expired token"),
    );
  }
}

export function requireRole(...roles: string[]) {
  return (
    req: AuthedRequest,
    _res: Response,
    next: NextFunction,
  ) => {
    if (!req.authUser) {
      return next(new UnauthorizedError());
    }

    if (!roles.includes(req.authUser.role)) {
      return next(
        new ForbiddenError(
          `Role '${req.authUser.role}' cannot access this resource`,
        ),
      );
    }

    next();
  };
}