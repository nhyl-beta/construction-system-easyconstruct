export type WorkflowRole =
  | "super_admin"
  | "admin"
  | "finance_manager"
  | "hr"
  | "architect"
  | "engineer"
  | "consultant"
  | "project_manager"
  | "site_personnel";

export type WorkflowStatus =
  | "DRAFT"
  | "PENDING_REVIEW"
  | "IN_REVIEW"
  | "APPROVED"
  | "REVISION_REQUESTED"
  | "REJECTED"
  | "COMPLETED";

export type WorkflowType =
  | "PROPOSAL_REVIEW"
  | "PAYROLL_REVIEW"
  | "DESIGN_REVIEW"
  | "WORKFORCE_REQUEST"
  | "TASK_ASSIGNMENT"
  | "PROJECT_REVIEW"
  | "DOCUMENT_REVIEW";

export interface WorkflowItem {
  id: string;

  type: WorkflowType;

  title: string;

  description?: string;

  projectId?: string;

  projectName?: string;

  createdBy: WorkflowRole;

  assignedTo: WorkflowRole;

  status: WorkflowStatus;

  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

  createdAt: string;

  updatedAt: string;

  comments?: string[];

  metadata?: Record<string, unknown>;
}