// server/src/middleware/auth.ts

import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { env } from "../config/env.js";
import { UnauthorizedError, ForbiddenError } from "../utils/errors.js";

export interface AuthedRequest extends Request {
  authUser?: {
    id: number;
    email: string;
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

    // jwt.verify() can return either a string or JwtPayload.
    // Reject string payloads because our authentication
    // requires an object containing user information.
    if (typeof verified === "string") {
      return next(
        new UnauthorizedError("Invalid token payload"),
      );
    }

    // Validate the fields expected from our JWT.
    if (
      typeof verified.sub !== "string" ||
      typeof verified.email !== "string" ||
      typeof verified.role !== "string"
    ) {
      return next(
        new UnauthorizedError("Invalid token payload"),
      );
    }

    // JWT "sub" is normally stored as a string.
    // Convert it to the number used by our application.
    const userId = Number(verified.sub);

    if (!Number.isInteger(userId)) {
      return next(
        new UnauthorizedError("Invalid user ID in token"),
      );
    }

    req.authUser = {
      id: userId,
      email: verified.email,
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
    // User must be authenticated first.
    if (!req.authUser) {
      return next(new UnauthorizedError());
    }

    // Check whether the authenticated user's role
    // is included in the roles allowed for this route.
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