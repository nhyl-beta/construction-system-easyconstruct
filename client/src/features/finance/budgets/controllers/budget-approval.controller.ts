import { useCallback, useEffect, useMemo, useState } from "react";
import type { Budget } from "../types/budget.types";
import type { ApprovalDecision, ApprovalStage, BudgetApprovalStep } from "../types/budget-approval.types";
import { APPROVAL_STAGES } from "../types/budget-approval.types";

export const useBudgetApprovalController = (budgets: Budget[]) => {
  const [selectedBudgetId, setSelectedBudgetId] = useState<string>("");
  const [steps, setSteps] = useState<BudgetApprovalStep[]>([]);
  const [loading, setLoading] = useState(false);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!selectedBudgetId && budgets.length) {
      setSelectedBudgetId(String(budgets[0].id));
    }
  }, [budgets, selectedBudgetId]);

  const fetchSteps = useCallback((budgetId: string) => {
    if (!budgetId) return;
    setLoading(true);
    fetch(`/api/finance/budget-approval-steps?budgetId=${budgetId}`)
      .then((res) => res.json())
      .then((json) => setSteps(json.data ?? []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchSteps(selectedBudgetId);
  }, [selectedBudgetId, fetchSteps]);

  const selectedBudget = budgets.find((b) => String(b.id) === selectedBudgetId);

  const current: string = useMemo(() => {
    const undecided = steps.find((s) => !s.decision);
    return undecided?.stage ?? steps.at(-1)?.stage ?? "draft";
  }, [steps]);

  const decide = async (decision: ApprovalDecision) => {
    if (!selectedBudget) return;
    setSubmitting(true);
    try {
      await fetch(`/api/finance/budget-approval-steps/decide`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          budgetId: selectedBudget.id,
          stage: current as ApprovalStage,
          decision,
          actor: "Current User", // TODO: wire to real auth session once available
          comment: comment || undefined,
        }),
      });
      setComment("");
      fetchSteps(selectedBudgetId);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return {
    budgets,
    selectedBudgetId,
    setSelectedBudgetId,
    selectedBudget,
    steps,
    loading,
    current,
    stages: APPROVAL_STAGES,
    comment,
    setComment,
    submitting,
    decide,
  };
};