export type RiskLevel = "low" | "medium" | "high";
export type StatusTone = "success" | "warning" | "destructive" | "neutral";

export interface Project {
  id: number;
  code: string;
  name: string;
  pm?: string;
  assignedEngineer?: string;
  client: string;
  location: string;
  status: string;
  statusTone: StatusTone;
  progress: number; // 0-100
  budget: number; // percent of budget used
  workforce: number;
  due: string; // ISO date or human string
  risk: RiskLevel;
  description?: string | null;
}

export interface ProjectsQuery {
  q?: string;
  status?: string;
  risk?: RiskLevel | "any";
  page?: number;
  perPage?: number;
}

export interface ProjectsKpi {
  total: number;
  onTrack: number;
  atRisk: number;
  delayed: number;
}
