export type RiskLevel = "low" | "medium" | "high";
export type StatusTone = "success" | "warning" | "destructive" | "neutral";

export interface Project {
  code: string;
  name: string;
  client: string;
  location: string;
  status: string;
  statusTone: StatusTone;
  progress: number; // 0-100
  budget: number; // percent of budget used
  workforce: number;
  due: string; // ISO date or human string
  risk: RiskLevel;
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
