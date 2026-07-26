// types/design-revision.types.ts
export interface DesignRevision {
  id: number;
  designId: number;
  version: string;
  parentVersion: string | null;
  revisionNumber: number;
  reason: string | null;
  changeSummary: string | null;
  status: string;
  createdBy: string;
  createdAt: string | null;
  approvedAt: string | null;
}