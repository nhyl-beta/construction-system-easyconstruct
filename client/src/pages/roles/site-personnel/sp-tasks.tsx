import { CheckSquare, Clock, ListTodo, Plus, ShieldAlert } from "lucide-react";

import { PageContainer } from "@/components/refine-ui/views/page-container";
import { PageHeader } from "@/components/refine-ui/views/page-header";
import { PageContent } from "@/components/refine-ui/views/page-content";
import { Card, CardContent } from "@/components/ui/card";
import { KpiStrip } from "@/components/ui/kpi-strip";
import { StatusBadge } from "@/components/ui/status-badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/auth/auth-context";
import { useUsersByRole } from "@/features/users/hooks/use-users-by-role";
import { useMyTasks } from "@/features/tasks/hooks/use-my-tasks";
import { CompleteTaskDialog } from "@/components/tasks/complete-task-dialog";
import { ProjectPicker } from "@/components/shared/project-picker";
import { isRealFileUrl, openFileUrl } from "@/lib/file-url";
import { formatRelativeTime } from "@/lib/format-relative-time";
import type { TaskRecord } from "@/features/tasks/repositories/task.repository";
import { useState } from "react";

const NEXT_LABEL: Record<string, string> = {
  Pending: "Start task",
  "In Progress": "Mark complete",
};

export default function TasksPage() {
  const { tasks, counts, loading, error, updatingId, advance, createTask, creating } =
    useMyTasks();
  const { user } = useAuth();

  // Mirrors the backend's route gates: POST /tasks is project-manager +
  // engineer, PATCH /tasks/:id/status is site-personnel only. Showing the
  // control the caller can't use just produces a 403 mid-demo.
  const canCreate = user?.role === "project-manager" || user?.role === "engineer";
  const canAdvance = user?.role === "site-personnel";

  // Completing needs evidence (note + optional attachment), so that
  // transition goes through a dialog; starting a task is still a direct flip.
  const [completing, setCompleting] = useState<TaskRecord | null>(null);

  return (
    <PageContainer>
      <PageHeader
        title="Tasks"
        description={
          canCreate
            ? "Assign field tasks to a project — Site Personnel picks them up and updates their status here"
            : "Your assigned field tasks — updates here are visible to Engineering and Admin"
        }
      />
      <PageContent className="space-y-6 p-6 md:p-8">
        <KpiStrip
          items={[
            { label: "Total", value: loading ? "…" : `${counts.total}`, icon: ListTodo },
            { label: "Pending", value: loading ? "…" : `${counts.pending}`, icon: Clock, tone: counts.pending > 0 ? "warn" : "neutral" },
            { label: "In progress", value: loading ? "…" : `${counts.inProgress}`, icon: Clock },
            { label: "Overdue", value: loading ? "…" : `${counts.overdue}`, icon: ShieldAlert, tone: counts.overdue > 0 ? "bad" : "neutral" },
          ]}
        />

        {canCreate && <NewTaskCard onCreate={createTask} creating={creating} />}

        <Card className="rounded-2xl border-border/70 shadow-sm">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-5 text-sm text-muted-foreground">Loading tasks…</div>
            ) : error ? (
              <div className="p-5 text-sm text-destructive">Couldn't load tasks. {error}</div>
            ) : tasks.length === 0 ? (
              <div className="p-5 text-sm text-muted-foreground">
                No tasks assigned to you yet.
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {tasks.map((t) => {
                  const nextLabel = NEXT_LABEL[t.status];
                  return (
                    <div key={t.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <div className="font-mono text-xs text-muted-foreground">
                          {t.taskCode} · {t.projectCode}
                        </div>
                        <div className="truncate text-sm font-medium">{t.title}</div>
                        {t.description && (
                          <p className="mt-0.5 max-w-lg text-xs text-muted-foreground">{t.description}</p>
                        )}
                        {/* Engineers (and PMs) send tasks TO Site Personnel
                            but couldn't see who a task actually went to, or
                            when it moved — the row showed the same thing to
                            everyone regardless of role. This is the
                            status/history view: who it's assigned to, when
                            it was raised, and when it was completed. */}
                        {canCreate && (
                          <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground">
                            <span>
                              Assigned to{" "}
                              <span className="font-medium text-foreground">
                                {t.assignedToName ?? "Unassigned"}
                              </span>
                            </span>
                            <span>·</span>
                            <span>Created {formatRelativeTime(t.createdAt)}</span>
                            {t.completedAt && (
                              <>
                                <span>·</span>
                                <span>Completed {formatRelativeTime(t.completedAt)}</span>
                              </>
                            )}
                          </p>
                        )}
                        {t.completionNote && (
                          <p className="mt-1 max-w-lg text-xs text-muted-foreground">
                            <span className="font-medium text-foreground">Completed:</span>{" "}
                            {t.completionNote}
                            {isRealFileUrl(t.completionFileUrl) && (
                              <>
                                {" · "}
                                <button
                                  type="button"
                                  className="text-primary underline-offset-2 hover:underline"
                                  onClick={() => openFileUrl(t.completionFileUrl)}
                                >
                                  attachment
                                </button>
                              </>
                            )}
                          </p>
                        )}
                        <div className="mt-2 flex items-center gap-2">
                          <Progress value={t.progress} className="h-1.5 w-32" />
                          <span className="text-xs tabular-nums text-muted-foreground">{t.progress}%</span>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <StatusBadge status={t.priority} />
                        <StatusBadge status={t.status} />
                        {canAdvance && nextLabel && (
                          <Button
                            size="sm"
                            className="h-8 rounded-lg"
                            disabled={updatingId === t.id}
                            onClick={() =>
                              t.status === "In Progress"
                                ? setCompleting(t)
                                : void advance(t).catch(() => {})
                            }
                          >
                            <CheckSquare className="h-3.5 w-3.5" />
                            {updatingId === t.id ? "Saving…" : nextLabel}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </PageContent>

      <CompleteTaskDialog
        task={completing}
        onOpenChange={(open) => !open && setCompleting(null)}
        onConfirm={(task, completion) => advance(task, completion)}
      />
    </PageContainer>
  );
}

TasksPage.displayName = "TasksPage";

// ── New task (Project Manager / Engineer) ────────────────────────────────────

function NewTaskCard({
  onCreate,
  creating,
}: {
  onCreate: (input: {
    taskCode: string;
    projectCode: string;
    title: string;
    description?: string;
    priority?: string;
    status?: string;
    dueDate?: string;
    assignedToUserId?: number;
    assignedToName?: string;
  }) => Promise<boolean>;
  creating: boolean;
}) {
  const { users: sitePersonnel, loading: loadingAssignees } =
    useUsersByRole("site-personnel");
  const [assignee, setAssignee] = useState("");
  const [projectCode, setProjectCode] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [dueDate, setDueDate] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [created, setCreated] = useState<string | null>(null);

  const submit = async () => {
    setLocalError(null);
    setCreated(null);
    if (!projectCode.trim() || !title.trim()) {
      setLocalError("Project code and title are required.");
      return;
    }
    // The backend only lets Site Personnel advance tasks assigned to them
    // (tasks/service.ts updateStatus), so an unassigned task is a dead end.
    if (!assignee) {
      setLocalError("Assign the task to a Site Personnel account.");
      return;
    }
    const assigned = sitePersonnel.find((u) => String(u.id) === assignee);
    // taskCode is required and unique on the backend; generating it here keeps
    // the form to the fields a PM/Engineer actually cares about.
    const taskCode = `TSK-${Date.now().toString().slice(-6)}`;
    const ok = await onCreate({
      taskCode,
      projectCode: projectCode.trim(),
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      status: "Pending",
      dueDate: dueDate || undefined,
      assignedToUserId: Number(assignee),
      assignedToName: assigned?.name,
    });
    if (ok) {
      setCreated(taskCode);
      setTitle("");
      setDescription("");
      setDueDate("");
    }
  };

  return (
    <Card className="rounded-2xl border-border/70 shadow-sm">
      <CardContent className="space-y-4 p-5">
        <div>
          <h2 className="text-sm font-semibold">New task</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Creates a Pending task against a project. Site Personnel advances it
            to In Progress and Completed.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Project</Label>
            {/* Was a free-text "project code" box — a typo produced a task
                that matched no real project, so it never showed up in any
                project-scoped view. Same picker the rest of the app uses,
                backed by /api/projects. */}
            <ProjectPicker
              value={projectCode}
              onChange={setProjectCode}
              className="w-full"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="task-title">Title</Label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Pour foundation slab section B"
              className="rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Assign to</Label>
            <Select value={assignee} onValueChange={setAssignee}>
              <SelectTrigger className="rounded-xl">
                <SelectValue
                  placeholder={loadingAssignees ? "Loading…" : "Select Site Personnel"}
                />
              </SelectTrigger>
              <SelectContent>
                {sitePersonnel.length === 0 && !loadingAssignees && (
                  <div className="px-2 py-1.5 text-xs text-muted-foreground">
                    No Site Personnel accounts on file
                  </div>
                )}
                {sitePersonnel.map((u) => (
                  <SelectItem key={u.id} value={String(u.id)}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Priority</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="High">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="task-due">Due date</Label>
            <DatePicker
              id="task-due"
              value={dueDate}
              onChange={setDueDate}
              placeholder="Select due date"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="task-desc">Description</Label>
          <Textarea
            id="task-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What needs doing on site?"
            className="h-20 resize-none rounded-xl"
          />
        </div>

        {localError && <p className="text-sm text-destructive">{localError}</p>}
        {created && (
          <p className="text-sm text-muted-foreground">
            Created <span className="font-mono">{created}</span>.
          </p>
        )}

        <Button
          className="rounded-xl"
          onClick={() => void submit()}
          disabled={creating}
        >
          <Plus className="h-4 w-4" />
          {creating ? "Creating…" : "Create task"}
        </Button>
      </CardContent>
    </Card>
  );
}
