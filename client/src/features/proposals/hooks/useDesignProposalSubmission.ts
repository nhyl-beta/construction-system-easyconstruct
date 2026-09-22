// client/src/features/proposals/hooks/useDesignProposalSubmission.ts
//
// Submitting a design proposal and opening its approval workflow are one
// action, not two.
//
// The architect could previously create a proposal row and that was the end
// of it: nothing routed it, and the "Design Proposal Approval" template
// (Architect Submission → Consultant Review → PM Approval) could only be
// started by a PM or an admin who happened to know the proposal existed. So a
// proposal sat in the register with a "Pending" status and no chain behind it.
//
// This composes the two existing feature calls — proposal create, then
// workflow initiation from the named template — and files the proposal's own
// content as the workflow's first-stage submission, so the consultant
// reviewing at stage 2 sees what was actually proposed.
import { useCallback, useState } from "react";

import { useWorkflowInitiation } from "@/features/workflows/hooks/useWorkflows";
import type { Workflow } from "@/features/workflows/types/workflow.types";
import type { Proposal } from "../types/proposal.types";
import type { CreateProposalInput } from "../controllers/proposal.controller";

const DESIGN_APPROVAL_TEMPLATE = "Design Proposal Approval";

export interface DesignProposalSubmissionResult {
  proposal: Proposal;
  /** null when the proposal saved but the workflow could not be opened. */
  workflow: Workflow | null;
}

export function useDesignProposalSubmission(
  createProposal: (input: CreateProposalInput) => Promise<Proposal | null>,
) {
  const { template, initiate, submitting: startingWorkflow, error: workflowError } =
    useWorkflowInitiation(DESIGN_APPROVAL_TEMPLATE);

  const [submitting, setSubmitting] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);

  const submit = useCallback(
    async (
      input: CreateProposalInput,
      file?: File | null,
    ): Promise<DesignProposalSubmissionResult | null> => {
      setSubmitting(true);
      setWarning(null);

      try {
        const proposal = await createProposal(input);
        if (!proposal) return null;

        const workflow = await initiate({
          title: proposal.title,
          projectCode: proposal.projectCode,
          type: "Design Proposal",
          amount: proposal.amount ? Number(proposal.amount) : undefined,
          attachments: [
            {
              kind: "note",
              label: `Design proposal ${proposal.proposalId}`,
              content:
                proposal.content?.trim() ||
                "No design description was provided with this proposal.",
            },
          ],
          // Filed against the workflow's first stage (the architect's own
          // step), same as any other stage submission — see
          // workflow_attachments and WorkflowRepository.uploadAttachment.
          file,
        });

        // The proposal already exists at this point, so a failed workflow is
        // reported rather than rolled back — it can still be started from the
        // Workflows page, and silently discarding the proposal would be worse.
        if (!workflow) {
          setWarning(
            workflowError?.message ??
              "The proposal was saved, but its approval workflow could not be started.",
          );
        }

        return { proposal, workflow };
      } finally {
        setSubmitting(false);
      }
    },
    [createProposal, initiate, workflowError],
  );

  return {
    submit,
    submitting: submitting || startingWorkflow,
    /** Non-fatal: the proposal saved, the workflow did not start. */
    warning,
    /** null when no "Design Proposal Approval" template is configured. */
    template,
  } as const;
}
