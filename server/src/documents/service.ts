// server/src/documents/service.ts — NEW
import * as repo from "./repository.js";
import type { CreateDocumentInput, DocumentFilters } from "./types.js";

export const getAll = async (filters: DocumentFilters) => repo.findAll(filters);
export const create = async (input: CreateDocumentInput) => repo.create(input);