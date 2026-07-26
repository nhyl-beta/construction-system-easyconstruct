export interface Design {
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
  createdAt: string | null;
  updatedAt: string | null;
}