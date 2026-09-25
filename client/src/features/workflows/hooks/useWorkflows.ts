import { useCallback, useEffect, useState } from "react";

import { WorkflowRepository } from "../repositories/workflow.repository";

import type {
  ApprovalScope,
  ApprovalStats,
  CreateWorkflowInput,
  CreateWorkflowTemplateInput,
  DecideStageInput,
  UpdateWorkflowInput,
  Workflow,
  WorkflowAttachmentInput,
  WorkflowLineItemInput,
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

  const [creatingTemplate, setCreatingTemplate] = useState(false);

  const createTemplate = useCallback(
    async (input: CreateWorkflowTemplateInput) => {
      setCreatingTemplate(true);
      setError(null);

      try {
        const created = await WorkflowRepository.createTemplate(input);
        await reload();
        return created;
      } catch (err) {
        setError(
          err instanceof Error
            ? err
            : new Error("Failed to create workflow template."),
        );
        return null;
      } finally {
        setCreatingTemplate(false);
      }
    },
    [reload],
  );

  const [deletingTemplateId, setDeletingTemplateId] = useState<number | null>(null);

  const deleteTemplate = useCallback(
    async (id: number) => {
      setDeletingTemplateId(id);
      setError(null);

      try {
        await WorkflowRepository.deleteTemplate(id);
        await reload();
        return true;
      } catch (err) {
        setError(
          err instanceof Error
            ? err
            : new Error("Failed to delete workflow template."),
        );
        return false;
      } finally {
        setDeletingTemplateId(null);
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
    creatingTemplate,
    createTemplate,
    deletingTemplateId,
    deleteTemplate,
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

  const [saving, setSaving] = useState(false);

  const update = useCallback(
    async (id: number, input: UpdateWorkflowInput) => {
      setSaving(true);
      try {
        const updated = await WorkflowRepository.update(id, input);
        await reload();
        return updated;
      } finally {
        setSaving(false);
      }
    },
    [reload],
  );

  const remove = useCallback(
    async (id: number) => {
      setSaving(true);
      try {
        const deleted = await WorkflowRepository.remove(id);
        await reload();
        return deleted;
      } finally {
        setSaving(false);
      }
    },
    [reload],
  );

  return {
    workflows,
    loading,
    error,
    reload,
    saving,
    update,
    remove,
  } as const;
}

/**
 * =========================================================
 * Workflow Approvals
 * =========================================================
 */

// Q4: a small, sidebar-scoped count — every role that has an "Approvals"
// nav entry (PM, Consultant, Engineer, Finance, HR, Architect) shares the
// same resource, so this lives here rather than being finance-specific.
// GET /workflows/approvals/stats needs only authentication (no requireRole),
// and is already scoped server-side to the caller's own role, so this is
// safe to call from the generic Sidebar regardless of which role is signed
// in — a role with no approvable stage just gets 0 back.
export function useApprovalsPendingCount(): number {
  const [pending, setPending] = useState(0);

  useEffect(() => {
    let cancelled = false;
    WorkflowRepository.getApprovalStats()
      .then((stats) => {
        if (!cancelled) setPending(stats.pending);
      })
      .catch(() => {
        // Sidebar badge is a convenience, not a critical read — stay at 0.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return pending;
}

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

/**
 * =========================================================
 * Single workflow (detail)
 * =========================================================
 *
 * Every approval screen needs the same thing before a decision: the full
 * record, including what each earlier stage submitted. Fetching it here
 * rather than inline in a dialog keeps that one request in the feature layer
 * where the rest of the module's data access lives.
 */

export function useWorkflowDetail(workflowId: number | null) {
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const reload = useCallback(async () => {
    if (workflowId === null) return;

    setLoading(true);
    setError(null);

    try {
      setWorkflow(await WorkflowRepository.getById(workflowId));
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to load the workflow."),
      );
    } finally {
      setLoading(false);
    }
  }, [workflowId]);

  useEffect(() => {
    if (workflowId === null) {
      setWorkflow(null);
      return;
    }
    void reload();
  }, [workflowId, reload]);

  return { workflow, loading, error, reload } as const;
}

/**
 * =========================================================
 * Budget change requests (Finance)
 * =========================================================
 */

export function useBudgetChangeRequests() {
  const [requests, setRequests] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      setRequests(await WorkflowRepository.listBudgetChangeRequests());
    } catch (err) {
      setError(
        err instanceof Error
          ? err
          : new Error("Failed to load budget change requests."),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { requests, loading, error, reload } as const;
}

/**
 * =========================================================
 * Workflow initiation from a named template
 * =========================================================
 *
 * The role-specific "start this workflow" actions (Architect → Design
 * Proposal Approval / Public works compliance, Engineer → Budget Change
 * Request, HR → Subcontractor onboarding) all do the same three things:
 * resolve a template by name, create a workflow from it, and file whatever
 * the initiator submitted against the first stage.
 *
 * Template is resolved by NAME rather than a hardcoded id because template
 * ids differ between environments (the seeded set starts at different ids
 * depending on what was already in workflow_templates).
 */

export interface InitiateWorkflowInput {
  title: string;
  projectCode: string;
  amount?: number;
  type?: string;
  attachments?: WorkflowAttachmentInput[];
  lineItems?: WorkflowLineItemInput[];
  /** Uploaded after creation — a file needs the workflow id to attach to. */
  file?: File | null;
}

export function useWorkflowInitiation(templateName: string) {
  const [template, setTemplate] = useState<WorkflowTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);

    WorkflowRepository.listTemplates()
      .then((templates) => {
        if (cancelled) return;
        const match = templates.find(
          (t) => t.name.toLowerCase() === templateName.toLowerCase(),
        );
        setTemplate(match ?? null);
        if (!match) {
          setError(
            new Error(
              `No "${templateName}" workflow template is configured. Ask an administrator to add it.`,
            ),
          );
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err
              : new Error("Failed to load workflow templates."),
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [templateName]);

  const initiate = useCallback(
    async (input: InitiateWorkflowInput): Promise<Workflow | null> => {
      if (!template) {
        setError(
          new Error(
            `No "${templateName}" workflow template is configured. Ask an administrator to add it.`,
          ),
        );
        return null;
      }

      setSubmitting(true);
      setError(null);

      try {
        const created = await WorkflowRepository.create({
          title: input.title,
          projectCode: input.projectCode,
          templateId: template.id,
          amount: input.amount,
          type: input.type,
          attachments: input.attachments,
          lineItems: input.lineItems,
        });

        // The upload needs an existing workflow id, so it is a second call.
        // A failed upload is surfaced but does not discard the workflow — it
        // already exists, and the file can be re-attached from the detail view.
        if (input.file) {
          try {
            return await WorkflowRepository.uploadAttachment(
              created.id,
              input.file,
              input.file.name,
            );
          } catch (uploadErr) {
            setError(
              new Error(
                `${created.code} was created, but the document could not be attached: ${
                  uploadErr instanceof Error ? uploadErr.message : "upload failed"
                }`,
              ),
            );
            return created;
          }
        }

        return created;
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to start the workflow."),
        );
        return null;
      } finally {
        setSubmitting(false);
      }
    },
    [template, templateName],
  );

  return { template, loading, submitting, error, initiate } as const;
}
