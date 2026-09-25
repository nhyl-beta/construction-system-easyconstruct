// client/src/components/workflows/workflow-submission-panel.tsx
//
// Everything that has been submitted THROUGH a workflow, in one read-only
// panel: the documents and written submissions filed at each stage, and the
// cost line items behind a budget-change request's headline amount.
//
// Before this existed a workflow carried only a title and an amount, so every
// approver after stage 1 — Consultant reviewing a design, PM signing off,
// Admin giving final approval — decided without being able to see what the
// earlier stages had actually sent. It is deliberately one component rather
// than a per-role copy: the Admin final-approval view, the PM approval view
// and the Consultant review view are all showing the same record.
import { useState } from "react";
import { FileText, Paperclip, StickyNote } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FilePreviewDialog } from "@/components/shared/file-preview-dialog";
import { ReferenceBasisBadge } from "./reference-basis-badge";
import { formatCurrency } from "@/lib/format-currency";
import { formatRelativeTime } from "@/lib/format-relative-time";
import { FEATURES } from "@/config/features";
import type {
  WorkflowAttachment,
  WorkflowLineItem,
} from "@/features/workflows/types/workflow.types";

const CATEGORY_LABELS: Record<string, string> = {
  materials: "Materials",
  labor: "Labour",
  equipment: "Equipment",
  subcontractor: "Subcontractor",
  other: "Other costs",
};

function amountOf(value: string): number {
  const n = Number(value);
  return Number.isNaN(n) ? 0 : n;
}

export function WorkflowLineItemsTable({
  lineItems,
  currency,
}: {
  lineItems: WorkflowLineItem[];
  currency?: string;
}) {
  if (lineItems.length === 0) return null;

  const totalCurrent = lineItems.reduce((sum, i) => sum + amountOf(i.currentAmount), 0);
  const totalRequested = lineItems.reduce((sum, i) => sum + amountOf(i.requestedAmount), 0);
  const totalDelta = totalRequested - totalCurrent;

  return (
    <div className="overflow-x-auto rounded-xl border border-border/70">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/70 bg-muted/40 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
            <th className="px-3 py-2">Category</th>
            <th className="px-3 py-2">Change</th>
            <th className="px-3 py-2 text-right">Current</th>
            <th className="px-3 py-2 text-right">Requested</th>
            <th className="px-3 py-2 text-right">Difference</th>
            {FEATURES.ai && <th className="px-3 py-2">Market cost</th>}
          </tr>
        </thead>
        <tbody>
          {lineItems.map((item) => {
            const delta = amountOf(item.requestedAmount) - amountOf(item.currentAmount);
            return (
              <tr key={item.id} className="border-b border-border/60 last:border-0">
                <td className="px-3 py-2.5">
                  <Badge variant="outline" className="rounded-full text-[10px]">
                    {CATEGORY_LABELS[item.category] ?? item.category}
                  </Badge>
                </td>
                <td className="px-3 py-2.5">{item.description}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">
                  {formatCurrency(amountOf(item.currentAmount), currency)}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums">
                  {formatCurrency(amountOf(item.requestedAmount), currency)}
                </td>
                <td
                  className={`px-3 py-2.5 text-right font-medium tabular-nums ${
                    delta > 0 ? "text-destructive" : delta < 0 ? "text-success" : ""
                  }`}
                >
                  {delta > 0 ? "+" : ""}
                  {formatCurrency(delta, currency)}
                </td>
                {FEATURES.ai && (
                  <td className="px-3 py-2.5">
                    {item.validation && <ReferenceBasisBadge validation={item.validation} />}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t border-border/70 bg-muted/30 font-medium">
            <td className="px-3 py-2.5" colSpan={2}>
              Total ({lineItems.length} {lineItems.length === 1 ? "change" : "changes"})
            </td>
            <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">
              {formatCurrency(totalCurrent, currency)}
            </td>
            <td className="px-3 py-2.5 text-right tabular-nums">
              {formatCurrency(totalRequested, currency)}
            </td>
            <td
              className={`px-3 py-2.5 text-right tabular-nums ${
                totalDelta > 0 ? "text-destructive" : totalDelta < 0 ? "text-success" : ""
              }`}
            >
              {totalDelta > 0 ? "+" : ""}
              {formatCurrency(totalDelta, currency)}
            </td>
            {FEATURES.ai && <td className="px-3 py-2.5" />}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

export function WorkflowAttachmentList({
  attachments,
}: {
  attachments: WorkflowAttachment[];
}) {
  const [preview, setPreview] = useState<WorkflowAttachment | null>(null);

  if (attachments.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
        Nothing has been submitted against this workflow yet.
      </p>
    );
  }

  return (
    <>
      <ul className="space-y-2">
        {attachments.map((attachment) => {
          const isDocument = attachment.kind === "document" && attachment.fileUrl;
          const Icon = isDocument ? FileText : StickyNote;

          return (
            <li key={attachment.id} className="rounded-xl border border-border/70 bg-card p-3">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary/60 text-secondary-foreground">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{attachment.label}</span>
                    {attachment.stageLabel && (
                      <Badge variant="outline" className="rounded-full text-[10px]">
                        {attachment.stageLabel}
                      </Badge>
                    )}
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {attachment.uploadedBy}
                    {attachment.createdAt && ` · ${formatRelativeTime(attachment.createdAt)}`}
                    {attachment.fileSize && ` · ${attachment.fileSize}`}
                  </div>
                  {attachment.content && (
                    <p className="mt-2 whitespace-pre-wrap rounded-lg bg-muted/60 px-3 py-2 text-sm leading-6">
                      {attachment.content}
                    </p>
                  )}
                </div>
                {isDocument && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 shrink-0 rounded-lg text-xs"
                    onClick={() => setPreview(attachment)}
                  >
                    <Paperclip className="h-3.5 w-3.5" /> View file
                  </Button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <FilePreviewDialog
        open={preview !== null}
        onOpenChange={(open) => !open && setPreview(null)}
        url={preview?.fileUrl}
        title={preview?.fileName ?? preview?.label ?? "Attachment"}
        description={
          preview
            ? [preview.stageLabel, preview.uploadedBy, preview.fileSize]
                .filter(Boolean)
                .join(" · ")
            : undefined
        }
      />
    </>
  );
}
