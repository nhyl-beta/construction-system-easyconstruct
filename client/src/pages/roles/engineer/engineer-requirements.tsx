import { useState, type FormEvent } from "react";
import { FileText, ListChecks, Paperclip, Send } from "lucide-react";
import { toast } from "sonner";

import { PageContainer } from "@/components/refine-ui/views/page-container";
import { PageHeader } from "@/components/refine-ui/views/page-header";
import { PageContent } from "@/components/refine-ui/views/page-content";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiStrip } from "@/components/ui/kpi-strip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

import { ProjectPicker } from "@/components/shared/project-picker";
import { FileListPicker } from "@/components/shared/file-list-picker";
import { uploadsRepository } from "@/features/uploads/repositories/uploads.repository";
import { openFileUrl } from "@/lib/file-url";
import { useRequirements } from "@/features/requirements/hooks/useRequirements";
import {
  REQUIREMENT_CATEGORIES,
  type Requirement,
  type RequirementAttachment,
  type RequirementCategory,
} from "@/features/requirements/types/requirements.types";
import { RequirementService } from "@/features/requirements/services/requirement.service";
import { useAuth } from "@/auth/auth-context";

const STATUS_TONE: Record<string, string> = {
  Draft: "bg-muted text-muted-foreground border-border",
  "Under Review": "bg-warning/15 text-warning border-warning/30",
  Approved: "bg-success/10 text-success border-success/20",
  Rejected: "bg-destructive/10 text-destructive border-destructive/20",
};

/** Reads a File and stores it through POST /api/uploads. */
function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error(`Could not read ${file.name}`));
    reader.readAsDataURL(file);
  });
}

async function uploadAttachments(files: File[]): Promise<RequirementAttachment[]> {
  const uploaded: RequirementAttachment[] = [];
  for (const file of files) {
    const res = await uploadsRepository.upload(file.name, file.type || "application/octet-stream", await readAsDataUrl(file));
    uploaded.push({
      url: res.data.url,
      filename: res.data.filename,
      contentType: res.data.contentType,
      sizeBytes: res.data.sizeBytes,
    });
  }
  return uploaded;
}

function NewRequirementDialog({
  createRequirement,
  engineerName,
}: {
  createRequirement: (payload: {
    title: string;
    project: string;
    category: RequirementCategory;
    description: string;
    attachments: RequirementAttachment[];
    createdBy: string;
  }) => Promise<void>;
  engineerName: string;
}) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [project, setProject] = useState("");
  const [category, setCategory] = useState<RequirementCategory | "">("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [triedSubmit, setTriedSubmit] = useState(false);

  const reset = () => {
    setTitle("");
    setProject("");
    setCategory("");
    setDescription("");
    setFiles([]);
    setFileError(null);
    setTriedSubmit(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setTriedSubmit(true);
    if (!title || !project || !category || !description) return;
    // A requirement — even a draft — has to carry its supporting file.
    if (files.length === 0) {
      setFileError("Attach at least one file.");
      return;
    }
    setSubmitting(true);
    try {
      const attachments = await uploadAttachments(files);
      await createRequirement({
        title,
        project,
        category,
        description,
        attachments,
        createdBy: engineerName,
      });
      toast.success("Requirement saved as draft");
      reset();
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save requirement");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-xl">New requirement</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Draft a requirement</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <Label htmlFor="req-title">Title</Label>
            <Input
              id="req-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Curtain wall thermal performance"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Project</Label>
              <ProjectPicker value={project} onChange={setProject} className="w-full" />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select
                value={category}
                onValueChange={(v) => setCategory(v as RequirementCategory)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {REQUIREMENT_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="req-description">Description</Label>
            <Textarea
              id="req-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>
              Supporting file <span className="text-destructive">*</span>
            </Label>
            <FileListPicker
              files={files}
              onChange={(next) => {
                setFiles(next);
                if (next.length > 0) setFileError(null);
              }}
              onError={setFileError}
              disabled={submitting}
              invalid={triedSubmit && files.length === 0}
            />
            {fileError && <p role="alert" className="text-xs text-destructive">{fileError}</p>}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={submitting} className="rounded-xl">
              {submitting ? "Saving…" : "Save as draft"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function RequirementsPage() {
  const { user } = useAuth();
  const { requirements, loading, createRequirement, submitRequirement, addAttachments } = useRequirements();
  const [busyId, setBusyId] = useState<number | null>(null);

  const submitForApproval = async (r: Requirement) => {
    setBusyId(r.dbId);
    try {
      await submitRequirement(r.dbId);
      toast.success("Submitted — it's now in the Project Manager's approval queue");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit requirement");
    } finally {
      setBusyId(null);
    }
  };

  // Older drafts may have no file on record; let the engineer add one so the
  // draft can be submitted.
  const attachTo = async (r: Requirement, picked: FileList | null) => {
    if (!picked || picked.length === 0) return;
    setBusyId(r.dbId);
    try {
      await addAttachments(r, await uploadAttachments(Array.from(picked)));
      toast.success("File attached");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to attach file");
    } finally {
      setBusyId(null);
    }
  };

  const approved = RequirementService.countByStatus(requirements, "Approved");
  const underReview = RequirementService.countByStatus(requirements, "Under Review");
  const drafts = RequirementService.countByStatus(requirements, "Draft");

  return (
    <PageContainer>
      <PageHeader
        title="Requirements"
        description="Manage project requirements and specifications"
        actions={
          <NewRequirementDialog
            createRequirement={createRequirement}
            engineerName={user?.name ?? "Unknown"}
          />
        }
      />
      <PageContent className="space-y-6 p-6 md:p-8">
        <KpiStrip
          items={[
            {
              label: "Total requirements",
              value: loading ? "…" : `${requirements.length}`,
              icon: ListChecks,
              hint: "on file",
            },
            {
              label: "Approved",
              value: loading ? "…" : `${approved}`,
              icon: FileText,
              tone: "good",
            },
            {
              label: "Under review",
              value: loading ? "…" : `${underReview}`,
              icon: FileText,
              tone: underReview > 0 ? "warn" : "neutral",
            },
            {
              label: "Drafts",
              value: loading ? "…" : `${drafts}`,
              icon: FileText,
              hint: "not yet submitted",
            },
          ]}
        />

        <Card className="rounded-2xl border-border/70 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">All requirements</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-5 text-sm text-muted-foreground">Loading requirements…</div>
            ) : requirements.length === 0 ? (
              <div className="p-5 text-sm text-muted-foreground">
                No requirements drafted yet.
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {requirements.map((r) => (
                  <div key={r.id} className="space-y-1.5 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="font-mono text-xs text-muted-foreground">
                          {r.id} · {r.project} · {r.category}
                        </div>
                        <div className="text-sm font-medium">{r.title}</div>
                      </div>
                      <Badge
                        variant="outline"
                        className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                          STATUS_TONE[r.status]
                        }`}
                      >
                        {r.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{r.description}</p>
                    {r.attachments.length > 0 && (
                      <ul className="flex flex-wrap gap-2">
                        {r.attachments.map((a) => (
                          <li key={a.url}>
                            <button
                              type="button"
                              className="flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs text-primary hover:bg-muted/40"
                              onClick={() => void openFileUrl(a.url).catch((err: Error) => toast.error(err.message))}
                            >
                              <Paperclip className="h-3 w-3" /> {a.filename}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-xs text-muted-foreground">
                        {r.createdBy} · {r.updatedAgo}
                      </div>
                      {r.status === "Draft" && (
                        <div className="flex items-center gap-2">
                          {r.attachments.length === 0 && (
                            <label className="cursor-pointer text-xs text-primary hover:underline">
                              Attach a file to submit
                              <input
                                type="file"
                                className="hidden"
                                disabled={busyId === r.dbId}
                                onChange={(e) => {
                                  void attachTo(r, e.target.files);
                                  e.target.value = "";
                                }}
                              />
                            </label>
                          )}
                          <Button
                            size="sm"
                            className="h-7 rounded-lg text-xs"
                            disabled={busyId === r.dbId || r.attachments.length === 0}
                            title={r.attachments.length === 0 ? "Attach a file before submitting" : "Send to the Project Manager for approval"}
                            onClick={() => void submitForApproval(r)}
                          >
                            <Send className="h-3 w-3" /> {busyId === r.dbId ? "Working…" : "Submit for approval"}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </PageContent>
    </PageContainer>
  );
}

RequirementsPage.displayName = "RequirementsPage";