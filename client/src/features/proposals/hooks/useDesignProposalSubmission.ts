// client/src/features/proposals/hooks/useDesignProposalSubmission.ts
//
// Submitting a design proposal and opening its approval workflow are one
// server call now (POST /api/proposals/submit — see
// server/src/proposals/service.ts submit()), which also links
// proposals.workflow_id (D2). This used to compose two separate client round
// trips (create the proposal, then separately initiate a workflow from the
// "Design Proposal Approval" template) with no link recorded between them at
// all, so gates P3/P4 ("a proposal was submitted"/"approved") could never
// see it.
import { useCallback, useState } from "react";

import { WorkflowRepository } from "@/features/workflows/repositories/workflow.repository";
import type { Workflow } from "@/features/workflows/types/workflow.types";
import type { Proposal } from "../types/proposal.types";
import type { CreateProposalInput } from "../controllers/proposal.controller";

export interface DesignProposalSubmissionResult {
  proposal: Proposal;
  /** null when the proposal saved but the workflow could not be opened. */
  workflow: Workflow | null;
}

export function useDesignProposalSubmission(
  submitProposal: (
    input: CreateProposalInput,
  ) => Promise<{ proposal: Proposal; workflow: Workflow } | null>,
) {
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
        const result = await submitProposal(input);
        if (!result) return null;

        let workflow: Workflow | null = result.workflow;

        // The file upload needs an existing workflow id, so it's a second
        // call. A failed upload is reported rather than rolled back — the
        // proposal and its workflow already exist, and the file can be
        // re-attached from the workflow detail view.
        if (file) {
          try {
            workflow = await WorkflowRepository.uploadAttachment(
              result.workflow.id,
              file,
              file.name,
            );
          } catch (uploadErr) {
            setWarning(
              uploadErr instanceof Error
                ? uploadErr.message
                : "The proposal and workflow were saved, but the attached file could not be uploaded.",
            );
          }
        }

        return { proposal: result.proposal, workflow };
      } finally {
        setSubmitting(false);
      }
    },
    [submitProposal],
  );

  return {
    submit,
    submitting,
    /** Non-fatal: the proposal and workflow saved, only the file upload failed. */
    warning,
  } as const;
}
