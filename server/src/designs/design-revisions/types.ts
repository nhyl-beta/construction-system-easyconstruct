// types.ts
export interface DesignRevisionRecord {
  id: number;
  designId: number;
  version: string;
  parentVersion: string | null;
  revisionNumber: number;
  reason: string | null;
  changeSummary: string | null;
  status: string;
  createdBy: string;
  createdAt: Date | null;
  approvedAt: Date | null;
}

export interface CreateDesignRevisionInput {
  designId: number;
  version: string;
  parentVersion?: string;
  revisionNumber?: number;
  reason?: string;
  changeSummary?: string;
  status?: string;
  createdBy: string;
}

export interface UpdateDesignRevisionInput extends Partial<CreateDesignRevisionInput> {
  approvedAt?: Date;
}

export interface DesignRevisionFilters {
  designId?: number;
  status?: string;
}