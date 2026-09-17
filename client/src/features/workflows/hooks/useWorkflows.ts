import { useCallback, useEffect, useState } from "react";

import { WorkflowRepository } from "../repositories/workflow.repository";

import type {
  ApprovalScope,
  ApprovalStats,
  CreateWorkflowInput,
  DecideStageInput,
  Workflow,
  WorkflowTemplate,
} from "../types/workflow.types";

/**
 * =========================================================
 * Workflow Templates
 * =========================================================
 */

export function useWorkflowTemplates() {
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await WorkflowRepository.listTemplates();

      setTemplates(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err
          : new Error("Failed to load workflow templates."),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const createWorkflow = useCallback(
    async (input: CreateWorkflowInput) => {
      setCreating(true);
      setError(null);

      try {
        const created = await WorkflowRepository.create(input);

        // Refresh template active counts after creating a workflow.
        await reload();

        return created;
      } catch (err) {
        const normalizedError =
          err instanceof Error
            ? err
            : new Error("Failed to create workflow.");

        setError(normalizedError);

        return null;
      } finally {
        setCreating(false);
      }
    },
    [reload],
  );

  return {
    templates,
    loading,
    creating,
    error,
    reload,
    createWorkflow,
  } as const;
}

/**
 * =========================================================
 * Active Workflows
 * =========================================================
 */

export function useActiveWorkflows() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await WorkflowRepository.listActive();

      setWorkflows(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err
          : new Error("Failed to load active workflows."),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return {
    workflows,
    loading,
    error,
    reload,
  } as const;
}

/**
 * =========================================================
 * Workflow Approvals
 * =========================================================
 */

export function useApprovals(scope: ApprovalScope) {
  type ApprovalItems = Awaited<
    ReturnType<typeof WorkflowRepository.listApprovals>
  >;

  const [items, setItems] = useState<ApprovalItems>([]);
  const [stats, setStats] = useState<ApprovalStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [deciding, setDeciding] = useState<number | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [queue, queueStats] = await Promise.all([
        WorkflowRepository.listApprovals(scope),
        WorkflowRepository.getApprovalStats(),
      ]);

      setItems(queue);
      setStats(queueStats);
    } catch (err) {
      setError(
        err instanceof Error
          ? err
          : new Error("Failed to load workflow approvals."),
      );
    } finally {
      setLoading(false);
    }
  }, [scope]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const decide = useCallback(
    async (
      workflowId: number,
      stageId: number,
      input: DecideStageInput,
    ) => {
      setDeciding(stageId);
      setError(null);

      try {
        const updated = await WorkflowRepository.decideStage(
          workflowId,
          stageId,
          input,
        );

        // Refresh approval queue after a decision.
        await reload();

        return updated;
      } catch (err) {
        const normalizedError =
          err instanceof Error
            ? err
            : new Error("Failed to decide workflow stage.");

        setError(normalizedError);

        return null;
      } finally {
        setDeciding(null);
      }
    },
    [reload],
  );

  return {
    items,
    stats,
    loading,
    deciding,
    error,
    reload,
    decide,
  } as const;
}
