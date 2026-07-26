// types/blueprint.types.ts
export interface Blueprint {
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
  issueDate: string | null;
  latestRevisionDate: string | null;
}
