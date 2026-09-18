import { apiClient } from "@/services/api.client";
import type {
  ApprovalQueueItem,
  ApprovalScope,
  ApprovalStats,
  CreateWorkflowInput,
  DecideStageInput,
  UpdateWorkflowInput,
  Workflow,
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
};