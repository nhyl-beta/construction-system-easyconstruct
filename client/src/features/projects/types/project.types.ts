export type RiskLevel = "low" | "medium" | "high";

/**
 * The single list of risk categories the UI offers. Kept here, next to
 * RiskLevel, so the New Project form and the project detail form can't drift
 * apart — and so neither can offer a value the backend's zod enum
 * (server/src/validators/project-validator.ts: 'Low' | 'Medium' | 'High')
 * would reject. Case is normalized on the wire by serializeProject().
 */
export const RISK_LEVELS: ReadonlyArray<{ value: RiskLevel; label: string }> = [
  { value: "high", label: "🔴 High" },
  { value: "medium", label: "🟡 Medium" },
  { value: "low", label: "🟢 Low" },
];
export type StatusTone = "success" | "warning" | "destructive" | "neutral";

export interface Project {
  id: number | string;
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
  contractValue?: number | null; // total contract amount, if recorded
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
