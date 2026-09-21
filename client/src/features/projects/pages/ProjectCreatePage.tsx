import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { MultiStepPage, type Step } from "@/components/ui/multi-step-page";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ProjectRepository } from "@/features/projects/repositories/project.repository";
import { ProjectMemberRepository, type ProjectMemberRole } from "@/features/project-members/repositories/project-member.repository";
import { useAuth } from "@/auth/auth-context";
import { useUsersByRole } from "@/features/users/hooks/use-users-by-role";
import { Info, MapPin, UserCheck } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { PROJECT_CURRENCIES, RISK_LEVELS } from "@/features/projects/types/project.types";

const ASSIGNABLE_TEAM_ROLES: { role: ProjectMemberRole; label: string }[] = [
  { role: "architect", label: "Architect" },
  { role: "engineer", label: "Engineer" },
  { role: "site-personnel", label: "Site Personnel" },
  { role: "consultant", label: "Consultant" },
];

type TeamSelections = Partial<Record<ProjectMemberRole, { id: number; name: string }>>;

const STEPS: Step[] = [
  {
    number: 1,
    title: "Project information",
    subtitle: "Basic details about the project",
  },
  {
    number: 2,
    title: "Scope & schedule",
    subtitle: "Define scope and timeline",
  },
  {
    number: 3,
    title: "Budget & financials",
    subtitle: "Set initial budget and financials",
  },
  {
    number: 4,
    title: "Team & stakeholders",
    subtitle: "Assign team and stakeholders",
  },
  {
    number: 5,
    title: "Review & confirm",
    subtitle: "Review and create project",
  },
];

interface ProjectFormData {
  name: string;
  code: string;
  client: string;
  location: string;
  risk: "low" | "medium" | "high";
  description: string;
  due: string;
  pm: string;
  contractValue: string;
  currency: string;
  // Collected for UX but not yet persisted — schema doesn't have these columns:
  contingencyPct: string;
  type: string;
  contractType: string;
  startDate: string;
}

const initialForm: ProjectFormData = {
  name: "",
  code: "",
  client: "",
  location: "",
  risk: "low",
  description: "",
  due: "",
  pm: "",
  contractValue: "",
  contingencyPct: "",
  type: "",
  contractType: "",
  currency: "PHP",
  startDate: "",
};

export default function ProjectCreatePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  // A Project Manager creating their own project is always its PM, so their
  // name is seeded. An Admin/IT Designer must PICK one — seeding their own
  // name there put a value in the Select that is not one of its options, so
  // Radix rendered an empty trigger AND suppressed the placeholder, which is
  // why that field looked like it had no placeholder at all.
  const [data, setData] = useState<ProjectFormData>(() => ({
    ...initialForm,
    pm: user?.role === "project-manager" ? user.name : "",
  }));
  // EC-013/018: optional team assignment at creation time, one person per
  // role — applied via project-members right after the project is created.
  const [team, setTeam] = useState<TeamSelections>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof ProjectFormData>(
    key: K,
    value: ProjectFormData[K],
  ) => setData((prev) => ({ ...prev, [key]: value }));

  const isAdmin = user?.role === "admin" || user?.role === "it-designer";
  const projectsListRoute = isAdmin ? "/admin/projects" : "/projects";

  const handleCancel = () => navigate(projectsListRoute);

  const handleSubmit = async () => {
    const required: Array<[string, string]> = [
      ["Project name", data.name],
      ["Project code", data.code],
      ["Client / Owner", data.client],
      ["Location", data.location],
      ["Due date", data.due],
    ];
    if (user?.role !== "project-manager") {
      required.push(["Project Manager", data.pm]);
    }
    const missing = required.find(([, value]) => !value.trim());
    if (missing) {
      setError(`${missing[0]} is required.`);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const created = await ProjectRepository.create({
        name: data.name.trim(),
        code: data.code.trim(),
        client: data.client,
        currency: data.currency,
        location: data.location.trim(),
        risk: data.risk,
        due: data.due,
        pm: data.pm,
        description: data.description.trim() || undefined,
        status: "Planning",
        statusTone: "neutral",
        progress: 0,
        // budget is utilisation-to-date (a percentage), which starts at zero;
        // the contract amount is its own column.
        budget: 0,
        contractValue: data.contractValue.trim()
          ? Number(data.contractValue)
          : undefined,
        workforce: 0,
      });

      const projectCode = created?.code ?? data.code.trim();
      const assignments = Object.entries(team) as [ProjectMemberRole, { id: number; name: string }][];
      // Best-effort: the project already exists at this point, so a failed
      // assignment shouldn't block navigation — it can still be added from
      // the project detail page.
      await Promise.allSettled(
        assignments.map(([role, person]) =>
          ProjectMemberRepository.create({
            projectCode,
            userId: person.id,
            userName: person.name,
            role,
          }),
        ),
      );

      navigate(projectsListRoute);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create project.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MultiStepPage
      title="New project"
      description="Create a new construction project and set up the foundation for success."
      steps={STEPS}
      currentStep={step}
      onNext={() => setStep((s) => Math.min(s + 1, STEPS.length))}
      onBack={() => setStep((s) => Math.max(s - 1, 1))}
      onCancel={handleCancel}
      onSubmit={handleSubmit}
      isLastStep={step === STEPS.length}
      isFirstStep={step === 1}
      submitting={submitting}
      error={error}
      aiHint="Use AI to generate project timeline from a proposal or document."
    >
      {step === 1 && <StepProjectInfo data={data} set={set} />}
      {step === 2 && <StepScopeSchedule />}
      {step === 3 && <StepBudget data={data} set={set} />}
      {step === 4 && (
        <StepTeam data={data} set={set} currentUserRole={user?.role ?? ""} team={team} setTeam={setTeam} />
      )}
      {step === 5 && <StepReview data={data} />}
    </MultiStepPage>
  );
}

// ── Step 1 — Project Information ─────────────────────────────────────────────

function StepProjectInfo({
  data,
  set,
}: {
  data: ProjectFormData;
  set: <K extends keyof ProjectFormData>(
    key: K,
    value: ProjectFormData[K],
  ) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold text-foreground">
          Project information
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Provide the basic details of your new project.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <Label>
            Project name <span className="text-destructive">*</span>
          </Label>
          <Input
            placeholder="e.g. Westgate Commercial Tower"
            value={data.name}
            onChange={(e) => set("name", e.target.value)}
            className="rounded-xl"
          />
        </div>

        <div className="space-y-1.5">
          <Label>
            Project code <span className="text-destructive">*</span>
          </Label>
          <Input
            placeholder="e.g. WGT-2025-001"
            value={data.code}
            onChange={(e) => set("code", e.target.value)}
            className="rounded-xl"
          />
        </div>

        {/* Project.client is stored/rendered as free text, not a slug — the
            datalist just suggests existing clients while still letting the
            admin type a brand-new one. */}
        <div className="space-y-1.5">
          <Label>
            Client / Owner <span className="text-destructive">*</span>
          </Label>
          <Input
            list="client-options"
            placeholder="Select or type a new client"
            value={data.client}
            onChange={(e) => set("client", e.target.value)}
            className="rounded-xl"
          />
          <datalist id="client-options">
            <option value="Westgate Health Group" />
            <option value="Harbor Freight Corp" />
            <option value="City of Riverside" />
            <option value="NR Airport Authority" />
            <option value="GreenPower Inc." />
          </datalist>
        </div>

        <div className="space-y-1.5">
          <Label>Project type</Label>
          <Select onValueChange={(v) => set("type", v)}>
            <SelectTrigger className="rounded-xl">
              <SelectValue placeholder="Select project type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Commercial">Commercial</SelectItem>
              <SelectItem value="Residential">Residential</SelectItem>
              <SelectItem value="Infrastructure">Infrastructure</SelectItem>
              <SelectItem value="Industrial">Industrial</SelectItem>
              <SelectItem value="Renewable Energy">Renewable Energy</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>
            Location <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Enter project location"
              value={data.location}
              onChange={(e) => set("location", e.target.value)}
              className="rounded-xl pl-9"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>
            Risk level <span className="text-destructive">*</span>
          </Label>
          <Select
            value={data.risk}
            onValueChange={(v) => set("risk", v as ProjectFormData["risk"])}
          >
            <SelectTrigger className="rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RISK_LEVELS.map((level) => (
                <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Contract type</Label>
          <Select onValueChange={(v) => set("contractType", v)}>
            <SelectTrigger className="rounded-xl">
              <SelectValue placeholder="Select contract type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Lump Sum">Lump Sum</SelectItem>
              <SelectItem value="Cost Plus">Cost Plus</SelectItem>
              <SelectItem value="Time & Material">Time & Material</SelectItem>
              <SelectItem value="Unit Price">Unit Price</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Currency</Label>
          {/* Now a real selector: projects.currency exists, the API accepts
              it (project-validator.ts) and every amount on the project is
              rendered through it, so a non-PHP choice is one the system can
              actually honour. It was previously frozen at PHP because there
              was nowhere to store the value. */}
          <Select
            value={data.currency}
            onValueChange={(v) => set("currency", v)}
          >
            <SelectTrigger className="rounded-xl">
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              {PROJECT_CURRENCIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Description</Label>
        <Textarea
          placeholder="Brief description of the project, objectives, and key deliverables..."
          value={data.description}
          onChange={(e) => set("description", e.target.value)}
          className="h-28 resize-none rounded-xl"
          maxLength={500}
        />
        <div className="text-right text-[11px] text-muted-foreground">
          {data.description.length}/500
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <Label>Planned start date</Label>
          <DatePicker
            value={data.startDate}
            onChange={(v) => set("startDate", v)}
            placeholder="Select start date"
          />
        </div>
        <div className="space-y-1.5">
          <Label>
            Due date <span className="text-destructive">*</span>
          </Label>
          <DatePicker
            value={data.due}
            onChange={(v) => set("due", v)}
            placeholder="Select due date"
            clearable={false}
          />
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-info/20 bg-info/5 px-4 py-3">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-info" />
        <p className="text-xs text-muted-foreground">
          You can always edit these details later. All fields marked with{" "}
          <span className="font-medium text-destructive">*</span> are required.
        </p>
      </div>
    </div>
  );
}

// ── Step 2 — Scope & Schedule ─────────────────────────────────────────────────

function StepScopeSchedule() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold">Scope & schedule</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Define the project scope and timeline milestones. (Not yet persisted —
          informational only.)
        </p>
      </div>
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label>Project scope summary</Label>
          <Textarea
            placeholder="Describe the full scope of work..."
            className="h-32 resize-none rounded-xl"
          />
        </div>
      </div>
    </div>
  );
}

// ── Step 3 — Budget ───────────────────────────────────────────────────────────

function StepBudget({
  data,
  set,
}: {
  data: ProjectFormData;
  set: <K extends keyof ProjectFormData>(
    key: K,
    value: ProjectFormData[K],
  ) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold">Budget & financials</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Total contract value is saved with the project. Contingency is
          informational only — there's no column for it yet.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <Label htmlFor="contract-value">Total contract value</Label>
          <Input
            id="contract-value"
            type="number"
            min="0"
            value={data.contractValue}
            onChange={(e) => set("contractValue", e.target.value)}
            placeholder="0.00"
            className="rounded-xl"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="contingency">Contingency (%)</Label>
          <Input
            id="contingency"
            type="number"
            min="0"
            value={data.contingencyPct}
            onChange={(e) => set("contingencyPct", e.target.value)}
            placeholder="10"
            className="rounded-xl"
          />
        </div>
      </div>
    </div>
  );
}

// ── Step 4 — Team ─────────────────────────────────────────────────────────────

function StepTeam({
  data,
  set,
  currentUserRole,
  team,
  setTeam,
}: {
  data: ProjectFormData;
  set: <K extends keyof ProjectFormData>(
    key: K,
    value: ProjectFormData[K],
  ) => void;
  currentUserRole: string;
  team: TeamSelections;
  setTeam: (updater: (prev: TeamSelections) => TeamSelections) => void;
}) {
  // A Project Manager creating their own project can't assign a different
  // PM — it's always them. Admin/IT Designer still assign a real PM, picked
  // from actual project-manager accounts (not the old hardcoded name list).
  const isSelfAssigned = currentUserRole === "project-manager";
  const { users: pmOptions, loading: pmOptionsLoading } = useUsersByRole(
    isSelfAssigned ? null : "project-manager",
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold">Team & stakeholders</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {isSelfAssigned
            ? "You'll be assigned as this project's Project Manager."
            : "Assign the project team and key stakeholders."}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <Label>
            Project Manager
            {!isSelfAssigned && <span className="text-destructive"> *</span>}
          </Label>
          {isSelfAssigned ? (
            <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2 text-sm">
              <UserCheck className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{data.pm || "You"}</span>
            </div>
          ) : (
            <Select
              value={data.pm || undefined}
              onValueChange={(v) => set("pm", v)}
            >
              <SelectTrigger className="rounded-xl">
                {/* `value` is passed as undefined rather than "" when nothing
                    is picked — Radix treats "" as a real selected value and
                    renders an empty trigger instead of the placeholder. */}
                <SelectValue
                  placeholder={
                    pmOptionsLoading ? "Loading…" : "Select project manager"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {pmOptions.length === 0 && !pmOptionsLoading && (
                  <div className="px-2 py-1.5 text-xs text-muted-foreground">
                    No project managers on file
                  </div>
                )}
                {pmOptions.map((u) => (
                  <SelectItem key={u.id} value={u.name}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {ASSIGNABLE_TEAM_ROLES.map(({ role, label }) => (
          <TeamRolePicker
            key={role}
            role={role}
            label={label}
            selected={team[role] ?? null}
            onChange={(person) =>
              setTeam((prev) => {
                const next = { ...prev };
                if (person) next[role] = person;
                else delete next[role];
                return next;
              })
            }
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Team assignment is optional here — the Project Manager can also add or
        change team members later from the project's detail page.
      </p>
    </div>
  );
}

function TeamRolePicker({
  role,
  label,
  selected,
  onChange,
}: {
  role: ProjectMemberRole;
  label: string;
  selected: { id: number; name: string } | null;
  onChange: (person: { id: number; name: string } | null) => void;
}) {
  const { users, loading } = useUsersByRole(role);

  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Select
        value={selected ? String(selected.id) : ""}
        onValueChange={(v) => {
          const user = users.find((u) => String(u.id) === v);
          onChange(user ? { id: user.id, name: user.name } : null);
        }}
      >
        <SelectTrigger className="rounded-xl">
          <SelectValue placeholder={loading ? "Loading…" : `Select ${label.toLowerCase()} (optional)`} />
        </SelectTrigger>
        <SelectContent>
          {users.length === 0 && !loading && (
            <div className="px-2 py-1.5 text-xs text-muted-foreground">
              No {label.toLowerCase()}s on file
            </div>
          )}
          {users.map((u) => (
            <SelectItem key={u.id} value={String(u.id)}>
              {u.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// ── Step 5 — Review ───────────────────────────────────────────────────────────

function StepReview({ data }: { data: ProjectFormData }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold">Review & confirm</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Confirm project details before creating.
        </p>
      </div>
      <div className="divide-y divide-border rounded-xl border border-border bg-muted/30">
        {[
          { label: "Project name", value: data.name || "—" },
          { label: "Project code", value: data.code || "—" },
          { label: "Client", value: data.client || "—" },
          { label: "Location", value: data.location || "—" },
          { label: "Project Manager", value: data.pm || "—" },
          { label: "Risk", value: data.risk },
          { label: "Due date", value: data.due || "—" },
          { label: "Currency", value: data.currency },
          {
            label: "Total contract value",
            value: data.contractValue
              ? `${data.currency} ${Number(data.contractValue).toLocaleString()}`
              : "—",
          },
        ].map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between px-5 py-3 text-sm"
          >
            <span className="text-muted-foreground">{row.label}</span>
            <span className="font-medium text-foreground">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
