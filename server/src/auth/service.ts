import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import * as repo from "./repository.js";
import { UnauthorizedError } from "../utils/errors.js";
import type { LoginInput } from "./types.js";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-me";
const JWT_EXPIRES_IN = "8h";

export const login = async (input: LoginInput) => {
  const user = await repo.findByEmail(input.email);
  if (!user) throw new UnauthorizedError("Invalid email or password");

  const valid = await bcrypt.compare(input.password, user.password);
  if (!valid) throw new UnauthorizedError("Invalid email or password");

  const token = jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN },
  );

  return {
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  };
};