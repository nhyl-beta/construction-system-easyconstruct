import * as repo from "./repository.js";
import type { UserFilters } from "./types.js";

export const getAll = async (filters: UserFilters) => repo.findAll(filters);
