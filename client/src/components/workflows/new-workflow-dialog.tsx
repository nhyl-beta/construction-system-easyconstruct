// src/components/workflows/new-workflow-dialog.tsx
import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProjectPicker } from "@/components/shared/project-picker";
import { UserRepository, type PublicUser } from "@/features/users/repositories/user.repository";
import { useBudgetsController } from "@/features/finance/budgets/controllers/budget.controllers";
import type { CreateWorkflowInput, WorkflowTemplate } from "@/features/workflows/types/workflow.types";

interface NewWorkflowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templates: WorkflowTemplate[];
  creating: boolean;
  onSubmit: (input: CreateWorkflowInput) => Promise<unknown>;
}

export function NewWorkflowDialog({
  open,
  onOpenChange,
  templates,
  creating,
  onSubmit,
}: NewWorkflowDialogProps) {
  const [title, setTitle] = useState("");
  const [projectCode, setProjectCode] = useState("");
  const [templateId, setTemplateId] = useState<string>("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("");
  // Keyed by stage sequence (1-based, matching stageAssignments/service.ts),
  // value is the assignee's display name (assignedTo is a free-text varchar,
  // same as everywhere else this column is populated).
  const [stageAssignments, setStageAssignments] = useState<Record<string, string>>({});
  const [usersByRole, setUsersByRole] = useState<Record<string, PublicUser[]>>({});
  const [budgetId, setBudgetId] = useState("");

  const selectedTemplate = useMemo(
    () => templates.find((t) => String(t.id) === templateId) ?? null,
    [templates, templateId],
  );

  // G4: a Budget Change Request workflow needs to know which budget its
  // approval should sync (budgets.planned + a budget_adjustments row) —
  // every other template has nothing to link, so this only shows here.
  const isBudgetChangeRequest = selectedTemplate?.name === "Budget Change Request";
  const { budgets } = useBudgetsController();
  const projectBudgets = useMemo(
    () => budgets.filter((b) => b.project === projectCode),
    [budgets, projectCode],
  );

  useEffect(() => {
    if (!selectedTemplate) {
      setUsersByRole({});
      return;
    }
    let cancelled = false;
    const roles = Array.from(new Set(selectedTemplate.defaultStages.map((s) => s.role)));
    Promise.all(roles.map((role) => UserRepository.listByRole(role).then((users) => [role, users] as const)))
      .then((entries) => {
        if (!cancelled) setUsersByRole(Object.fromEntries(entries));
      })
      .catch(() => {
        if (!cancelled) setUsersByRole({});
      });
    return () => {
      cancelled = true;
    };
  }, [selectedTemplate]);

  const reset = () => {
    setTitle("");
    setProjectCode("");
    setTemplateId("");
    setAmount("");
    setType("");
    setStageAssignments({});
    setBudgetId("");
  };

  const handleSubmit = async () => {
    if (!title || !projectCode || !templateId) return;
    const cleanedAssignments = Object.fromEntries(
      Object.entries(stageAssignments).filter(([, v]) => v.trim().length > 0),
    );
    await onSubmit({
      title,
      projectCode,
      templateId: Number(templateId),
      amount: amount ? Number(amount) : undefined,
      type: type || undefined,
      stageAssignments: Object.keys(cleanedAssignments).length ? cleanedAssignments : undefined,
      budgetId: isBudgetChangeRequest && budgetId ? Number(budgetId) : undefined,
    });

    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New workflow</DialogTitle>
          <DialogDescription>
            Initiate an approval pipeline from an existing template.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 py-2">
          <div className="grid gap-1.5">
            <Label htmlFor="wf-title">Title</Label>
            <Input
              id="wf-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Steel erection — subcontractor proposal"
            />
          </div>

          <div className="grid gap-1.5">
            <Label>Project</Label>
            {/* Was a free-text "project code" box: a typo produced a workflow
                whose projectCode matched no real project, so it never showed
                up in any project-scoped view and could not be traced back to
                the job it belonged to. Same picker the rest of the app uses,
                backed by /api/projects. */}
            <ProjectPicker
              value={projectCode}
              onChange={setProjectCode}
              className="w-full"
            />
          </div>

          <div className="grid gap-1.5">
            <Label>Template</Label>
            <Select
              value={templateId}
              onValueChange={(v) => {
                setTemplateId(v);
                setStageAssignments({});
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a workflow template" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={String(t.id)}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isBudgetChangeRequest && (
            <div className="grid gap-1.5">
              <Label>Budget to change</Label>
              <Select value={budgetId || undefined} onValueChange={setBudgetId}>
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      !projectCode
                        ? "Select a project first"
                        : projectBudgets.length === 0
                          ? "No budgets on file for this project"
                          : "Select a budget"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {projectBudgets.map((b) => (
                    <SelectItem key={b.id} value={String(b.id)}>
                      {b.category} · {b.fiscalYear} · ₱{b.planned.toLocaleString()} planned
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                On final approval, this budget's planned amount is updated by the line items' requested delta.
              </p>
            </div>
          )}

          {selectedTemplate && (
            <div className="grid gap-2 rounded-lg border border-border p-3">
              <Label className="text-xs text-muted-foreground">
                Assign stages (optional)
              </Label>
              {selectedTemplate.defaultStages.map((stage, index) => {
                const sequence = String(index + 1);
                const candidates = usersByRole[stage.role] ?? [];
                return (
                  <div key={sequence} className="grid grid-cols-2 items-center gap-2">
                    <span className="text-sm text-muted-foreground">{stage.roleLabel}</span>
                    <Select
                      value={stageAssignments[sequence] ?? ""}
                      onValueChange={(v) =>
                        setStageAssignments((prev) => ({ ...prev, [sequence]: v }))
                      }
                      disabled={candidates.length === 0}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder={candidates.length === 0 ? "No users with this role" : "Unassigned"}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {candidates.map((u) => (
                          <SelectItem key={u.id} value={u.name}>
                            {u.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                );
              })}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="wf-amount">Amount (optional)</Label>
              <Input
                id="wf-amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="1240000"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="wf-type">Type (optional)</Label>
              <Input
                id="wf-type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                placeholder="Proposal"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={creating || !title || !projectCode || !templateId}
          >
            {creating ? "Starting…" : "Start workflow"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}