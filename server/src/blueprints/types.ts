// types.ts
export interface BlueprintRecord {
  id: number;
  drawingNumber: string;
  title: string;
  folder: string;
  discipline: string | null;
  scale: string | null;
  revision: string;
  author: string;
  approval: string;
  status: string;
  fileType: string;
  sizeKb: number;
  favorite: boolean;
  tags: string | null;
  issueDate: Date | null;
  latestRevisionDate: Date | null;
}

export interface CreateBlueprintInput {
  drawingNumber: string;
  title: string;
  folder: string;
  discipline?: string;
  scale?: string;
  revision?: string;
  author: string;
  approval?: string;
  status?: string;
  fileType?: string;
  sizeKb?: number;
  favorite?: boolean;
  tags?: string;
}

export interface UpdateBlueprintInput extends Partial<CreateBlueprintInput> {}

export interface BlueprintFilters {
  folder?: string;
  search?: string;
}