export interface DesignRecord {
  id: number;
  code: string;
  name: string;
  projectCode: string;
  discipline: string;
  category: string;
  phase: string;
  version: string;
  revision: number;
  status: string;
  leadArchitect: string;
  client: string | null;
  building: string | null;
  floor: string | null;
  zone: string | null;
  description: string | null;
  fileCount: number;
  aiCompleteness: number;
  aiConfidence: number;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface CreateDesignInput {
  code: string;
  name: string;
  projectCode: string;
  discipline: string;
  category: string;
  phase?: string;
  version?: string;
  revision?: number;
  status?: string;
  leadArchitect: string;
  client?: string;
  building?: string;
  floor?: string;
  zone?: string;
  description?: string;
  fileCount?: number;
  aiCompleteness?: number;
  aiConfidence?: number;
}

export interface UpdateDesignInput extends Partial<CreateDesignInput> {}

export interface DesignFilters {
  status?: string;
  discipline?: string;
  projectCode?: string;
  search?: string;
}