// server/src/documents/service.ts — NEW
import { unlink } from "node:fs/promises";
import path from "node:path";

import * as repo from "./repository.js";
import type {
  CreateDocumentInput,
  DocumentFilters,
  UploadDocumentInput,
} from "./types.js";

export const getAll = async (filters: DocumentFilters) => repo.findAll(filters);
export const create = async (input: CreateDocumentInput) => repo.create(input);

export const upload = async (input: UploadDocumentInput) => {
  const documentId = `DOC-${Date.now()}`;
  const fileUrl = `/uploads/documents/${path.basename(input.file.filename)}`;

  try {
    return await repo.create({
      documentId,
      title: input.title,
      project: input.project,
      type: input.type,
      version: input.version || "v1",
      size: `${input.file.size} bytes`,
      uploadedBy: input.uploadedBy,
      fileUrl,
    });
  } catch (error) {
    await unlink(input.file.path).catch((cleanupError) => {
      console.error(
        "[Documents] Failed to remove orphaned upload",
        cleanupError,
      );
    });

    throw error;
  }
};