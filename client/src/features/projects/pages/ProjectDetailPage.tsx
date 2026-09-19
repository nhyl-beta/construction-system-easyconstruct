import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProjectRepository } from "@/features/projects/repositories/project.repository";
import { RISK_LEVELS, type Project } from "@/features/projects/types/project.types";
import { useProjectMembers } from "@/features/project-members/hooks/use-project-members";
import type { ProjectMemberRole } from "@/features/project-members/repositories/project-member.repository";
import { useUsersByRole } from "@/features/users/hooks/use-users-by-role";
import { ArrowLeft, HardHat, Loader2, Trash2, UserPlus, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useAuth } from "@/auth/auth-context";

export default function ProjectDetailPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  // Engineer is read-only on the record as a whole but owns progress
  // reporting — the backend enforces exactly this split (projects/service.ts
  // assertCanUpdateProject) and refuses an Engineer PATCH of any other field,
  // so the form must not offer one.
  const isEngineer = user?.role === "engineer";
  const readOnly = isEngineer;
  const canEditProgress = !readOnly || isEngineer;
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    ProjectRepository.getById(projectId ?? "")
      .then((result) => {
        if (active) {
          setProject(result);
          if (!result) setError("Project not found.");
        }
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : "Failed to load project.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [projectId]);

  const update = <K extends keyof Project>(key: K, value: Project[K]) => {
    setProject((current) => (current ? { ...current, [key]: value } : current));
  };

  // Sends only `progress` — an Engineer PATCH carrying any other field is
  // rejected by the API, so the payload has to match the grant exactly.
  const saveProgress = async () => {
    if (!project) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await ProjectRepository.patch(project.code, { progress: project.progress });
      setMessage("Progress updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update progress.");
    } finally {
      setSaving(false);
    }
  };

  const save = async () => {
    if (!project) return;
    if (!project.name.trim() || !project.code.trim() || !project.due.trim()) {
      setError("Name, code, and due date are required.");
      return;
    }
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const updated = await ProjectRepository.patch(project.code, {
        name: project.name.trim(),
        code: project.code.trim(),
        client: project.client,
        location: project.location,
        status: project.status,
        statusTone: project.statusTone,
        progress: project.progress,
        budget: project.budget,
        contractValue: project.contractValue,
        workforce: project.workforce,
        due: project.due,
        risk: project.risk,
        description: project.description,
      });
      if (!updated) throw new Error("Project could not be updated.");
      setProject(updated);
      setMessage("Project saved.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save project.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!project || !window.confirm(`Delete ${project.name}?`)) return;
    setDeleting(true);
    setError(null);
    try {
      const deleted = await ProjectRepository.delete(project.code);
      if (!deleted) throw new Error("Project could not be deleted.");
      navigate("/projects");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete project.");
      setDeleting(false);
    }
  };

  if (loading) return <div className="p-8 text-sm text-muted-foreground">Loading project…</div>;
  if (!project) {
    return (
      <div className="space-y-4 p-8">
        <p className="text-sm text-destructive">{error ?? "Project not found."}</p>
        <Button asChild variant="outline"><Link to="/projects">Back to projects</Link></Button>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8">
      <Button asChild variant="ghost" className="rounded-xl">
        <Link to="/projects"><ArrowLeft className="mr-2 h-4 w-4" />Back to projects</Link>
      </Button>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{project.name}</h1>
          <p className="text-sm text-muted-foreground">{project.code}</p>
        </div>
        {!readOnly && (
          <Button variant="destructive" onClick={remove} disabled={saving || deleting}>
            {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
            Delete
          </Button>
        )}
      </div>
      {error && <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}
      {message && <div className="rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-700">{message}</div>}
      <div className="grid max-w-4xl grid-cols-1 gap-5 rounded-2xl border border-border bg-card p-6 md:grid-cols-2">
        <Field label="Project name"><Input readOnly={readOnly} value={project.name} onChange={(e) => update("name", e.target.value)} /></Field>
        <Field label="Project code"><Input readOnly={readOnly} value={project.code} onChange={(e) => update("code", e.target.value)} /></Field>
        <Field label="Client"><Input readOnly={readOnly} value={project.client} onChange={(e) => update("client", e.target.value)} /></Field>
        <Field label="Location"><Input readOnly={readOnly} value={project.location} onChange={(e) => update("location", e.target.value)} /></Field>
        <Field label="Status"><Input readOnly={readOnly} value={project.status} onChange={(e) => update("status", e.target.value)} /></Field>
        {/* Risk was a free-text Input, so any spelling ("hi", "Severe") could
            be typed here; the value drives risk sorting on the Admin/PM/Owner
            dashboards and the backend enum only accepts Low/Medium/High, so a
            typo either failed the save or produced a project that sorted as
            "low" forever. Constrained to the same three levels the New
            Project form offers. */}
        <Field label="Risk">
          <Select
            value={project.risk}
            disabled={readOnly}
            onValueChange={(v) => update("risk", v as Project["risk"])}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {RISK_LEVELS.map((level) => (
                <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Progress (%)"><Input readOnly={!canEditProgress} type="number" min="0" max="100" value={project.progress} onChange={(e) => update("progress", Number(e.target.value))} /></Field>
        <Field label="Budget used (%)"><Input readOnly={readOnly} type="number" min="0" value={project.budget} onChange={(e) => update("budget", Number(e.target.value))} /></Field>
        <Field label="Total contract value"><Input readOnly={readOnly} type="number" min="0" value={project.contractValue ?? ""} onChange={(e) => update("contractValue", e.target.value === "" ? null : Number(e.target.value))} /></Field>
        <Field label="Workforce"><Input readOnly={readOnly} type="number" min="0" value={project.workforce} onChange={(e) => update("workforce", Number(e.target.value))} /></Field>
        <Field label="Due date"><Input readOnly={readOnly} type="date" value={project.due} onChange={(e) => update("due", e.target.value)} /></Field>
        <Field label="Project manager"><Input readOnly={readOnly} value={project.pm ?? ""} onChange={(e) => update("pm", e.target.value)} /></Field>
        <Field label="Description" wide><Textarea readOnly={readOnly} value={project.description ?? ""} onChange={(e) => update("description", e.target.value)} /></Field>
        {!readOnly && (
          <div className="md:col-span-2"><Button onClick={save} disabled={saving || deleting}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{saving ? "Saving…" : "Save changes"}</Button></div>
        )}
        {isEngineer && (
          <div className="space-y-2 md:col-span-2">
            <p className="text-xs text-muted-foreground">
              You can report progress on this project. Everything else is the
              Project Manager's to change.
            </p>
            <Button onClick={saveProgress} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {saving ? "Saving…" : "Save progress"}
            </Button>
          </div>
        )}
      </div>

      {!readOnly && (
        <div className="grid max-w-4xl grid-cols-1 gap-4 md:grid-cols-2">
          <TeamMemberPanel
            projectCode={project.code}
            role="engineer"
            label="Engineers"
            description="Engineers marked available here can be assigned to designs on this project by an Architect."
          />
          <TeamMemberPanel projectCode={project.code} role="architect" label="Architects" />
          <TeamMemberPanel projectCode={project.code} role="site-personnel" label="Site Personnel" />
          <TeamMemberPanel projectCode={project.code} role="consultant" label="Consultants" />
        </div>
      )}
    </div>
  );
}

function TeamMemberPanel({
  projectCode,
  role,
  label,
  description,
}: {
  projectCode: string;
  role: ProjectMemberRole;
  label: string;
  description?: string;
}) {
  const { members, loading, error, saving, addMember, removeMember } = useProjectMembers(projectCode, role);
  const { users: candidates } = useUsersByRole(role);
  const [selected, setSelected] = useState("");

  const availableToAdd = useMemo(
    () => candidates.filter((u) => !members.some((m) => m.userId === u.id)),
    [candidates, members],
  );

  const handleAdd = async () => {
    const user = candidates.find((u) => String(u.id) === selected);
    if (!user) return;
    const ok = await addMember(user.id, user.name);
    if (ok) setSelected("");
  };

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
      <div>
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <HardHat className="h-4 w-4 text-muted-foreground" />
          {label}
        </h2>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select value={selected} onValueChange={setSelected}>
          <SelectTrigger className="w-64 rounded-xl">
            <SelectValue placeholder={`Select a ${label.toLowerCase().replace(/s$/, "")}`} />
          </SelectTrigger>
          <SelectContent>
            {availableToAdd.length === 0 && (
              <div className="px-2 py-1.5 text-xs text-muted-foreground">
                No more people to add
              </div>
            )}
            {availableToAdd.map((u) => (
              <SelectItem key={u.id} value={String(u.id)}>
                {u.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" className="rounded-xl" disabled={!selected || saving} onClick={handleAdd}>
          <UserPlus className="h-3.5 w-3.5" /> Add
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : members.length === 0 ? (
        <p className="text-sm text-muted-foreground">No one assigned yet.</p>
      ) : (
        <ul className="space-y-2">
          {members.map((m) => (
            <li key={m.id} className="flex items-center justify-between rounded-xl border border-border px-4 py-2 text-sm">
              <span className="font-medium">{m.userName}</span>
              <button
                type="button"
                onClick={() => removeMember(m.id)}
                disabled={saving}
                className="text-muted-foreground hover:text-destructive"
                title="Remove"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Field({ label, children, wide = false }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return <div className={wide ? "space-y-1.5 md:col-span-2" : "space-y-1.5"}><Label>{label}</Label>{children}</div>;
}
