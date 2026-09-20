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
/**
 * ISO 4217 codes a project may be denominated in. Must stay in step with the
 * zod enum on the server (server/src/validators/project-validator.ts), which
 * is what stops a stored code the formatters can't render.
 *
 * PHP is first and the default: EasyConstruct is a Philippine construction
 * system, and every project that predates the `currency` column is PHP.
 */
export const PROJECT_CURRENCIES: ReadonlyArray<{ code: string; label: string }> = [
  { code: "PHP", label: "Philippine Peso (₱ PHP)" },
  { code: "USD", label: "US Dollar ($ USD)" },
  { code: "EUR", label: "Euro (€ EUR)" },
  { code: "AUD", label: "Australian Dollar (A$ AUD)" },
  { code: "SGD", label: "Singapore Dollar (S$ SGD)" },
  { code: "JPY", label: "Japanese Yen (¥ JPY)" },
  { code: "AED", label: "UAE Dirham (AED)" },
];

export type StatusTone = "success" | "warning" | "destructive" | "neutral";

export interface Project {
  id: number | string;
  code: string;
  name: string;
  pm?: string;
  assignedEngineer?: string;
  client: string;
  /** ISO 4217 code every amount on this project is denominated in. */
  currency: string;
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
  // Registered site position. Attendance clock-ins are measured against it
  // (server/src/attendance/service.ts); null means no geofence is enforced.
  siteLatitude?: number | null;
  siteLongitude?: number | null;
  geofenceRadiusM?: number | null;
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
