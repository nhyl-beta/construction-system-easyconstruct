import { useState } from "react";

import {
  Clock,
  FileText,
  Plus,
  Send,
} from "lucide-react";

import { PageHeader } from "@/components/refine-ui/views/page-header";

import { KpiStrip } from "@/components/ui/kpi-strip";

import { StatusBadge } from "@/components/ui/status-badge";

import { Input } from "@/components/ui/input";

import { Textarea } from "@/components/ui/textarea";

import { Button } from "@/components/ui/button";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { useProposals } from "@/features/proposals/hooks/useProposals";
import { ProjectPicker } from "@/components/shared/project-picker";
import { AlertTriangle, Archive, CheckCircle2, Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import type { Proposal } from "@/features/proposals/types/proposal.types";
import type { UpdateProposalInput } from "@/features/proposals/controllers/proposal.controller";

interface ValidationResult {
  passed: boolean;
  issues: string[];
  warnings: string[];
}

function parseValidation(raw: string | null): ValidationResult | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ValidationResult;
  } catch {
    return null;
  }
}

function ValidationSummary({ raw }: { raw: string | null }) {
  const result = parseValidation(raw);
  if (!result) return <span className="text-muted-foreground">—</span>;

  return (
    <div className="space-y-1 text-xs">
      <div className={`flex items-center gap-1 font-medium ${result.passed ? "text-success" : "text-destructive"}`}>
        {result.passed ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
        Rule-based validation — human review required
      </div>
      {result.issues.map((i) => (
        <div key={i} className="text-destructive">
          • {i}
        </div>
      ))}
      {result.warnings.map((w) => (
        <div key={w} className="text-muted-foreground">
          • {w}
        </div>
      ))}
    </div>
  );
}

function EditProposalDialog({
  proposal,
  saving,
  onUpdate,
}: {
  proposal: Proposal;
  saving: boolean;
  onUpdate: (id: number, input: UpdateProposalInput) => Promise<Proposal | null>;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(proposal.title);
  const [projectCode, setProjectCode] = useState(proposal.projectCode);
  const [amount, setAmount] = useState(proposal.amount ?? "");
  const [content, setContent] = useState(proposal.content ?? "");

  const handleOpenChange = (next: boolean) => {
    if (next) {
      // Re-sync from the current row each time it's opened, in case a
      // background refresh updated the proposal since the last edit.
      setTitle(proposal.title);
      setProjectCode(proposal.projectCode);
      setAmount(proposal.amount ?? "");
      setContent(proposal.content ?? "");
    }
    setOpen(next);
  };

  const handleSubmit = async () => {
    const updated = await onUpdate(proposal.id, {
      title: title.trim(),
      projectCode,
      amount: amount.trim() || undefined,
      content: content.trim() || undefined,
    });
    if (updated) setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" title="Edit proposal">
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit proposal</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Project</Label>
            <ProjectPicker value={projectCode} onChange={setProjectCode} className="w-full" />
          </div>
          <div className="space-y-1.5">
            <Label>Estimated amount</Label>
            <Input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="₱500,000" />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea value={content} onChange={(e) => setContent(e.target.value)} className="min-h-24" />
          </div>
        </div>
        <DialogFooter>
          <Button disabled={!title.trim() || !projectCode || saving} onClick={handleSubmit}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function ArchitectProposals() {
  const c = useProposals();

  const [showCreateForm, setShowCreateForm] =
    useState(false);

  const [title, setTitle] = useState("");

  const [projectCode, setProjectCode] =
    useState("");

  const [amount, setAmount] =
    useState("");

  const [content, setContent] =
    useState("");

  const [formError, setFormError] =
    useState<string | null>(null);

  async function handleSubmit() {
    setFormError(null);

    if (!title.trim()) {
      setFormError(
        "Please enter a proposal title.",
      );

      return;
    }

    if (!projectCode.trim()) {
      setFormError(
        "Please enter a project code.",
      );

      return;
    }

    const result = await c.createProposal({
      proposalId: `PROP-${Date.now()}`,

      title: title.trim(),

      projectCode: projectCode.trim(),

      submittedBy: "Architect",

      amount: amount.trim() || undefined,

      content: content.trim() || undefined,

      assignedReviewer: "consultant",
    });

    if (!result) {
      return;
    }

    setTitle("");
    setProjectCode("");
    setAmount("");
    setContent("");

    setShowCreateForm(false);
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8">
      <PageHeader
        title="Proposals"
        description="Design proposals submitted against active projects."
      />

      <KpiStrip
        items={[
          {
            label: "Total proposals",
            value: `${c.kpis.total}`,
            icon: FileText,
          },
          {
            label: "Pending",
            value: `${c.kpis.pending}`,
            icon: Clock,
            tone: "warn",
          },
        ]}
      />

      <div className="flex items-center justify-between">
        <div />

        <Button
          onClick={() =>
            setShowCreateForm(
              (current) => !current,
            )
          }
        >
          <Plus className="mr-2 h-4 w-4" />

          New Proposal
        </Button>
      </div>

      {showCreateForm && (
        <div className="rounded-2xl border p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">
              Create Proposal
            </h2>

            <p className="text-sm text-muted-foreground">
              Submit a design proposal for consultant
              review.
            </p>
          </div>

          {formError && (
            <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {formError}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium">
                Proposal Title
              </label>

              <Input
                value={title}
                onChange={(event) =>
                  setTitle(event.target.value)
                }
                placeholder="Structural Design Proposal"
                className="mt-2"
              />
            </div>

            <div>
              <label className="text-sm font-medium">
                Project
              </label>

              <ProjectPicker
                value={projectCode}
                onChange={setProjectCode}
                className="mt-2 w-full"
              />
            </div>

            <div>
              <label className="text-sm font-medium">
                Estimated Amount
              </label>

              <Input
                value={amount}
                onChange={(event) =>
                  setAmount(event.target.value)
                }
                placeholder="₱500,000"
                className="mt-2"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="text-sm font-medium">
              Proposal Description
            </label>

            <Textarea
              value={content}
              onChange={(event) =>
                setContent(event.target.value)
              }
              placeholder="Describe the proposal, design considerations, materials, scope, and other relevant information."
              className="mt-2 min-h-32"
            />
          </div>

          <div className="mt-6 flex gap-2">
            <Button
              disabled={c.saving}
              onClick={handleSubmit}
            >
              <Send className="mr-2 h-4 w-4" />

              {c.saving
                ? "Submitting..."
                : "Submit for Consultant Review"}
            </Button>

            <Button
              variant="ghost"
              disabled={c.saving}
              onClick={() =>
                setShowCreateForm(false)
              }
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="rounded-2xl border">
        <Table className="table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">ID</TableHead>

              <TableHead className="w-48">Title</TableHead>

              <TableHead className="w-28">Project</TableHead>

              <TableHead className="w-36">
                Submitted by
              </TableHead>

              <TableHead className="w-28 text-right">
                Amount
              </TableHead>

              <TableHead className="w-32">Status</TableHead>

              <TableHead className="w-56">Validation</TableHead>

              <TableHead className="w-56">Review</TableHead>

              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>

          <TableBody>
            {c.loading ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="h-24 text-center"
                >
                  Loading proposals...
                </TableCell>
              </TableRow>
            ) : c.proposals.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="h-24 text-center text-muted-foreground"
                >
                  No proposals found.
                </TableCell>
              </TableRow>
            ) : (
              c.proposals
                .filter((proposal) => proposal.status !== "Archived")
                .map((proposal) => (
                <TableRow key={proposal.id}>
                  <TableCell className="font-mono text-xs">
                    {proposal.proposalId}
                  </TableCell>

                  <TableCell className="text-sm font-medium">
                    {proposal.title}
                  </TableCell>

                  <TableCell className="text-sm text-muted-foreground">
                    {proposal.projectCode}
                  </TableCell>

                  <TableCell className="text-xs text-muted-foreground">
                    {proposal.submittedBy}
                  </TableCell>

                  <TableCell className="text-right text-sm">
                    {proposal.amount ?? "—"}
                  </TableCell>

                  <TableCell>
                    <StatusBadge
                      status={proposal.status}
                    />
                  </TableCell>

                  <TableCell className="max-w-xs">
                    <ValidationSummary raw={proposal.aiValidation} />
                  </TableCell>

                  <TableCell className="max-w-xs text-sm">
                    {proposal.reviewComment ? (
                      <div>
                        <p className="line-clamp-2">
                          {proposal.reviewComment}
                        </p>

                        {proposal.reviewerName && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            By {proposal.reviewerName}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">
                        —
                      </span>
                    )}
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-1">
                      {!proposal.reviewedAt && !proposal.reviewComment && (
                        <EditProposalDialog
                          proposal={proposal}
                          saving={c.saving}
                          onUpdate={c.updateProposal}
                        />
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg"
                        disabled={c.saving}
                        title="Archive"
                        onClick={() => c.archiveProposal(proposal.id)}
                      >
                        <Archive className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

ArchitectProposals.displayName =
  "ArchitectProposals";