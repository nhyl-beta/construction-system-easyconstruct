import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProjectRepository } from "@/features/projects/repositories/project.repository";
import { PROJECT_CURRENCIES, RISK_LEVELS, type Project } from "@/features/projects/types/project.types";
import { formatCurrency } from "@/lib/format-currency";
import { useProjectMembers } from "@/features/project-members/hooks/use-project-members";
import { MilestonesPanel } from "@/features/milestones/components/MilestonesPanel";
import type { ProjectMemberRole } from "@/features/project-members/repositories/project-member.repository";
import { useUsersByRole } from "@/features/users/hooks/use-users-by-role";
import { ArrowLeft, HardHat, Loader2, Trash2, UserPlus, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useAuth } from "@/auth/auth-context";

/**
 * Who may change the record itself. This mirrors the route guards on
 * /api/projects (server/src/projects/routes.ts): POST, PATCH and DELETE are
 * granted to project-manager, admin and it-designer, plus engineer on PATCH
 * for progress only. Everyone else — Owner, Consultant, Architect, HR,
 * Finance — can read a project but any write they attempt comes back 403.
 */
const PROJECT_EDITORS = ["project-manager", "admin", "it-designer"];

/**
 * Where "Back" goes for each role. A viewer who reached this page from their
 * own list should return to it; /projects is the Project Manager's page and
 * is not in most of these roles' navigation at all.
 */
const LIST_ROUTE_BY_ROLE: Record<string, string> = {
  owner: "/owner/portfolio",
  consultant: "/consultant/projects",
  architect: "/architect/projects",
  admin: "/admin/projects",
  "it-designer": "/admin/projects",
};

export default function ProjectDetailPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const role = user?.role ?? "";
  const isEngineer = role === "engineer";
  // Editability is derived from the actual API grant rather than from a
  // single "is this the engineer" check. Owner reached this page from the
  // executive portfolio and was handed the Project Manager's full edit form —
  // Save and Delete included — every button on which returns 403. Read-only
  // roles now get a read-only record.
  const canEdit = PROJECT_EDITORS.includes(role);
  const canEditProgress = canEdit || isEngineer;
  const listRoute = LIST_ROUTE_BY_ROLE[role] ?? "/projects";

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
        currency: project.currency,
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
        siteLatitude: project.siteLatitude,
        siteLongitude: project.siteLongitude,
        geofenceRadiusM: project.geofenceRadiusM,
      });
      if (!updated) throw new Error("Project could not be updated.");
      // Was just setProject(updated) + a "Project saved." message that sat
      // on this same form — after confirming a save, the app should return
      // to the project table, not leave the editor open as if nothing
      // happened. Matches the New Project wizard, which already navigates
      // back to the list on success.
      navigate(listRoute);
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
      navigate(listRoute);
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
        <Button asChild variant="outline"><Link to={listRoute}>Back to projects</Link></Button>
      </div>
    );
  }

  const riskLabel =
    RISK_LEVELS.find((level) => level.value === project.risk)?.label ?? project.risk;

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8">
      <Button asChild variant="ghost" className="rounded-xl">
        <Link to={listRoute}><ArrowLeft className="mr-2 h-4 w-4" />Back to projects</Link>
      </Button>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{project.name}</h1>
          <p className="text-sm text-muted-foreground">{project.code}</p>
        </div>
        {canEdit && (
          <Button variant="destructive" onClick={remove} disabled={saving || deleting}>
            {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
            Delete
          </Button>
        )}
      </div>
      {error && <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}
      {/* Was border-green-500/bg-green-500/text-green-700 — same dark-mode
          contrast bug as RISK_CLASS (see project-status.ts): a raw Tailwind
          palette color with no dark-mode variant, unlike the semantic
          `success` token used here now, which App.css redefines per theme. */}
      {message && <div className="rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">{message}</div>}

      {!canEdit && !isEngineer && (
        <p className="max-w-4xl text-sm text-muted-foreground">
          This is a read-only view of the project record. Changes are the
          Project Manager's to make.
        </p>
      )}

      {/* Fields the current role cannot change are rendered as plain values.
          They used to be `<Input readOnly>` / `<Textarea readOnly>` /
          disabled `<Select>`, which look like editable controls, carry
          placeholder text where the record is simply empty, and invite an
          edit the API would refuse. A value nobody can change is text. */}
      <div className="grid max-w-4xl grid-cols-1 gap-5 rounded-2xl border border-border bg-card p-6 md:grid-cols-2">
        <Field label="Project name">
          {canEdit
            ? <Input value={project.name} onChange={(e) => update("name", e.target.value)} />
            : <ReadOnlyValue value={project.name} />}
        </Field>
        <Field label="Project code">
          {canEdit
            ? <Input value={project.code} onChange={(e) => update("code", e.target.value)} />
            : <ReadOnlyValue value={project.code} mono />}
        </Field>
        <Field label="Client">
          {canEdit
            ? <Input value={project.client} onChange={(e) => update("client", e.target.value)} />
            : <ReadOnlyValue value={project.client} />}
        </Field>
        <Field label="Location">
          {canEdit
            ? <Input value={project.location} onChange={(e) => update("location", e.target.value)} />
            : <ReadOnlyValue value={project.location} />}
        </Field>
        <Field label="Status">
          {canEdit
            ? <Input value={project.status} onChange={(e) => update("status", e.target.value)} />
            : <ReadOnlyValue value={project.status} />}
        </Field>
        {/* Risk was a free-text Input, so any spelling ("hi", "Severe") could
            be typed here; the value drives risk sorting on the Admin/PM/Owner
            dashboards and the backend enum only accepts Low/Medium/High, so a
            typo either failed the save or produced a project that sorted as
            "low" forever. Constrained to the same three levels the New
            Project form offers. */}
        <Field label="Risk">
          {canEdit ? (
            <Select
              value={project.risk}
              onValueChange={(v) => update("risk", v as Project["risk"])}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {RISK_LEVELS.map((level) => (
                  <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <ReadOnlyValue value={riskLabel} />
          )}
        </Field>
        <Field label="Progress (%)">
          {canEditProgress
            ? <Input type="number" min="0" max="100" value={project.progress} onChange={(e) => update("progress", Number(e.target.value))} />
            : <ReadOnlyValue value={`${project.progress}%`} />}
        </Field>
        <Field label="Budget used (%)">
          {canEdit
            ? <Input type="number" min="0" value={project.budget} onChange={(e) => update("budget", Number(e.target.value))} />
            : <ReadOnlyValue value={`${project.budget}%`} />}
        </Field>
        <Field label="Currency">
          {canEdit ? (
            <Select value={project.currency} onValueChange={(v) => update("currency", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PROJECT_CURRENCIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <ReadOnlyValue value={project.currency} />
          )}
        </Field>
        <Field label="Total contract value">
          {canEdit
            ? <Input type="number" min="0" value={project.contractValue ?? ""} onChange={(e) => update("contractValue", e.target.value === "" ? null : Number(e.target.value))} />
            // Was hardcoded to PHP formatting regardless of the project's
            // actual currency — see project-format.ts's formatContractValue
            // for the same bug on the table view.
            : <ReadOnlyValue value={project.contractValue == null ? null : formatCurrency(project.contractValue, project.currency)} />}
        </Field>
        <Field label="Workforce">
          {canEdit
            ? <Input type="number" min="0" value={project.workforce} onChange={(e) => update("workforce", Number(e.target.value))} />
            : <ReadOnlyValue value={String(project.workforce)} />}
        </Field>
        <Field label="Due date">
          {canEdit
            ? <DatePicker value={project.due} onChange={(v) => update("due", v)} placeholder="Select due date" clearable={false} />
            : <ReadOnlyValue value={project.due} />}
        </Field>
        <Field label="Project manager">
          {canEdit
            ? <Input value={project.pm ?? ""} onChange={(e) => update("pm", e.target.value)} />
            : <ReadOnlyValue value={project.pm} />}
        </Field>
        <Field label="Description" wide>
          {canEdit
            ? <Textarea value={project.description ?? ""} onChange={(e) => update("description", e.target.value)} />
            : <ReadOnlyValue value={project.description} multiline />}
        </Field>

        {/* Site geofence. attendance/service.ts measures every site clock-in
            against these three columns, but no screen could set them, so they
            were NULL on every project: no distance was ever calculated and
            HR's attendance review had nothing to confirm a location against. */}
        <div className="md:col-span-2">
          <h2 className="text-sm font-semibold">Site geofence</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Site Personnel clock-ins are measured against this position. Leave
            the coordinates empty to record attendance without a geofence
            check — HR then confirms those clock-ins by hand.
          </p>
        </div>
        <Field label="Site latitude">
          {canEdit
            ? <Input type="number" step="0.0000001" min="-90" max="90" placeholder="14.5995" value={project.siteLatitude ?? ""} onChange={(e) => update("siteLatitude", e.target.value === "" ? null : Number(e.target.value))} />
            : <ReadOnlyValue value={project.siteLatitude == null ? null : String(project.siteLatitude)} mono />}
        </Field>
        <Field label="Site longitude">
          {canEdit
            ? <Input type="number" step="0.0000001" min="-180" max="180" placeholder="120.9842" value={project.siteLongitude ?? ""} onChange={(e) => update("siteLongitude", e.target.value === "" ? null : Number(e.target.value))} />
            : <ReadOnlyValue value={project.siteLongitude == null ? null : String(project.siteLongitude)} mono />}
        </Field>
        <Field label="Geofence radius (m)">
          {canEdit
            ? <Input type="number" min="10" max="20000" value={project.geofenceRadiusM ?? ""} onChange={(e) => update("geofenceRadiusM", e.target.value === "" ? null : Number(e.target.value))} />
            : <ReadOnlyValue value={project.geofenceRadiusM == null ? null : `${project.geofenceRadiusM} m`} />}
        </Field>

        {canEdit && (
          <div className="md:col-span-2"><Button onClick={save} disabled={saving || deleting}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{saving ? "Saving…" : "Save changes"}</Button></div>
        )}
        {!canEdit && isEngineer && (
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

      {/* The team is part of "the details per project", so viewers see it —
          as a list, without the add/remove controls their role cannot use. */}
      <div className="grid max-w-4xl grid-cols-1 gap-4 md:grid-cols-2">
        <TeamMemberPanel
          projectCode={project.code}
          role="engineer"
          label="Engineers"
          readOnly={!canEdit}
          description={
            canEdit
              ? "Engineers marked available here can be assigned to designs on this project by an Architect."
              : undefined
          }
        />
        <TeamMemberPanel projectCode={project.code} role="architect" label="Architects" readOnly={!canEdit} />
        <TeamMemberPanel projectCode={project.code} role="site-personnel" label="Site Personnel" readOnly={!canEdit} />
        <TeamMemberPanel projectCode={project.code} role="consultant" label="Consultants" readOnly={!canEdit} />
      </div>

      <div className="max-w-4xl">
        <MilestonesPanel projectCode={project.code} canManage={canEdit} />
      </div>
    </div>
  );
}

function TeamMemberPanel({
  projectCode,
  role,
  label,
  description,
  readOnly = false,
}: {
  projectCode: string;
  role: ProjectMemberRole;
  label: string;
  description?: string;
  readOnly?: boolean;
}) {
  const { members, loading, error, saving, addMember, removeMember } = useProjectMembers(projectCode, role);
  const { users: candidates } = useUsersByRole(role, { enabled: !readOnly });
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

      {!readOnly && (
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
      )}

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
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => removeMember(m.id)}
                  disabled={saving}
                  className="text-muted-foreground hover:text-destructive"
                  title="Remove"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
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

/** A field the current role cannot change: the value, not a disabled input. */
function ReadOnlyValue({
  value,
  mono = false,
  multiline = false,
}: {
  value: string | null | undefined;
  mono?: boolean;
  multiline?: boolean;
}) {
  if (!value) {
    return <p className="py-1.5 text-sm text-muted-foreground">Not recorded</p>;
  }
  return (
    <p
      className={[
        "py-1.5 text-sm",
        mono ? "font-mono" : "",
        multiline ? "whitespace-pre-wrap break-words" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {value}
    </p>
  );
}
