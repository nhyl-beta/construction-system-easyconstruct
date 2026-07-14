// src/pages/project-manager/pm-workflows.tsx
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  activeWorkflows,
  workflowAISuggestions,
  workflowTemplates,
  type WorkflowStageIconKey,
} from "@/providers/mock-data";
import {
  CheckCircle2,
  ChevronRight,
  Clock,
  FileSignature,
  GitBranch,
  Plus,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Wallet,
  type LucideIcon,
} from "lucide-react";

// ─── Icon resolver ────────────────────────────────────────────────────────────
// Keeps icons out of mock-data.ts (no React/JSX in data files)

const WORKFLOW_STAGE_ICONS: Record<WorkflowStageIconKey, LucideIcon> = {
  UserCheck: UserCheck,
  Wallet: Wallet,
  ShieldCheck: ShieldCheck,
  FileSignature: FileSignature,
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WorkflowsPage() {
  return (
    <div className="flex-1 space-y-6 p-4 md:p-8">
      {/* ── Page header ── */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Workflow builder
          </h2>
          <p className="text-sm text-muted-foreground">
            Configure how documents, approvals, and decisions flow across
            departments.
          </p>
        </div>
        <Button className="rounded-xl">
          <Plus className="h-4 w-4" />
          New workflow
        </Button>
      </div>

      {/* ── Tabs ── */}
      <Tabs defaultValue="templates" className="space-y-5">
        <TabsList className="h-10 rounded-xl">
          <TabsTrigger value="templates" className="rounded-lg">
            Templates
          </TabsTrigger>
          <TabsTrigger value="active" className="rounded-lg">
            Active pipeline
          </TabsTrigger>
          <TabsTrigger value="ai" className="rounded-lg">
            AI suggestions
          </TabsTrigger>
        </TabsList>

        {/* ── Templates tab ── */}
        <TabsContent
          value="templates"
          className="grid grid-cols-1 gap-4 md:grid-cols-2"
        >
          {workflowTemplates.map((t) => (
            <Card
              key={t.name}
              className="rounded-2xl border-border/70 shadow-sm"
            >
              <CardContent className="space-y-3 p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                      <GitBranch className="h-4 w-4" />
                    </div>
                    <h3 className="font-medium leading-tight">{t.name}</h3>
                  </div>
                  <Badge variant="outline" className="rounded-full text-[10px]">
                    {t.active} active
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{t.desc}</p>
                <div className="flex items-center justify-between border-t border-border/60 pt-3 text-xs">
                  <span className="text-muted-foreground">
                    {t.stages} stages · avg {t.avg}
                  </span>
                  <Button variant="ghost" size="sm" className="rounded-lg">
                    Edit <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* ── Active pipeline tab ── */}
        <TabsContent value="active" className="space-y-4">
          {activeWorkflows.map((workflow) => (
            <Card
              key={workflow.id}
              className="rounded-2xl border-border/70 shadow-sm"
            >
              <CardHeader>
                <CardTitle className="text-base">
                  {workflow.id} · {workflow.title}
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {workflow.project} · {workflow.amount} · {workflow.template}
                </p>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3 md:flex-row md:items-stretch">
                  {workflow.pipeline.map((stage, i) => {
                    const Icon = WORKFLOW_STAGE_ICONS[stage.iconKey];
                    return (
                      <div
                        key={stage.role}
                        className="flex flex-1 items-center gap-3"
                      >
                        <div
                          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 ${
                            stage.status === "done"
                              ? "border-success bg-success/10 text-success"
                              : stage.status === "current"
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border bg-muted text-muted-foreground"
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              {stage.role}
                            </span>
                            {stage.status === "done" && (
                              <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                            )}
                            {stage.status === "current" && (
                              <Clock className="h-3.5 w-3.5 text-primary" />
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {stage.who} · {stage.when}
                          </div>
                        </div>
                        {i < workflow.pipeline.length - 1 && (
                          <ChevronRight className="hidden h-4 w-4 shrink-0 text-muted-foreground md:block" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* ── AI suggestions tab ── */}
        <TabsContent value="ai">
          <Card className="rounded-2xl border-ai/20 bg-gradient-to-br from-ai-soft/60 to-card shadow-sm">
            <CardHeader>
              <Badge
                variant="outline"
                className="w-fit rounded-full border-ai/30 bg-ai/10 px-2.5 py-0.5 text-[11px] text-ai"
              >
                <Sparkles className="mr-1 h-3 w-3" />
                AI workflow suggestions
              </Badge>
              <CardTitle className="text-base">
                {workflowAISuggestions.length} recommended improvements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {workflowAISuggestions.map((s, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-border/60 bg-card p-4"
                >
                  <div className="text-sm font-medium">{s.title}</div>
                  <p className="mt-1 text-xs text-muted-foreground">{s.desc}</p>
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" className="rounded-lg">
                      Apply
                    </Button>
                    <Button size="sm" variant="ghost" className="rounded-lg">
                      Dismiss
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
