// server/src/documents/types.ts — NEW
export interface DocumentRecord {
  id: number;
  documentId: string;
  title: string;
  project: string;
  type: string;
  version: string;
  size: string | null;
  uploadedBy: string;
  fileUrl: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface CreateDocumentInput {
  documentId: string;
  title: string;
  project: string;
  type: string;
  version?: string;
  size?: string;
  uploadedBy: string;
  fileUrl?: string;
}

export interface UploadDocumentInput {
  file: Express.Multer.File;
  title: string;
  project: string;
  type: string;
  version?: string;
  uploadedBy: string;
}

export interface DocumentFilters {
  project?: string;
  type?: string;
}