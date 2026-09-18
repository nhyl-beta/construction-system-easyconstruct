export interface WorkflowStageDefinition {
  role: string;
  roleLabel: string;
  iconKey: string;
}

export interface WorkflowTemplate {
  id: number;
  name: string;
  description: string;
  avgDurationHours: string;
  defaultStages: WorkflowStageDefinition[];
  activeCount: number;
}

export type StageStatus = "upcoming" | "current" | "done" | "rejected" | "revision-required";

export interface WorkflowStage {
  id: number;
  sequence: number;
  role: string;
  roleLabel: string;
  iconKey: string;
  status: StageStatus;
  assignedTo: string | null;
  decidedBy: string | null;
  decidedAt: string | null;
  comments: string | null;
  createdAt: string | null;
}

export type WorkflowStatus = "active" | "completed" | "rejected" | "cancelled";

export interface Workflow {
  id: number;
  code: string;
  title: string;
  projectCode: string;
  templateId: number | null;
  templateName: string | null;
  amount: string | null;
  type: string | null;
  severity: "high" | "medium" | "low";
  aiNote: string | null;
  status: WorkflowStatus;
  createdBy: string;
  createdAt: string | null;
  updatedAt: string | null;
  stages: WorkflowStage[];
}

export interface CreateWorkflowInput {
  title: string;
  projectCode: string;
  templateId: number;
  amount?: number;
  type?: string;
  stageAssignments?: Record<string, string>;
}

export interface UpdateWorkflowInput {
  title?: string;
  projectCode?: string;
  severity?: "low" | "medium" | "high";
  type?: string;
}

export type Decision = "approve" | "reject" | "revise";

export interface DecideStageInput {
  decision: Decision;
  comments?: string;
}

export type ApprovalScope = "pending" | "mine" | "history";

export interface ApprovalQueueItem {
  stageId: number;
  workflowId: number;
  workflowCode: string;
  title: string;
  projectCode: string;
  type: string | null;
  amount: string | null;
  severity: "high" | "medium" | "low";
  aiNote: string | null;
  ownerRoleLabel: string;
  status: StageStatus;
  assignedTo: string | null;
  decidedBy: string | null;
  decidedAt: string | null;
  createdAt: string | null;
}

export interface ApprovalStats {
  pending: number;
  overdue: number;
  avgCycleDays: number;
  thisWeek: number;
}