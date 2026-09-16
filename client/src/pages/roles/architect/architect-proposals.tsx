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
                Project Code
              </label>

              <Input
                value={projectCode}
                onChange={(event) =>
                  setProjectCode(
                    event.target.value,
                  )
                }
                placeholder="PRJ-001"
                className="mt-2"
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>

              <TableHead>Title</TableHead>

              <TableHead>Project</TableHead>

              <TableHead>
                Submitted by
              </TableHead>

              <TableHead className="text-right">
                Amount
              </TableHead>

              <TableHead>Status</TableHead>

              <TableHead>Review</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {c.loading ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-24 text-center"
                >
                  Loading proposals...
                </TableCell>
              </TableRow>
            ) : c.proposals.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-24 text-center text-muted-foreground"
                >
                  No proposals found.
                </TableCell>
              </TableRow>
            ) : (
              c.proposals.map((proposal) => (
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