import type {
  WorkflowItem,
  WorkflowRole,
  WorkflowStatus,
  WorkflowType,
} from "../types/workflow.types";

const STORAGE_KEY = "easyconstruct_workflows";

function loadWorkflows(): WorkflowItem[] {
  const stored = localStorage.getItem(STORAGE_KEY);

  if (!stored) {
    return [];
  }

  try {
    return JSON.parse(stored) as WorkflowItem[];
  } catch {
    return [];
  }
}

function saveWorkflows(workflows: WorkflowItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(workflows));
}

export async function getWorkflows(): Promise<WorkflowItem[]> {
  return loadWorkflows();
}

export async function getWorkflowsForRole(
  role: WorkflowRole,
): Promise<WorkflowItem[]> {
  const workflows = loadWorkflows();

  return workflows.filter(
    (workflow) =>
      workflow.createdBy === role ||
      workflow.assignedTo === role,
  );
}

export async function createWorkflow(
  input: Omit<
    WorkflowItem,
    "id" | "createdAt" | "updatedAt" | "status"
  >,
): Promise<WorkflowItem> {
  const workflows = loadWorkflows();

  const now = new Date().toISOString();

  const workflow: WorkflowItem = {
    ...input,
    id: `WF-${String(workflows.length + 1).padStart(3, "0")}`,
    status: "PENDING_REVIEW",
    createdAt: now,
    updatedAt: now,
  };

  workflows.push(workflow);

  saveWorkflows(workflows);

  return workflow;
}

export async function updateWorkflowStatus(
  id: string,
  status: WorkflowStatus,
  comment?: string,
): Promise<WorkflowItem | null> {
  const workflows = loadWorkflows();

  const index = workflows.findIndex(
    (workflow) => workflow.id === id,
  );

  if (index === -1) {
    return null;
  }

  const workflow = workflows[index];

  const updatedWorkflow: WorkflowItem = {
    ...workflow,

    status,

    updatedAt: new Date().toISOString(),

    comments: comment
      ? [...(workflow.comments ?? []), comment]
      : workflow.comments,
  };

  workflows[index] = updatedWorkflow;

  saveWorkflows(workflows);

  return updatedWorkflow;
}