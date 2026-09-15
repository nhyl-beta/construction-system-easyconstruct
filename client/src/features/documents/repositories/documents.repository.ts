// client/src/features/documents/repositories/documents.repository.ts — NEW
import { apiClient } from "@/services/api.client";

export interface DocumentRecord {
  id: number;
  documentId: string;
  title: string;
  project: string;
  type: string;
  version: string;
  fileUrl: string | null;
  createdAt: string | null;
}

export interface CreateDocumentInput {
  documentId: string;
  title: string;
  project: string;
  type: string;
  fileUrl?: string;
}

export const documentsRepository = {
  listByProject: (project?: string): Promise<{ data: DocumentRecord[] }> =>
    apiClient.get(project ? `/documents?project=${encodeURIComponent(project)}` : "/documents"),
  upload: (input: CreateDocumentInput): Promise<{ data: DocumentRecord }> =>
    apiClient.post("/documents", input),
};