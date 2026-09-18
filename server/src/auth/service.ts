import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import * as repo from "./repository.js";
import { UnauthorizedError } from "../utils/errors.js";
import { env } from "../config/env.js";
import type { LoginInput } from "./types.js";

const JWT_EXPIRES_IN = "8h";

export const login = async (input: LoginInput) => {
  const user = await repo.findByEmail(input.email);
  if (!user) throw new UnauthorizedError("Invalid email or password");

  const valid = await bcrypt.compare(input.password, user.password);
  if (!valid) throw new UnauthorizedError("Invalid email or password");

  const token = jwt.sign(
    { sub: user.id, email: user.email, name: user.name, role: user.role },
    env.JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN },
  );

  return {
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  };
};