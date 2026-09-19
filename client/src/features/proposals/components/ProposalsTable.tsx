import { StatusBadge } from "@/components/ui/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Proposal } from "../types/proposal.types";

interface ProposalsTableProps {
  proposals: Proposal[];
  /** Highlights the row and makes it clickable, for review screens. */
  selectedId?: number | null;
  onSelect?: (proposal: Proposal) => void;
}

// Shared read view of the proposals register, used by Owner's executive table
// and IT Designer's oversight table.
//
// Long free-text columns (title, review comment) wrap rather than truncate:
// a proposal title clipped to one line is unreadable precisely where a
// reviewer needs to tell two similar submissions apart. `break-words` covers
// the unbroken-string case (pasted refs, long codes) that `whitespace-normal`
// alone would let overflow the cell.
export function ProposalsTable({
  proposals,
  selectedId,
  onSelect,
}: ProposalsTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border/70">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[22%]">Proposal</TableHead>
            <TableHead className="w-[12%]">Project</TableHead>
            <TableHead className="w-[14%]">Submitted by</TableHead>
            <TableHead className="w-[12%]">Amount</TableHead>
            <TableHead className="w-[12%]">Status</TableHead>
            <TableHead className="w-[14%]">Reviewer</TableHead>
            <TableHead className="w-[14%]">Comment</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {proposals.map((p) => (
            <TableRow
              key={p.id}
              onClick={onSelect ? () => onSelect(p) : undefined}
              className={[
                onSelect ? "cursor-pointer" : "",
                selectedId === p.id ? "bg-muted/60" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <TableCell className="align-top">
                <div className="whitespace-normal break-words text-sm font-medium">
                  {p.title}
                </div>
                <div className="font-mono text-[11px] text-muted-foreground">
                  {p.proposalId}
                </div>
              </TableCell>
              <TableCell className="align-top font-mono text-xs text-muted-foreground">
                {p.projectCode}
              </TableCell>
              <TableCell className="align-top whitespace-normal break-words text-xs">
                {p.submittedBy}
              </TableCell>
              <TableCell className="align-top text-xs tabular-nums">
                {p.amount ?? "—"}
              </TableCell>
              <TableCell className="align-top">
                <StatusBadge status={p.status} />
              </TableCell>
              <TableCell className="align-top whitespace-normal break-words text-xs text-muted-foreground">
                {p.reviewerName ?? "—"}
              </TableCell>
              <TableCell className="align-top whitespace-normal break-words text-xs text-muted-foreground">
                {p.reviewComment ?? "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

ProposalsTable.displayName = "ProposalsTable";
