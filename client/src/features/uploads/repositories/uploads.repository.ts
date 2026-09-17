import { apiClient } from "@/services/api.client";

export interface UploadResult {
  url: string;
  filename: string;
  contentType: string;
  sizeBytes: number;
}

export const uploadsRepository = {
  upload: (filename: string, contentType: string, dataUrl: string): Promise<{ data: UploadResult }> =>
    apiClient.post("/uploads", { filename, contentType, dataUrl }),
};