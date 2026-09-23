import * as repo from "./repository.js";
import { assertProjectWritable, refreshProjectProgress } from "../lifecycle/service.js";

import type {
  CreateDocumentInput,
  DocumentFilters,
} from "./types.js";

export const getAll = async (
  filters: DocumentFilters,
) => {
  return repo.findAll(filters);
};

export const findProjectCodesForPm = async (pmName: string) => {
  return repo.findProjectCodesForPm(pmName);
};

export const create = async (
  input: CreateDocumentInput,
) => {
  await assertProjectWritable(input.project);
  const created = await repo.create(input);
  // Several gate checks read document type (P5's Notice of Award/Contract,
  // C5's Notice to Proceed, X2's Certificate of Completion).
  if (created) await refreshProjectProgress(created.project);
  return created;
};

export const upload = async ({
  file,
  title,
  project,
  type,
  version,
  uploadedBy,
}: {
  file: Express.Multer.File;
  title: string;
  project: string;
  type: string;
  version?: string;
  uploadedBy: string;
}) => {
  await assertProjectWritable(project);

  const documentId =
    `ADV-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`.toUpperCase();

  const fileUrl =
    `/uploads/documents/${file.filename}`;

  const sizeInMb =
    file.size / (1024 * 1024);

  const size =
    sizeInMb >= 1
      ? `${sizeInMb.toFixed(2)} MB`
      : `${Math.max(
          1,
          Math.round(file.size / 1024),
        )} KB`;

  const created = await repo.create({
    documentId,
    title,
    project,
    type,
    version: version ?? "v1",
    size,
    uploadedBy,
    fileUrl,
  });
  await refreshProjectProgress(project);
  return created;
};