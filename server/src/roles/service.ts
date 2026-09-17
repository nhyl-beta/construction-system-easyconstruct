import * as repo         from "./repository.js";
import { NotFoundError } from "../utils/errors.js";

export const getAll = async () => {
  return await repo.findAll();
};

export const getById = async (id: number) => {
  const role = await repo.findById(id);
  if (!role) throw new NotFoundError("Role", String(id));
  return role;
};
