import { apiClient } from "@/services/api.client";
import type {
  ApprovalQueueItem,
  ApprovalScope,
  ApprovalStats,
  CreateWorkflowInput,
  CreateWorkflowTemplateInput,
  DecideStageInput,
  UpdateWorkflowInput,
  Workflow,
  WorkflowAttachmentInput,
  WorkflowTemplate,
} from "../types/workflow.types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function unwrap<T>(promise: Promise<any>): Promise<T> {
  const json = await promise;
  if (json && typeof json === "object" && "data" in json) return json.data as T;
  return json as T;
}

export const WorkflowRepository = {
  async listTemplates(): Promise<WorkflowTemplate[]> {
    return unwrap<WorkflowTemplate[]>(apiClient.get("/workflows/templates"));
  },

  /** Admin/IT Designer defining a new, reusable workflow template. */
  async createTemplate(input: CreateWorkflowTemplateInput): Promise<WorkflowTemplate> {
    return unwrap<WorkflowTemplate>(apiClient.post("/workflows/templates", input));
  },

  /** Admin only — rejected server-side if any workflow was ever raised from it. */
  async deleteTemplate(id: number): Promise<WorkflowTemplate> {
    return unwrap<WorkflowTemplate>(apiClient.del(`/workflows/templates/${id}`));
  },

  async listActive(): Promise<Workflow[]> {
    return unwrap<Workflow[]>(apiClient.get("/workflows"));
  },

  async getById(id: number): Promise<Workflow> {
    return unwrap<Workflow>(apiClient.get(`/workflows/${id}`));
  },

  async create(input: CreateWorkflowInput): Promise<Workflow> {
    return unwrap<Workflow>(apiClient.post("/workflows", input));
  },

  async update(id: number, input: UpdateWorkflowInput): Promise<Workflow> {
    return unwrap<Workflow>(apiClient.patch(`/workflows/${id}`, input));
  },

  async remove(id: number): Promise<Workflow> {
    return unwrap<Workflow>(apiClient.del(`/workflows/${id}`));
  },

  async decideStage(
    workflowId: number,
    stageId: number,
    input: DecideStageInput,
  ): Promise<Workflow> {
    return unwrap<Workflow>(
      apiClient.patch(`/workflows/${workflowId}/stages/${stageId}/decision`, input),
    );
  },

  async listApprovals(scope: ApprovalScope): Promise<ApprovalQueueItem[]> {
    return unwrap<ApprovalQueueItem[]>(apiClient.get(`/workflows/approvals?scope=${scope}`));
  },

  async getApprovalStats(): Promise<ApprovalStats> {
    return unwrap<ApprovalStats>(apiClient.get("/workflows/approvals/stats"));
  },

  /** Files a note or a link against a running workflow. Returns the workflow. */
  async addAttachment(
    workflowId: number,
    input: WorkflowAttachmentInput,
  ): Promise<Workflow> {
    return unwrap<Workflow>(
      apiClient.post(`/workflows/${workflowId}/attachments`, input),
    );
  },

  /**
   * Multipart variant of addAttachment. Goes through the workflows module
   * rather than /documents/upload so roles without a documents page (HR,
   * Engineer, Architect) can still attach a file to a workflow.
   */
  async uploadAttachment(
    workflowId: number,
    file: File,
    label?: string,
  ): Promise<Workflow> {
    const formData = new FormData();
    formData.append("file", file);
    if (label?.trim()) formData.append("label", label.trim());
    return unwrap<Workflow>(
      apiClient.postFormData(`/workflows/${workflowId}/attachments/upload`, formData),
    );
  },

  /**
   * Every workflow raised from the "Budget Change Request" template, each
   * with its line items attached — Finance's review of what actually changed.
   */
  async listBudgetChangeRequests(): Promise<Workflow[]> {
    return unwrap<Workflow[]>(apiClient.get("/workflows/budget-change-requests"));
  },
};