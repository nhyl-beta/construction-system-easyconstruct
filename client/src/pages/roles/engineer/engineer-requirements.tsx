import { useState, type FormEvent } from "react";
import { FileText, ListChecks } from "lucide-react";

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
import { useRequirements } from "@/features/requirements/hooks/useRequirements";
import {
  REQUIREMENT_CATEGORIES,
  type RequirementCategory,
} from "@/features/requirements/types/requirements.types";
import { RequirementService } from "@/features/requirements/services/requirement.service";
import { useAuth } from "@/auth/auth-context";

const STATUS_TONE: Record<string, string> = {
  Draft: "bg-muted text-muted-foreground border-border",
  "Under Review": "bg-warning/15 text-warning-foreground border-warning/30",
  Approved: "bg-success/10 text-success border-success/20",
  Rejected: "bg-destructive/10 text-destructive border-destructive/20",
};

function NewRequirementDialog({
  createRequirement,
  engineerName,
}: {
  createRequirement: (payload: {
    title: string;
    project: string;
    category: RequirementCategory;
    description: string;
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

  const reset = () => {
    setTitle("");
    setProject("");
    setCategory("");
    setDescription("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title || !project || !category || !description) return;
    setSubmitting(true);
    try {
      await createRequirement({
        title,
        project,
        category,
        description,
        createdBy: engineerName,
      });
      reset();
      setOpen(false);
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
  const { requirements, loading, createRequirement } = useRequirements();

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
                    <div className="text-xs text-muted-foreground">
                      {r.createdBy} · {r.updatedAgo}
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