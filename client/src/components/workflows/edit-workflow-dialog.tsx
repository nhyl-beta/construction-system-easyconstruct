// src/components/workflows/edit-workflow-dialog.tsx
// Shared between pm-workflows.tsx and admin-workflows.tsx (EC-016) — title
// edit only; stage reassignment happens at creation time (see EC-001's
// NewWorkflowDialog), and status is driven by stage decisions.
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Workflow } from "@/features/workflows/types/workflow.types";

export function EditWorkflowDialog({
  workflow,
  onOpenChange,
  onSave,
}: {
  workflow: Workflow | null;
  onOpenChange: (open: boolean) => void;
  onSave: (id: number, title: string) => Promise<unknown>;
}) {
  const [title, setTitle] = useState(workflow?.title ?? "");
  const [saving, setSaving] = useState(false);

  // The Dialog's `open` prop is flipped programmatically (clicking "Edit"
  // sets `workflow` from null to a record) — Radix's onOpenChange only
  // fires on user-driven close (Escape/overlay), not on that externally
  // controlled transition, so syncing title there never actually ran.
  useEffect(() => {
    if (workflow) setTitle(workflow.title);
  }, [workflow]);

  return (
    <Dialog open={workflow !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit workflow</DialogTitle>
        </DialogHeader>
        <div className="grid gap-1.5 py-2">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={saving || !title.trim()}
            onClick={async () => {
              if (!workflow) return;
              setSaving(true);
              try {
                await onSave(workflow.id, title.trim());
                onOpenChange(false);
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
