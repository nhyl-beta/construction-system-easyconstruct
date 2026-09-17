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
  createdAt: string | null;
}

export interface CreateDocumentInput {
  documentId?: string;
  title?: string;
  project: string;
  type: string;
  version?: string;
  fileUrl?: string;
}

export interface UploadDocumentInput {
  file: File;
  project: string;
  type: string;
  title?: string;
}

export const documentsRepository = {
  listByProject: (
    project?: string,
  ): Promise<{ data: DocumentRecord[] }> =>
    apiClient.get(
      project
        ? `/documents?project=${encodeURIComponent(project)}`
        : "/documents",
    ),

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

    return apiClient.postFormData(
      "/documents/upload",
      formData,
    );
  },

  create: (
    input: CreateDocumentInput,
  ): Promise<{ data: DocumentRecord }> =>
    apiClient.post("/documents", input),
};
