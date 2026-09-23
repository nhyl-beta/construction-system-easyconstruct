// Mirrors server/src/lifecycle/phases.ts (source of truth is the server —
// this is a display-layer copy, not re-derived from an API call).
export const PROJECT_PHASES = [
  "Proposal",
  "Design",
  "Pre-Construction",
  "Construction",
  "Closeout",
  "Completed",
  "Archived",
  "On Hold",
  "Cancelled",
] as const;
export type ProjectPhase = (typeof PROJECT_PHASES)[number];

export const SEQUENCED_PHASES = [
  "Proposal",
  "Design",
  "Pre-Construction",
  "Construction",
  "Closeout",
  "Completed",
  "Archived",
] as const;
export type SequencedPhase = (typeof SEQUENCED_PHASES)[number];

export interface GateCheck {
  key: string;
  label: string;
  ownerRoles: string[];
  passed: boolean;
  detail?: string;
  link?: string;
}

export interface PhaseHistoryEntry {
  id: number;
  projectCode: string;
  fromStatus: string;
  toStatus: string;
  changedBy: string;
  changedByUserId: number | null;
  reason: string | null;
  override: boolean;
  createdAt: string | null;
}

export interface LifecycleView {
  phase: ProjectPhase;
  progress: number;
  band: { start: number; end: number } | null;
  checks: GateCheck[];
  nextPhase: SequencedPhase | null;
  canAdvance: boolean;
  blockedReason?: string;
  constructionTasks?: { done: number; total: number };
  history: PhaseHistoryEntry[];
  hasRejectedProposal?: boolean;
}

// H6
export interface CloseoutSummary {
  phase: ProjectPhase;
  checks: GateCheck[];
  documents: { certificateOfCompletion: boolean; asBuiltDrawing: boolean };
  budgets: { category: string; planned: number; committed: number; spent: number }[];
  payroll: { pending: number; approvedSinceCloseout: number };
  closeoutWorkflow: { status: string; currentStageRoleLabel: string | null } | null;
}
