// src/components/workflows/new-workflow-dialog.tsx
import { useState } from "react";
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

  const reset = () => {
    setTitle("");
    setProjectCode("");
    setTemplateId("");
    setAmount("");
    setType("");
  };

  const handleSubmit = async () => {
    if (!title || !projectCode || !templateId) return;
    await onSubmit({
      title,
      projectCode,
      templateId: Number(templateId),
      amount: amount ? Number(amount) : undefined,
      type: type || undefined,
    });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New workflow</DialogTitle>
          <DialogDescription>
            Initiate an approval pipeline from an existing template.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
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
            <Label htmlFor="wf-project">Project code</Label>
            <Input
              id="wf-project"
              value={projectCode}
              onChange={(e) => setProjectCode(e.target.value)}
              placeholder="e.g. WGT-04"
            />
          </div>

          <div className="grid gap-1.5">
            <Label>Template</Label>
            <Select value={templateId} onValueChange={setTemplateId}>
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