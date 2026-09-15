import { apiClient } from "@/services/api.client";
import { formatRelativeTime } from "@/lib/format-relative-time";
import type {
  CreateEngineeringReportInput,
  EngineeringReport,
  EngineeringReportFilters,
} from "../types/engineering-reports.types";

const USE_API = Boolean(import.meta.env.VITE_API_BASE);

interface BackendEngineeringReport {
  id: number;
  reportId: string;
  title: string;
  type: string;
  project: string;
  location: string;
  date: string;
  engineer: string;
  priority: string;
  description: string;
  findings: string;
  measurements: string | null;
  observations: string | null;
  recommendations: string;
  requiredActions: string | null;
  status: string;
  createdAt: string | null;
  updatedAt: string | null;
}

function normalizeReport(raw: BackendEngineeringReport): EngineeringReport {
  return {
    id: raw.reportId,
    title: raw.title,
    type: raw.type as EngineeringReport["type"],
    project: raw.project,
    location: raw.location,
    date: raw.date,
    engineer: raw.engineer,
    priority: raw.priority as EngineeringReport["priority"],
    description: raw.description,
    findings: raw.findings,
    measurements: raw.measurements ?? undefined,
    observations: raw.observations ?? undefined,
    recommendations: raw.recommendations,
    requiredActions: raw.requiredActions ?? undefined,
    status: raw.status as EngineeringReport["status"],
    updatedAgo: formatRelativeTime(raw.updatedAt),
  };
}

// Small local mock set — mirrors the seed rows on the backend so the mock
// and real modes stay recognizably in sync during development.
const mockReports: EngineeringReport[] = [
  {
    id: "SR-2218",
    title: "Foundation cure inspection — zone B",
    type: "Site Inspection",
    project: "WMT-204",
    location: "Zone B, Level 3",
    date: "2026-08-20",
    engineer: "K. Okafor",
    priority: "Medium",
    description: "Routine cure-window inspection following the zone B pour.",
    findings: "Cure progressing on schedule; humidity slightly elevated.",
    recommendations: "Re-check in 6 hours before proceeding to next pour.",
    status: "Submitted",
    updatedAgo: "2h ago",
  },
  {
    id: "SR-2219",
    title: "Rebar spacing verification",
    type: "Structural Assessment",
    project: "HLH-118",
    location: "Basement, Level -1",
    date: "2026-08-19",
    engineer: "L. Mendes",
    priority: "High",
    description: "Verification of rebar spacing against revised structural drawings.",
    findings: "Spacing within tolerance across all inspected bays.",
    recommendations: "Approved to proceed with formwork.",
    status: "Approved",
    updatedAgo: "1d ago",
  },
  {
    id: "SR-2220",
    title: "Electrical basement inspection",
    type: "Non-Conformance Report",
    project: "RCC-077",
    location: "Basement, Electrical room",
    date: "2026-08-18",
    engineer: "T. Nakamura",
    priority: "Critical",
    description: "Inspection flagged a conduit routing conflict blocking downstream trades.",
    findings: "Conduit run clashes with structural beam at grid C4.",
    recommendations: "Reroute conduit; escalate to structural engineer for sign-off.",
    requiredActions: "Coordinate with structural team before next inspection window.",
    status: "Revision Required",
    updatedAgo: "2d ago",
  },
];

// Unwraps the backend's { success, message, data } envelope.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function unwrap<T>(promise: Promise<any>): Promise<T> {
  const json = await promise;
  if (json && typeof json === "object" && "data" in json) {
    return json.data as T;
  }
  return json as T;
}

function matchesFilters(r: EngineeringReport, filters: EngineeringReportFilters): boolean {
  if (filters.project && filters.project !== "all" && r.project !== filters.project) return false;
  if (filters.type && filters.type !== "all" && r.type !== filters.type) return false;
  if (filters.status && filters.status !== "all" && r.status !== filters.status) return false;
  if (filters.search && !r.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
  return true;
}

export const EngineeringReportRepository = {
  async list(filters: EngineeringReportFilters = {}): Promise<EngineeringReport[]> {
    if (USE_API) {
      const params = new URLSearchParams();
      if (filters.project) params.set("project", filters.project);
      if (filters.type) params.set("type", filters.type);
      if (filters.status) params.set("status", filters.status);
      if (filters.search) params.set("search", filters.search);
      const qs = params.toString();
      const raw = await unwrap<BackendEngineeringReport[]>(
        apiClient.get(`/engineering-reports${qs ? `?${qs}` : ""}`),
      );
      return raw.map(normalizeReport);
    }

    await new Promise((r) => setTimeout(r, 120));
    return mockReports.filter((r) => matchesFilters(r, filters));
  },

  async create(payload: CreateEngineeringReportInput): Promise<EngineeringReport> {
    if (USE_API) {
      const raw = await unwrap<BackendEngineeringReport>(
        apiClient.post("/engineering-reports", payload),
      );
      return normalizeReport(raw);
    }

    const newReport: EngineeringReport = {
      id: `SR-${Date.now().toString().slice(-4)}`,
      status: "Submitted",
      updatedAgo: "just now",
      ...payload,
    };
    mockReports.unshift(newReport);
    return newReport;
  },
};