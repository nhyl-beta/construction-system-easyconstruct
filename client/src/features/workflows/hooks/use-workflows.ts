import { useCallback, useEffect, useState } from "react";

import type {
  WorkflowItem,
  WorkflowRole,
  WorkflowStatus,
} from "../types/workflow.types";

import {
  createWorkflow,
  getWorkflowsForRole,
  updateWorkflowStatus,
} from "../api/workflow-api";

export function useWorkflows(role: WorkflowRole) {
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);

    try {
      const result = await getWorkflowsForRole(role);

      setWorkflows(result);
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const create = async (
    input: Omit<
      WorkflowItem,
      "id" | "createdAt" | "updatedAt" | "status"
    >,
  ) => {
    const result = await createWorkflow(input);

    await refresh();

    return result;
  };

  const updateStatus = async (
    id: string,
    status: WorkflowStatus,
    comment?: string,
  ) => {
    const result = await updateWorkflowStatus(
      id,
      status,
      comment,
    );

    await refresh();

    return result;
  };

  return {
    workflows,
    loading,
    refresh,
    create,
    updateStatus,
  };
}