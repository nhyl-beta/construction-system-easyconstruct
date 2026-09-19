import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  CreateEngineeringReportInput,
  EngineeringReportType,
  ReportPriority,
  ReportStatus,
} from "@/features/engineering-reports/types/engineering-reports.types";
import { REPORT_PRIORITIES } from "@/features/engineering-reports/types/engineering-reports.types";
import { ProjectPicker } from "@/components/shared/project-picker";

const TODAY = () => new Date().toISOString().slice(0, 10);

export const PRIORITY_TONE: Record<ReportPriority, string> = {
  Low: "bg-muted text-muted-foreground border-border",
  Medium: "bg-primary-soft/60 text-primary border-primary/20",
  High: "bg-warning/15 text-warning-foreground border-warning/30",
  Critical: "bg-destructive/10 text-destructive border-destructive/20",
};

export const STATUS_TONE: Record<ReportStatus, string> = {
  Draft: "bg-muted text-muted-foreground border-border",
  Submitted: "bg-primary-soft/60 text-primary border-primary/20",
  "Under Review": "bg-warning/15 text-warning-foreground border-warning/30",
  Approved: "bg-success/10 text-success border-success/20",
  Rejected: "bg-destructive/10 text-destructive border-destructive/20",
  "Revision Required": "bg-warning/15 text-warning-foreground border-warning/30",
};

export function PriorityBadge({ priority }: { priority: ReportPriority }) {
  return (
    <Badge
      variant="outline"
      className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${PRIORITY_TONE[priority]}`}
    >
      {priority}
    </Badge>
  );
}

export function ReportStatusBadge({ status }: { status: ReportStatus }) {
  return (
    <Badge
      variant="outline"
      className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${STATUS_TONE[status]}`}
    >
      {status}
    </Badge>
  );
}

// Shared "New report" dialog for both the Progress and Issues pages.
// `typeOptions` scopes the dropdown to whichever report taxonomy that
// page cares about, per EngineeringReportService.onlyProgress/onlyIssues.
export function NewReportDialog({
  typeOptions,
  triggerLabel = "New report",
  createReport,
  engineerName,
}: {
  typeOptions: EngineeringReportType[];
  triggerLabel?: string;
  createReport: (payload: CreateEngineeringReportInput) => Promise<void>;
  engineerName: string;
}) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "",
    type: "" as EngineeringReportType | "",
    priority: "Medium" as ReportPriority,
    project: "",
    location: "",
    date: TODAY(),
    description: "",
    findings: "",
    measurements: "",
    recommendations: "",
    requiredActions: "",
  });

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const reset = () =>
    setForm({
      title: "",
      type: "",
      priority: "Medium",
      project: "",
      location: "",
      date: TODAY(),
      description: "",
      findings: "",
      measurements: "",
      recommendations: "",
      requiredActions: "",
    });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.type || !form.title || !form.project || !form.location) return;
    setSubmitting(true);
    try {
      await createReport({
        title: form.title,
        type: form.type,
        priority: form.priority,
        project: form.project.toUpperCase(),
        location: form.location,
        date: form.date || TODAY(),
        engineer: engineerName,
        description: form.description,
        findings: form.findings,
        measurements: form.measurements || undefined,
        recommendations: form.recommendations,
        requiredActions: form.requiredActions || undefined,
      });
      toast.success("Report submitted");
      reset();
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit report");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-xl">{triggerLabel}</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New engineering report</DialogTitle>
        </DialogHeader>
        <form className="max-h-[70vh] space-y-4 overflow-y-auto pr-1" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <Label htmlFor="report-title">Report title</Label>
            <Input
              id="report-title"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Foundation cure inspection — zone B"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Report type</Label>
              <Select
                value={form.type}
                onValueChange={(v) => set("type", v as EngineeringReportType)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a type" />
                </SelectTrigger>
                <SelectContent>
                  {typeOptions.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select
                value={form.priority}
                onValueChange={(v) => set("priority", v as ReportPriority)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REPORT_PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="report-project">Project code</Label>
              <ProjectPicker
                value={form.project}
                onChange={(code) => set("project", code)}
                className="w-full"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="report-location">Location / zone</Label>
              <Input
                id="report-location"
                value={form.location}
                onChange={(e) => set("location", e.target.value)}
                placeholder="Zone B, Level 3"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="report-date">Report date</Label>
            <Input
              id="report-date"
              type="date"
              value={form.date}
              onChange={(e) => set("date", e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="report-description">Description</Label>
            <Textarea
              id="report-description"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={2}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="report-findings">Findings</Label>
            <Textarea
              id="report-findings"
              value={form.findings}
              onChange={(e) => set("findings", e.target.value)}
              rows={2}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="report-recommendations">Recommendations</Label>
            <Textarea
              id="report-recommendations"
              value={form.recommendations}
              onChange={(e) => set("recommendations", e.target.value)}
              rows={2}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="report-actions">Required actions (optional)</Label>
            <Textarea
              id="report-actions"
              value={form.requiredActions}
              onChange={(e) => set("requiredActions", e.target.value)}
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={submitting} className="rounded-xl">
              {submitting ? "Submitting…" : "Submit report"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}