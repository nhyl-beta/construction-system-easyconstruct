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
  stage: string | null;
  relatedType: string | null;
  relatedId: number | null;
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
  stage?: string;
  relatedType?: string;
  relatedId?: number;
}

export interface UploadDocumentInput {
  file: Express.Multer.File;
  title: string;
  project: string;
  type: string;
  version?: string;
  uploadedBy: string;
  stage?: string;
  relatedType?: string;
  relatedId?: number | string;
}

export interface DocumentFilters {
  project?: string;
  type?: string;
  projectCodes?: string[];
  stage?: string;
}