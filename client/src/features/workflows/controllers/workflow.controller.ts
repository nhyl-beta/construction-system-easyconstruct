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

export function useWorkflowTemplatesController() {
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setTemplates(await WorkflowRepository.listTemplates());
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const createWorkflow = useCallback(async (input: CreateWorkflowInput) => {
    setCreating(true);
    try {
      const created = await WorkflowRepository.create(input);
      await load(); // refresh templates' activeCount
      return created;
    } catch (err) {
      setError(err as Error);
      return null;
    } finally {
      setCreating(false);
    }
  }, [load]);

  return { templates, loading, creating, error, reload: load, createWorkflow } as const;
}

export function useActiveWorkflowsController() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setWorkflows(await WorkflowRepository.listActive());
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { workflows, loading, error, reload: load } as const;
}

export function useApprovalsController(scope: ApprovalScope) {
  const [items, setItems] = useState<Awaited<ReturnType<typeof WorkflowRepository.listApprovals>>>([]);
  const [stats, setStats] = useState<ApprovalStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [deciding, setDeciding] = useState<number | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
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
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [scope]);

  useEffect(() => { load(); }, [load]);

  const decide = useCallback(
    async (workflowId: number, stageId: number, input: DecideStageInput) => {
      setDeciding(stageId);
      try {
        const updated = await WorkflowRepository.decideStage(workflowId, stageId, input);
        await load(); // the acted-on item leaves "pending" once decided
        return updated;
      } catch (err) {
        setError(err as Error);
        return null;
      } finally {
        setDeciding(null);
      }
    },
    [load],
  );

  return { items, stats, loading, deciding, error, reload: load, decide } as const;
}