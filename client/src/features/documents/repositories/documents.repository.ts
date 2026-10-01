import { apiClient } from "@/services/api.client";

export interface DocumentRecord {
  id: number;
  documentId: string;
  title: string;
  project: string;
  type: string;
  version: string;
  size: string | null;
  uploadedBy?: string;
  fileUrl: string | null;
  // H1: which lifecycle stage (e.g. "Design") this document belongs to.
  stage?: string | null;
  createdAt: string | null;
}

export interface CreateDocumentInput {
  documentId?: string;
  title?: string;
  project: string;
  type: string;
  version?: string;
  fileUrl?: string;
  stage?: string;
}

export interface UploadDocumentInput {
  file: File;
  project: string;
  type: string;
  title?: string;
  stage?: string;
}

export const documentsRepository = {
  listByProject: (
    project?: string,
    opts: { stage?: string } = {},
  ): Promise<{ data: DocumentRecord[] }> => {
    const params = new URLSearchParams();
    if (project) params.set("project", project);
    if (opts.stage) params.set("stage", opts.stage);
    const qs = params.toString();
    return apiClient.get(`/documents${qs ? `?${qs}` : ""}`);
  },

  upload: async (
    input: UploadDocumentInput,
  ): Promise<{ data: DocumentRecord }> => {
    const formData = new FormData();

    formData.append("file", input.file);
    formData.append("project", input.project);
    formData.append("type", input.type);

    if (input.title?.trim()) {
      formData.append("title", input.title.trim());
    }
    if (input.stage) {
      formData.append("stage", input.stage);
    }

    return apiClient.postFormData(
      "/documents/upload",
      formData,
    );
  },

  remove: (id: number): Promise<{ data: DocumentRecord }> =>
    apiClient.del(`/documents/${id}`),

  create: (
    input: CreateDocumentInput,
  ): Promise<{ data: DocumentRecord }> =>
    apiClient.post("/documents", input),
};
