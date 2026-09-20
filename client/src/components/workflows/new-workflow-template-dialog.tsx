// client/src/components/workflows/new-workflow-template-dialog.tsx
//
// Admin/IT Designer defining a NEW workflow template — the steps/roles/order
// a workflow can later be started from. admin-workflow-configuration.tsx was
// entirely read-only ("configured read-only here" was the literal copy on
// the page) — the set of templates a workflow could ever be raised from was
// whatever had been seeded into the database, with no way to add another
// without a migration.
import { useState } from "react";
import { GripVertical, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { CreateWorkflowTemplateInput } from "@/features/workflows/types/workflow.types";

// The roles a workflow stage can actually be decided by — matches the
// `requireRole()` slugs used on every protected route across the API
// (server/src/**/routes.ts), not a display label. Owner is deliberately
// absent: every role in the app is read-only-oversight-only elsewhere and
// never appears as a decision-maker on any seeded template's stage.
const STAGE_ROLES: { value: string; label: string }[] = [
  { value: "project-manager", label: "Project Manager" },
  { value: "admin", label: "Admin" },
  { value: "finance-manager", label: "Finance Manager" },
  { value: "human-resources", label: "Human Resources" },
  { value: "architect", label: "Architect" },
  { value: "engineer", label: "Engineer" },
  { value: "consultant", label: "Consultant" },
  { value: "site-personnel", label: "Site Personnel" },
  { value: "it-designer", label: "IT Designer" },
];

// The only icon keys the stage-pipeline UI actually maps to a real icon
// (see components/workflows/workflow-stage-pipeline.tsx's
// WORKFLOW_STAGE_ICONS) — anything else silently falls back to a default,
// so the picker only offers ones that render distinctly.
const ICON_KEYS = ["UserCheck", "Wallet", "ShieldCheck", "FileSignature"] as const;

interface DraftStage {
  role: string;
  roleLabel: string;
  iconKey: string;
}

const emptyStage = (): DraftStage => ({ role: "", roleLabel: "", iconKey: "UserCheck" });

export interface NewWorkflowTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  creating: boolean;
  onSubmit: (input: CreateWorkflowTemplateInput) => Promise<unknown>;
}

export function NewWorkflowTemplateDialog({
  open,
  onOpenChange,
  creating,
  onSubmit,
}: NewWorkflowTemplateDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [avgDurationHours, setAvgDurationHours] = useState("24");
  const [stages, setStages] = useState<DraftStage[]>([emptyStage(), emptyStage()]);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setName("");
    setDescription("");
    setAvgDurationHours("24");
    setStages([emptyStage(), emptyStage()]);
    setError(null);
  };

  const updateStage = (index: number, patch: Partial<DraftStage>) =>
    setStages((prev) => prev.map((stage, i) => (i === index ? { ...stage, ...patch } : stage)));

  const handleRoleChange = (index: number, role: string) => {
    const roleLabel = STAGE_ROLES.find((r) => r.value === role)?.label ?? "";
    updateStage(index, { role, roleLabel });
  };

  const moveStage = (index: number, direction: -1 | 1) => {
    setStages((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const handleSubmit = async () => {
    setError(null);

    if (!name.trim()) {
      setError("Give the template a name.");
      return;
    }
    if (!description.trim()) {
      setError("Give the template a short description.");
      return;
    }
    const hours = Number(avgDurationHours);
    if (!Number.isFinite(hours) || hours <= 0) {
      setError("Average duration must be a positive number of hours.");
      return;
    }
    if (stages.length < 2) {
      setError("A template needs at least two stages — one to decide is really just self-approval.");
      return;
    }
    if (stages.some((s) => !s.role)) {
      setError("Every stage needs a role assigned to it.");
      return;
    }

    const created = await onSubmit({
      name: name.trim(),
      description: description.trim(),
      avgDurationHours: hours,
      defaultStages: stages.map((s) => ({
        role: s.role,
        roleLabel: s.roleLabel,
        iconKey: s.iconKey,
      })),
    });

    if (!created) return;
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New workflow template</DialogTitle>
          <DialogDescription>
            Define the stage sequence — who decides, in what order — that a
            new workflow can be started from.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {error && (
            <p
              role="alert"
              className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="tpl-name">Template name</Label>
              <Input
                id="tpl-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Site safety incident review"
                disabled={creating}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="tpl-hours">Average duration (hours)</Label>
              <Input
                id="tpl-hours"
                type="number"
                min="1"
                value={avgDurationHours}
                onChange={(e) => setAvgDurationHours(e.target.value)}
                disabled={creating}
              />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="tpl-description">Description</Label>
            <Textarea
              id="tpl-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What this workflow is for and when it should be used."
              className="min-h-20"
              disabled={creating}
            />
          </div>

          <div className="grid gap-2 rounded-xl border border-border p-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Stages, in order
              </Label>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 rounded-lg text-xs"
                disabled={creating || stages.length >= 10}
                onClick={() => setStages((prev) => [...prev, emptyStage()])}
              >
                <Plus className="h-3.5 w-3.5" /> Add stage
              </Button>
            </div>

            {stages.map((stage, index) => (
              <div
                key={index}
                className="grid grid-cols-[1.5rem_minmax(0,1fr)_7rem_2rem] items-center gap-2 rounded-lg bg-muted/30 p-2"
              >
                <div className="flex flex-col items-center text-muted-foreground">
                  <GripVertical className="h-3.5 w-3.5" />
                  <span className="text-[10px] tabular-nums">{index + 1}</span>
                </div>
                <Select
                  value={stage.role}
                  onValueChange={(v) => handleRoleChange(index, v)}
                  disabled={creating}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {STAGE_ROLES.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={stage.iconKey}
                  onValueChange={(v) => updateStage(index, { iconKey: v })}
                  disabled={creating}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ICON_KEYS.map((key) => (
                      <SelectItem key={key} value={key}>
                        {key}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex flex-col">
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                    disabled={creating || index === 0}
                    onClick={() => moveStage(index, -1)}
                    title="Move up"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                    disabled={creating || index === stages.length - 1}
                    onClick={() => moveStage(index, 1)}
                    title="Move down"
                  >
                    ▼
                  </button>
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="col-span-4 h-7 w-fit justify-self-end rounded-lg text-destructive hover:text-destructive"
                  disabled={creating || stages.length <= 2}
                  title="Remove this stage"
                  onClick={() => setStages((prev) => prev.filter((_, i) => i !== index))}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" disabled={creating} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={creating}>
            {creating ? "Creating…" : "Create template"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

NewWorkflowTemplateDialog.displayName = "NewWorkflowTemplateDialog";
