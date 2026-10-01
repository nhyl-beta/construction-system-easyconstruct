// server/src/proposals/validation.ts — NEW
//
// Deterministic, rule-based proposal validation — decision support only.
// This deliberately does NOT call any external AI service (none is
// configured anywhere in this repo); it is real logic that runs on every
// submission, not a placeholder. The result is stored (in the existing
// `aiValidation` column) and shown to reviewers, but never changes a
// proposal's status itself — a human reviewer always makes the actual call.
export interface ProposalValidationResult {
  passed: boolean;
  issues: string[];
  warnings: string[];
  checkedAt: string;
}

export interface ProposalValidationInput {
  title: string;
  content?: string | null;
  amount?: string | null;
}

export function validateProposal(
  input: ProposalValidationInput,
  projectExists: boolean,
  projectCode: string,
): ProposalValidationResult {
  const issues: string[] = [];
  const warnings: string[] = [];

  if (!input.title || input.title.trim().length < 5) {
    issues.push("Title is missing or too short to describe the proposal.");
  }

  if (!projectExists) {
    issues.push(`Project code "${projectCode}" does not match any existing project.`);
  }

  if (!input.content || input.content.trim().length < 20) {
    warnings.push("Description is missing or very brief — reviewers may need more context.");
  }

  if (!input.amount || !input.amount.trim()) {
    warnings.push("No estimated amount provided.");
  } else {
    const numeric = Number(input.amount.replace(/[^\d.-]/g, ""));
    if (Number.isNaN(numeric)) {
      warnings.push(`Amount "${input.amount}" doesn't look like a valid number.`);
    }
  }

  return {
    passed: issues.length === 0,
    issues,
    warnings,
    checkedAt: new Date().toISOString(),
  };
}


/** Roles allowed to trigger POST /proposals/:id/validate. */
export const PROPOSAL_VALIDATE_ROLES = ["consultant", "project-manager", "architect", "admin"] as const;

/**
 * J: computes the stored validation JSON only when none exists yet, so asking
 * twice never rewrites (or re-timestamps) what a reviewer already saw.
 */
export function ensureValidation(
  proposal: ProposalValidationInput & { aiValidation?: string | null; projectCode: string },
  projectExists: boolean,
): { changed: boolean; aiValidation: string } {
  if (proposal.aiValidation) return { changed: false, aiValidation: proposal.aiValidation };
  const result = validateProposal(
    { title: proposal.title, content: proposal.content, amount: proposal.amount },
    projectExists,
    proposal.projectCode,
  );
  return { changed: true, aiValidation: JSON.stringify(result) };
}
