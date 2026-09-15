import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ProjectRepository } from "@/features/projects/repositories/project.repository";
import type { Project } from "@/features/projects/types/project.types";
import { ArrowLeft, Loader2, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";

export default function ProjectDetailPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
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
        workforce: project.workforce,
        due: project.due,
        risk: project.risk[0].toUpperCase() + project.risk.slice(1),
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
        <Button variant="destructive" onClick={remove} disabled={saving || deleting}>
          {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
          Delete
        </Button>
      </div>
      {error && <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}
      {message && <div className="rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-700">{message}</div>}
      <div className="grid max-w-4xl grid-cols-1 gap-5 rounded-2xl border border-border bg-card p-6 md:grid-cols-2">
        <Field label="Project name"><Input value={project.name} onChange={(e) => update("name", e.target.value)} /></Field>
        <Field label="Project code"><Input value={project.code} onChange={(e) => update("code", e.target.value)} /></Field>
        <Field label="Client"><Input value={project.client} onChange={(e) => update("client", e.target.value)} /></Field>
        <Field label="Location"><Input value={project.location} onChange={(e) => update("location", e.target.value)} /></Field>
        <Field label="Status"><Input value={project.status} onChange={(e) => update("status", e.target.value)} /></Field>
        <Field label="Risk"><Input value={project.risk} onChange={(e) => update("risk", e.target.value as Project["risk"])} /></Field>
        <Field label="Progress (%)"><Input type="number" min="0" max="100" value={project.progress} onChange={(e) => update("progress", Number(e.target.value))} /></Field>
        <Field label="Budget used (%)"><Input type="number" min="0" value={project.budget} onChange={(e) => update("budget", Number(e.target.value))} /></Field>
        <Field label="Workforce"><Input type="number" min="0" value={project.workforce} onChange={(e) => update("workforce", Number(e.target.value))} /></Field>
        <Field label="Due date"><Input type="date" value={project.due} onChange={(e) => update("due", e.target.value)} /></Field>
        <Field label="Project manager"><Input value={project.pm ?? ""} onChange={(e) => update("pm", e.target.value)} /></Field>
        <Field label="Description" wide><Textarea value={project.description ?? ""} onChange={(e) => update("description", e.target.value)} /></Field>
        <div className="md:col-span-2"><Button onClick={save} disabled={saving || deleting}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{saving ? "Saving…" : "Save changes"}</Button></div>
      </div>
    </div>
  );
}

function Field({ label, children, wide = false }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return <div className={wide ? "space-y-1.5 md:col-span-2" : "space-y-1.5"}><Label>{label}</Label>{children}</div>;
}
