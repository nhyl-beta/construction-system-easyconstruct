import type { WorkflowStageDefinition } from "../db/schema/workflows.js";

export type { WorkflowStageDefinition };

export interface CreateWorkflowInput {
  title: string;
  projectCode: string;
  templateId: number;
  amount?: number;
  type?: string;
  stageAssignments?: Record<string, string>;
}

export interface DecideStageInput {
  decision: "approve" | "reject" | "revise";
  comments?: string;
  decidedBy: string;
}

export interface WorkflowWithStages {
  id: number;
  code: string;
  title: string;
  projectCode: string;
  templateId: number | null;
  templateName: string | null;
  amount: string | null;
  type: string | null;
  severity: string;
  aiNote: string | null;
  status: string;
  createdBy: string;
  createdAt: Date | null;
  updatedAt: Date | null;
  stages: {
    id: number;
    sequence: number;
    role: string;
    roleLabel: string;
    iconKey: string;
    status: string;
    assignedTo: string | null;
    decidedBy: string | null;
    decidedAt: Date | null;
    comments: string | null;
    createdAt: Date | null;
  }[];
}

export interface TemplateWithActiveCount {
  id: number;
  name: string;
  description: string;
  avgDurationHours: string;
  defaultStages: WorkflowStageDefinition[];
  activeCount: number;
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
  severity: string;
  aiNote: string | null;
  ownerRoleLabel: string;
  status: string;
  assignedTo: string | null;
  decidedBy: string | null;
  decidedAt: Date | null;
  createdAt: Date | null;
}