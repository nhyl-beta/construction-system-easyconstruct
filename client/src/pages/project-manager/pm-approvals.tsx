// src/pages/project-manager/pm-approvals.tsx
import { useState } from "react";
import {
  FileCheck2,
  Clock,
  CheckCircle2,
  XCircle,
  Filter,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge }             from "@/components/ui/badge";
import { Button }            from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  approvalStats,
  approvalItems,
  type ApprovalTab,
} from "@/providers/mock-data";

// ─────────────────────────────────────────────────────────────────────────────
// Tone map
// ─────────────────────────────────────────────────────────────────────────────

const SEVERITY_TONE: Record<string, string> = {
  high:   "bg-destructive/10 text-destructive border-destructive/20",
  medium: "bg-warning/15 text-warning-foreground border-warning/30",
  low:    "bg-muted text-muted-foreground border-border",
};

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function ApprovalsPage() {
  const [tab, setTab] = useState<ApprovalTab>("pending");

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8">

      {/* ── Stat strip ── */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {approvalStats.map((s) => (
          <Card key={s.label} className="rounded-2xl border-border/70 shadow-sm">
            <CardContent className="space-y-1 p-4">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                {s.label}
              </div>
              <div className={`text-2xl font-semibold tabular-nums ${s.tone}`}>
                {s.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Tabs value={tab} onValueChange={(v) => setTab(v as ApprovalTab)}>
          <TabsList className="h-10 rounded-xl">
            <TabsTrigger value="pending" className="rounded-lg">Pending (12)</TabsTrigger>
            <TabsTrigger value="mine"    className="rounded-lg">Awaiting me (5)</TabsTrigger>
            <TabsTrigger value="history" className="rounded-lg">History</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="rounded-xl">
            <Filter className="h-4 w-4" /> Filters
          </Button>
          <Button variant="outline" size="sm" className="rounded-xl">
            Bulk approve
          </Button>
        </div>
      </div>

      {/* ── Approval items ── */}
      <div className="space-y-2">
        {approvalItems.map((a) => (
          <Card key={a.id} className="rounded-2xl border-border/70 shadow-sm">
            <CardContent className="p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

                {/* Left — identity */}
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary/60 text-secondary-foreground">
                    <FileCheck2 className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    {/* Title row */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[11px] text-muted-foreground">{a.id}</span>
                      <span className="font-medium">{a.title}</span>
                      <Badge
                        variant="outline"
                        className={`rounded-full px-2 py-0.5 text-[10px] ${SEVERITY_TONE[a.severity]}`}
                      >
                        {a.severity}
                      </Badge>
                    </div>

                    {/* Meta row */}
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span>{a.project}</span>
                      <span>·</span>
                      <span>{a.type}</span>
                      <span>·</span>
                      <span>{a.owner}</span>
                      <span>·</span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {a.age} old
                      </span>
                    </div>

                    {/* AI note */}
                    <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-ai-soft/40 p-2 text-xs text-muted-foreground">
                      <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-ai" />
                      <span>
                        <span className="font-medium text-ai">AI:</span> {a.aiNote}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right — amount + actions */}
                <div className="flex items-center gap-2 md:flex-col md:items-end">
                  <span className="text-sm font-medium tabular-nums">{a.amount}</span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="h-8 rounded-lg">
                      <XCircle className="h-3.5 w-3.5" /> Reject
                    </Button>
                    <Button size="sm" className="h-8 rounded-lg">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 rounded-lg">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}